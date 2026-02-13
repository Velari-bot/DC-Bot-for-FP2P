import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

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
        },
        { status: 500 }
      );
    }

    // Initialize Stripe only if key exists
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-11-17.clover',
    });

    const body = await req.json();
    const { paymentMethodId, userId, userEmail, planType = 'pro', firstPaymentAlreadyCharged, paymentIntentId } = body as {
      paymentMethodId?: string;
      userId?: string;
      userEmail?: string;
      planType?: string;
      firstPaymentAlreadyCharged?: boolean;
      paymentIntentId?: string;
    };

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment method ID is required' },
        { status: 400 }
      );
    }

    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: 'User ID and email are required' },
        { status: 400 }
      );
    }

    // Define pricing plans
    const priceMap: Record<string, { amount: number; name: string; description: string; interval?: 'month' | 'year' }> = {
      pro: {
        amount: 699, // $6.99 in cents
        name: 'PathGen Pro',
        description: 'AI coaching and replay analysis',
        interval: 'month',
      },
    };

    const plan = priceMap[planType] || priceMap.pro;

    // Get or create customer
    let customer;
    const customers = await stripe.customers.list({
      email: userEmail,
      limit: 1,
    });

    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          userId: userId,
        },
      });
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.id,
    });

    // Set as default payment method
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Create subscription with payment method
    // First month already charged via Payment Intent, so subscription starts for future billing
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: plan.name,
            description: plan.description,
          },
          recurring: {
            interval: plan.interval || 'month',
          },
          unit_amount: plan.amount,
        } as any,
      }],
      default_payment_method: paymentMethodId,
      billing_cycle_anchor: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // Start billing in 30 days (first month already paid)
      payment_settings: {
        payment_method_types: ['card', 'link'] as any,
        save_default_payment_method: 'on_subscription',
      },
      metadata: {
        userId: userId,
        planType: planType,
        firstPaymentIntentId: paymentIntentId || '',
      },
      expand: ['latest_invoice'],
    });

    const invoice = subscription.latest_invoice as any;
    const paymentIntent = invoice?.payment_intent as Stripe.PaymentIntent;

    // If payment requires confirmation, return the client secret
    if (paymentIntent && (paymentIntent.status === 'requires_confirmation' || paymentIntent.status === 'requires_action')) {
      return NextResponse.json({
        subscriptionId: subscription.id,
        customerId: customer.id,
        status: subscription.status,
        clientSecret: paymentIntent.client_secret,
        requiresAction: true,
      });
    }

    console.log('✅ Stripe subscription created:', {
      subscriptionId: subscription.id,
      customerId: customer.id,
      userId,
      status: subscription.status,
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      customerId: customer.id,
      status: subscription.status,
    });
  } catch (error: any) {
    console.error('❌ Stripe subscription creation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create subscription',
        message: error.message || 'Unknown error',
        details: error.type || error.code || 'Unknown error type',
      },
      { status: error.statusCode || 500 }
    );
  }
}


