import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { ADDONS } from '@/lib/subscription-config';

// Mark as dynamic since we're using request data
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Check for Stripe secret key first
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeSecretKey) {
      console.error('❌ STRIPE_SECRET_KEY not set in environment variables');
      return NextResponse.json(
        { 
          error: 'Stripe not configured',
          message: 'Please set STRIPE_SECRET_KEY in environment variables.',
          details: 'Missing STRIPE_SECRET_KEY in .env.local or Vercel environment variables'
        },
        { status: 500 }
      );
    }

    // Initialize Stripe only if key exists
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-11-17.clover',
    });

    const body = await req.json();
    const { 
      planType = 'pro', 
      userId, 
      userEmail, 
      checkoutMode = 'redirect', // Changed default to redirect
      totalAmount, 
      addons = [],
      successUrl,
      cancelUrl,
      trial = false // Enable 7-day free trial
    } = body as {
      planType?: string;
      userId?: string;
      userEmail?: string;
      checkoutMode?: 'embedded' | 'redirect';
      totalAmount?: number;
      addons?: Array<{ name: string; price: number }>;
      successUrl?: string;
      cancelUrl?: string;
      trial?: boolean;
    };

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get the frontend URL
    const frontendUrl = process.env.FRONTEND_URL || 
                        process.env.NEXT_PUBLIC_FRONTEND_URL || 
                        (req.headers.get('origin') || 'http://localhost:3000');

    // Use dynamic price if provided, otherwise fallback to default
    const BASE_PRICE_CENTS = 699; // $6.99 base price in cents
    const finalAmount = totalAmount && totalAmount > BASE_PRICE_CENTS 
      ? totalAmount 
      : BASE_PRICE_CENTS;

    // Check if purchase is before February 2026 for promotion
    const now = new Date();
    const february2026 = new Date('2026-02-01T00:00:00Z');
    const isBeforeFebruary = now < february2026;

    // Build description with addons
    let productDescription = 'AI coaching and replay analysis';
    if (addons && addons.length > 0) {
      const addonNames = addons.map((a: { name: string; price: number }) => a.name).join(', ');
      productDescription = `PathGen Pro with ${addonNames}`;
    }
    
    // Add promotion message for purchases before February
    if (isBeforeFebruary) {
      productDescription += ' (Get 1 month free - 60 days subscription when you subscribe before February!)';
    }

    // Create line items: base plan + addons
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    
    // Base plan item
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'PathGen Pro',
          description: productDescription,
          metadata: isBeforeFebruary ? {
            promotion: '1_month_free_before_february'
          } : undefined,
        },
        recurring: {
          interval: 'month',
        },
        unit_amount: BASE_PRICE_CENTS,
      },
      quantity: 1,
    });

    // Add addon items as separate line items (only if available)
    if (addons && addons.length > 0) {
      // Filter out disabled add-ons
      const availableAddons = addons.filter((addon: { name: string; price: number }) => {
        const addonConfig = ADDONS.find(a => a.name === addon.name);
        if (!addonConfig) {
          console.warn(`[STRIPE] Add-on "${addon.name}" not found in configuration, blocking purchase`);
          return false;
        }
        if (!addonConfig.available) {
          console.warn(`[STRIPE] Add-on "${addon.name}" is not available, blocking purchase`);
          return false;
        }
        return true;
      });

      if (availableAddons.length !== addons.length) {
        console.warn(`[STRIPE] Blocked ${addons.length - availableAddons.length} disabled add-on(s)`);
        return NextResponse.json(
          { 
            error: 'Some add-ons are not available',
            message: 'One or more selected add-ons are temporarily unavailable. Please try again without those add-ons.',
            details: 'Add-ons are being rolled out in a future update.'
          },
          { status: 400 }
        );
      }

      availableAddons.forEach((addon: { name: string; price: number }) => {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: addon.name,
              description: `Add-on feature: ${addon.name}`,
            },
            recurring: {
              interval: 'month',
            },
            unit_amount: Math.round(addon.price * 100), // Convert to cents
          },
          quantity: 1,
        });
      });
    }

    // Create Checkout Session with all payment methods
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'], // Cards are always enabled
      mode: 'subscription',
      line_items: lineItems,
      customer_email: userEmail,
      metadata: {
        userId: userId,
        planType: planType,
        addons: addons && addons.length > 0 
          ? JSON.stringify(addons.map((a: { name: string; price: number }) => a.name))
          : 'none',
        totalAmount: finalAmount.toString(),
        isTrial: trial ? 'true' : 'false'
      },
      // Enable promo codes
      allow_promotion_codes: true,
      // Enable 7-day free trial if requested
      subscription_data: trial ? {
        trial_period_days: 7,
        metadata: {
          trial_start: new Date().toISOString()
        }
      } : undefined,
      // Black and white branding - simplified for Checkout Sessions
      // Note: Full appearance customization should be done in Stripe Dashboard → Settings → Branding
    };

    // Build URLs with session_id placeholder
    const successUrlWithSession = successUrl 
      ? `${successUrl}${successUrl.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}`
      : `${frontendUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrlWithParams = cancelUrl || `${frontendUrl}/subscribe.html?canceled=true`;
    
    // For embedded checkout, use return_url only (no cancel_url or success_url)
    if (checkoutMode === 'embedded') {
      sessionParams.ui_mode = 'embedded';
      // return_url handles both success and cancellation for embedded checkout
      sessionParams.return_url = successUrlWithSession;
    } else {
      // For redirect checkout, use success_url and cancel_url
      sessionParams.success_url = successUrlWithSession;
      sessionParams.cancel_url = cancelUrlWithParams;
    }
    
    console.log('[CHECKOUT] Success URL:', successUrlWithSession);
    console.log('[CHECKOUT] Cancel URL:', cancelUrlWithParams);

    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log('✅ Stripe checkout session created:', {
      sessionId: session.id,
      mode: checkoutMode,
      userId,
      lineItemsCount: lineItems.length,
      totalAmount: finalAmount,
      addons: addons && addons.length > 0 ? addons.map((a: { name: string; price: number }) => a.name) : 'none',
    });

    return NextResponse.json({
      sessionId: session.id,
      clientSecret: session.client_secret, // For embedded checkout
      checkoutUrl: session.url, // For redirect checkout
      mode: checkoutMode,
    });
  } catch (error: any) {
    console.error('❌ Stripe checkout error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
      raw: error.raw,
      statusCode: error.statusCode,
    });
    
    // Return detailed error information
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        message: error.message || 'Unknown error',
        details: error.type || error.code || 'Unknown error type',
        statusCode: error.statusCode || 500,
      },
      { status: error.statusCode || 500 }
    );
  }
}


