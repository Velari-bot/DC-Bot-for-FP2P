import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db, admin } from '@/lib/firebase-admin';
import { ADDONS, BASE_PLAN } from '@/lib/subscription-config';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-11-17.clover',
});

interface UpdateSubscriptionRequest {
  userId: string;
  addons: string[]; // Array of addon IDs (e.g., ['voice-interaction', 'gameplay-analysis'])
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('❌ STRIPE_SECRET_KEY not set');
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const body = await req.json();
    const { userId, addons } = body as UpdateSubscriptionRequest;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('🔄 Updating subscription for user:', { userId, requestedAddons: addons });

    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const stripeSubscriptionId = userData?.stripeSubscriptionId;

    if (!stripeSubscriptionId) {
      return NextResponse.json({ 
        error: 'No active subscription found. Please subscribe first.' 
      }, { status: 400 });
    }

    // Get current subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    
    if (subscription.status !== 'active') {
      return NextResponse.json({ 
        error: 'Subscription is not active' 
      }, { status: 400 });
    }

    console.log('📊 Current subscription items:', subscription.items.data.map(item => ({
      id: item.id,
      priceId: item.price.id,
      quantity: item.quantity,
    })));

    // Get available addons only
    const availableAddons = ADDONS.filter(a => a.available);
    
    // Validate that all requested addons are available
    const unavailableAddons = addons.filter(addonId => {
      const addon = ADDONS.find(a => a.id === addonId);
      return !addon || !addon.available;
    });

    if (unavailableAddons.length > 0) {
      console.warn(`[STRIPE] Blocked ${unavailableAddons.length} unavailable add-on(s):`, unavailableAddons);
      return NextResponse.json(
        { 
          error: 'Some add-ons are not available',
          message: 'One or more selected add-ons are temporarily unavailable. Add-ons will be rolled out in a future update.',
          unavailableAddons
        },
        { status: 400 }
      );
    }
    
    // Find which addons to add and which to remove
    const requestedPriceIds = addons
      .map(addonId => {
        const addon = availableAddons.find(a => a.id === addonId);
        return addon?.stripePriceId;
      })
      .filter((priceId): priceId is string => Boolean(priceId));

    const currentAddonItems = subscription.items.data.filter(
      item => item.price.id !== BASE_PLAN.stripePriceId
    );

    const currentPriceIds = currentAddonItems.map(item => item.price.id);

    const toAdd = requestedPriceIds.filter(priceId => !currentPriceIds.includes(priceId));
    const toRemove = currentAddonItems.filter(
      item => !requestedPriceIds.includes(item.price.id)
    );

    console.log('📊 Subscription changes:', {
      currentAddons: currentPriceIds,
      requestedAddons: requestedPriceIds,
      toAdd,
      toRemove: toRemove.map(item => ({ id: item.id, priceId: item.price.id })),
    });

    // Build items array for update
    const items: Stripe.SubscriptionUpdateParams.Item[] = [];

    // Add new items
    for (const priceId of toAdd) {
      items.push({
        price: priceId as string,
      });
      console.log(`➕ Adding addon: ${priceId}`);
    }

    // Remove old items
    for (const item of toRemove) {
      items.push({
        id: item.id,
        deleted: true,
      });
      console.log(`➖ Removing addon: ${item.id} (${item.price.id})`);
    }

    // Update the subscription in Stripe
    let updatedSubscription;
    try {
      // Only update if there are changes to make
      if (items.length === 0) {
        console.log('ℹ️ No changes needed - subscription already matches requested state');
        updatedSubscription = subscription;
      } else {
        console.log('🔄 Calling Stripe API to update subscription...');
        updatedSubscription = await stripe.subscriptions.update(stripeSubscriptionId, {
          items: items,
          proration_behavior: 'none', // No prorations
          billing_cycle_anchor: 'unchanged', // Keep current billing cycle
          metadata: {
            userId,
            addons: JSON.stringify(addons.map(id => {
              const addon = ADDONS.find(a => a.id === id);
              return addon?.name || id;
            })),
          },
        });
      }
    } catch (stripeError: any) {
      console.error('❌ Stripe API error:', {
        message: stripeError.message,
        type: stripeError.type,
        code: stripeError.code,
        param: stripeError.param,
        statusCode: stripeError.statusCode,
        raw: JSON.stringify(stripeError.raw || {}),
      });
      throw new Error(`Stripe error: ${stripeError.message}`);
    }

    console.log('✅ Subscription updated in Stripe:', {
      subscriptionId: updatedSubscription.id,
      status: updatedSubscription.status,
      items: updatedSubscription.items.data.length,
    });

    // Update Firebase with the new addon list
    const addonNames = addons.map(id => {
      const addon = ADDONS.find(a => a.id === id);
      return addon?.name || id;
    });

    await db.collection('users').doc(userId).update({
      addons: addonNames,
      updatedAt: admin.firestore.Timestamp.now(),
    });

    await db.collection('subscriptions').doc(userId).update({
      addons: addonNames,
      updatedAt: admin.firestore.Timestamp.now(),
    });

    console.log('✅ Firebase updated with new addons:', addonNames);

    // Get the next billing date
    const nextBillingTimestamp = (updatedSubscription as any).current_period_end || Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
    const nextBillingDate = new Date(nextBillingTimestamp * 1000).toISOString();

    return NextResponse.json({
      success: true,
      message: 'Subscription updated successfully.',
      note: 'Changes will take effect at your next billing cycle.',
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        addons: addonNames,
        nextBillingDate,
      },
    });

  } catch (error: any) {
    console.error('❌ Error updating subscription:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update subscription', 
        message: error.message,
        details: error.stack,
      },
      { status: 500 }
    );
  }
}

