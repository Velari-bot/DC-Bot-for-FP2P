import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);
    const sessionId = params.sessionId;

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'line_items.data.price.product'],
    });

    // Format response
    return NextResponse.json({
      id: session.id,
      payment_status: session.payment_status,
      status: session.status,
      customer_email: session.customer_email,
      amount_total: session.amount_total,
      currency: session.currency,
      metadata: session.metadata,
      line_items: {
        data: (session.line_items?.data || []).map(item => {
          const product = item.price?.product;
          const productData = typeof product === 'string' 
            ? { id: product, name: null, description: null }
            : product && 'name' in product
            ? { id: product.id, name: product.name, description: (product as any).description }
            : { id: null, name: null, description: null };

          return {
            id: item.id,
            description: item.description,
            amount_total: item.amount_total,
            quantity: item.quantity,
            price: {
              id: item.price?.id,
              unit_amount: item.price?.unit_amount,
              currency: item.price?.currency,
              product: productData,
            },
          };
        }),
      },
    });
  } catch (error: any) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session', details: error.message },
      { status: 500 }
    );
  }
}

