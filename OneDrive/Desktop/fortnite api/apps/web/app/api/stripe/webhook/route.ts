import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db, admin } from '../../../../lib/firebase-admin';
import { notifyPurchase } from '../../../../lib/discord-webhook';

// Mark as dynamic - webhooks need raw body
export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-11-17.clover',
});

export async function POST(req: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('❌ STRIPE_SECRET_KEY not set');
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('❌ STRIPE_WEBHOOK_SECRET not set');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Get the raw body as text (required for webhook signature verification)
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');

    if (!sig) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: any) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      );
    }

    console.log('✅ Stripe webhook received:', {
      type: event.type,
      id: event.id,
      created: new Date(event.created * 1000).toISOString(),
    });

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('🎯 Checkout session completed - FULL DETAILS:', {
          sessionId: session.id,
          customerId: session.customer,
          subscriptionId: session.subscription,
          userId: session.metadata?.userId,
          metadata: session.metadata,
          mode: session.mode,
          paymentStatus: session.payment_status,
          status: session.status,
        });

        // Activate user subscription in Firestore
        if (session.metadata?.userId) {
          const userId = session.metadata.userId; // Declare outside try block for catch scope
          try {
            const addonsRaw = session.metadata.addons;
            let addonsList: string[] = [];
            
            // Parse addons
            if (addonsRaw && addonsRaw !== 'none') {
              try {
                addonsList = JSON.parse(addonsRaw);
              } catch {
                addonsList = [];
              }
            }
            
            const now = admin.firestore.Timestamp.now();
            
            // Check if purchase is within first 2 months of launch (Dec 12, 2025)
            // Anyone who buys in the first 2 months gets an extra month free
            const LAUNCH_DATE = new Date('2025-12-12T00:01:00Z');
            const TWO_MONTHS_AFTER_LAUNCH = new Date(LAUNCH_DATE);
            TWO_MONTHS_AFTER_LAUNCH.setMonth(TWO_MONTHS_AFTER_LAUNCH.getMonth() + 2);
            
            const purchaseDate = new Date(now.toMillis());
            const isWithinFirstTwoMonths = purchaseDate <= TWO_MONTHS_AFTER_LAUNCH;
            
            // If within first 2 months, give 60 days (2 months) instead of 30 days (1 month)
            const subscriptionDays = isWithinFirstTwoMonths ? 60 : 30;
            const nextMonth = admin.firestore.Timestamp.fromMillis(now.toMillis() + (subscriptionDays * 24 * 60 * 60 * 1000));
            
            console.log('📝 Updating Firebase with subscription data:', {
              userId,
              customerId: session.customer,
              subscriptionId: session.subscription,
              addons: addonsList,
              isWithinFirstTwoMonths,
              subscriptionDays,
              bonusMonth: isWithinFirstTwoMonths ? 'YES - Extra month free!' : 'NO',
            });
            
            // Update user document with subscription info
            try {
              await db.collection('users').doc(userId).set({
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: session.subscription as string,
                isPremium: true,
                plan: 'pro',
                addons: addonsList,
                subscriptionStatus: 'active',
                subscribedAt: now,
                updatedAt: now
              }, { merge: true });
              console.log('✅ Users collection updated');
            } catch (userError) {
              console.error('❌ Failed to update users collection:', userError);
              throw userError;
            }

            // Create/update subscription document
            try {
              await db.collection('subscriptions').doc(userId).set({
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: session.subscription as string,
                status: 'active',
                plan: 'pro',
                addons: addonsList,
                createdAt: now,
                updatedAt: now,
                periodEnd: nextMonth, // Include periodEnd for bonus month tracking
                bonusMonthApplied: isWithinFirstTwoMonths // Track if bonus month was applied
              }, { merge: true });
              console.log('✅ Subscriptions collection updated');
            } catch (subError) {
              console.error('❌ Failed to update subscriptions collection:', subError);
              throw subError;
            }

            // Initialize/reset usage limits for Pro tier
            try {
              await db.collection('usage').doc(userId).set({
                textMessagesThisPeriod: 0,
                voiceSecondsThisPeriod: 0,
                voiceInteractionsThisPeriod: 0,
                periodStart: now,
                periodEnd: nextMonth,
                tier: 'pro',
                hasVoiceAddon: addonsList.includes('Voice Interaction'),
                lastUpdated: now
              }, { merge: true });
              console.log('✅ Usage collection updated');
            } catch (usageError) {
              console.error('❌ Failed to update usage collection:', usageError);
              throw usageError;
            }

            console.log('✅✅✅ User subscription FULLY activated in Firebase:', {
              userId,
              plan: 'pro',
              addons: addonsList,
              hasVoiceAddon: addonsList.includes('Voice Interaction')
            });

            // Send Discord webhook notification for purchase
            try {
              // Get user email from Firestore
              const userDoc = await db.collection('users').doc(userId).get();
              const userData = userDoc.data();
              const userEmail = userData?.email || '';

              // Get amount from session if available
              const amountTotal = session.amount_total || 0;
              const currency = session.currency || 'usd';

              await notifyPurchase({
                userId,
                email: userEmail,
                customerId: session.customer as string,
                subscriptionId: session.subscription as string,
                amount: amountTotal,
                currency: currency,
                plan: 'pro',
                addons: addonsList,
              });
            } catch (discordError) {
              console.error('[ERROR] Failed to send Discord webhook for purchase:', discordError);
              // Don't fail the request if Discord webhook fails
            }
          } catch (error: any) {
            console.error('❌❌❌ CRITICAL ERROR activating subscription:', {
              error: error.message,
              stack: error.stack,
              userId,
              sessionId: session.id,
            });
          }
        }

        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('✅ Subscription created:', {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
        });
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('✅ Subscription updated:', {
          subscriptionId: subscription.id,
          status: subscription.status,
        });

        // Find user by subscription ID and update status
        try {
          const usersSnapshot = await db.collection('users')
            .where('stripeSubscriptionId', '==', subscription.id)
            .limit(1)
            .get();

          if (!usersSnapshot.empty) {
            const userDoc = usersSnapshot.docs[0];
            await userDoc.ref.update({
              subscriptionStatus: subscription.status,
              isPremium: subscription.status === 'active',
              updatedAt: admin.firestore.Timestamp.now()
            });

            await db.collection('subscriptions').doc(userDoc.id).update({
              status: subscription.status,
              updatedAt: admin.firestore.Timestamp.now()
            });

            console.log('✅ User subscription status updated:', subscription.status);
          }
        } catch (error) {
          console.error('❌ Error updating subscription:', error);
        }
        
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('✅ Subscription deleted/canceled:', {
          subscriptionId: subscription.id,
        });

        // Deactivate user subscription
        try {
          const usersSnapshot = await db.collection('users')
            .where('stripeSubscriptionId', '==', subscription.id)
            .limit(1)
            .get();

          if (!usersSnapshot.empty) {
            const userDoc = usersSnapshot.docs[0];
            await userDoc.ref.update({
              subscriptionStatus: 'canceled',
              isPremium: false,
              plan: 'free',
              canceledAt: admin.firestore.Timestamp.now(),
              updatedAt: admin.firestore.Timestamp.now()
            });

            await db.collection('subscriptions').doc(userDoc.id).update({
              status: 'canceled',
              canceledAt: admin.firestore.Timestamp.now(),
              updatedAt: admin.firestore.Timestamp.now()
            });

            console.log('✅ User subscription deactivated');
          }
        } catch (error) {
          console.error('❌ Error deactivating subscription:', error);
        }

        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('✅ Invoice payment succeeded:', {
          invoiceId: invoice.id,
          subscriptionId: (invoice as any).subscription,
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('⚠️  Invoice payment failed:', {
          invoiceId: invoice.id,
          subscriptionId: (invoice as any).subscription,
        });
        // TODO: Notify user of failed payment
        break;
      }

      default:
        console.log(`ℹ️  Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json(
      { 
        error: 'Webhook processing failed',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}



