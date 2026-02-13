import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Mark as dynamic since we're using request data
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-11-17.clover',
    });

    const body = await req.json();
    const { userId, userEmail, planType = 'pro' } = body as {
      userId?: string;
      userEmail?: string;
      planType?: string;
    };

    // Define pricing
    const priceMap: Record<string, { amount: number; name: string; description: string }> = {
      pro: {
        amount: 699, // $6.99
        name: 'PathGen Pro',
        description: 'AI coaching and replay analysis',
      },
    };
    const plan = priceMap[planType] || priceMap.pro;

    // Create Payment Intent to collect payment method for subscription
    // Payment Element REQUIRES automatic_payment_methods to be enabled
    // This will automatically show all payment methods enabled in your Stripe Dashboard
    const paymentIntent = await stripe.paymentIntents.create({
      amount: plan.amount, // Charge first month
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true, // Enables ALL payment methods: Cards, Link, Apple Pay, Google Pay, Amazon Pay, etc.
      },
      metadata: {
        userId: userId || '',
        userEmail: userEmail || '',
        planType: planType || 'pro',
        subscription: 'true',
      },
    });

    console.log('✅ Payment Intent created:', {
      paymentIntentId: paymentIntent.id,
      userId,
      amount: plan.amount,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: plan.amount,
      planName: plan.name,
    });
  } catch (error: any) {
    console.error('❌ Setup Intent creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create setup intent', message: error.message },
      { status: 500 }
    );
  }
}


