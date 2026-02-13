import { NextRequest, NextResponse } from 'next/server';
import { db, admin } from '@/lib/firebase-admin';
import Stripe from 'stripe';

// Helper to check admin access
async function checkAdmin(userId: string): Promise<boolean> {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return false;
    const userData = userDoc.data()!;
    return userData.role === 'owner' || userData.role === 'admin' || userData.isAdmin === true;
  } catch {
    return false;
  }
}

// Cancel subscription
export async function POST(
  req: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    const userId = req.headers.get('x-user-id') || req.headers.get('user-id');
    
    if (!userId || !(await checkAdmin(userId))) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Admin access required' },
        { status: 403 }
      );
    }

    const { uid } = params;
    const body = await req.json();
    const { action } = body;

    // Get subscription
    const subDoc = await db.collection('subscriptions').doc(uid).get();
    if (!subDoc.exists) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    const subData = subDoc.data()!;
    const stripeSubscriptionId = subData.stripeSubscriptionId;

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);

    if (action === 'cancel') {
      // Cancel in Stripe
      if (stripeSubscriptionId && !stripeSubscriptionId.startsWith('manual_')) {
        await stripe.subscriptions.update(stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
      }

      // Update in Firestore
      await db.collection('subscriptions').doc(uid).update({
        cancelAtPeriodEnd: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Log audit
      await db.collection('auditLogs').add({
        action: 'cancel_subscription',
        adminId: userId,
        targetUserId: uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        metadata: { stripeSubscriptionId },
      });

      return NextResponse.json({ success: true, message: 'Subscription canceled' });
    }

    if (action === 'refund') {
      // Get recent invoices
      const invoices = await stripe.invoices.list({
        customer: subData.stripeCustomerId,
        limit: 10,
      });

      if (invoices.data.length === 0) {
        return NextResponse.json(
          { error: 'No invoices found' },
          { status: 404 }
        );
      }

      const latestInvoice = invoices.data[0] as any;
      
      const paymentIntentId = typeof latestInvoice.payment_intent === 'string' ? latestInvoice.payment_intent : latestInvoice.payment_intent?.id;
      if (paymentIntentId) {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        if (paymentIntent.status === 'succeeded') {
          // Create refund
          const refund = await stripe.refunds.create({
            payment_intent: latestInvoice.payment_intent,
            amount: latestInvoice.amount_paid,
          });

          // Log audit
          await db.collection('auditLogs').add({
            action: 'refund_payment',
            adminId: userId,
            targetUserId: uid,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            metadata: {
              invoiceId: latestInvoice.id,
              paymentIntentId: latestInvoice.payment_intent,
              amount: latestInvoice.amount_paid,
              refundId: refund.id,
            },
          });

          return NextResponse.json({
            success: true,
            message: 'Refund processed',
            refund: {
              id: refund.id,
              amount: refund.amount,
              status: refund.status,
            },
          });
        }
      }

      return NextResponse.json(
        { error: 'Cannot refund - payment not found or already refunded' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[ERROR] Subscription action failed:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

// Get payment history
export async function GET(
  req: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    const userId = req.headers.get('x-user-id') || req.headers.get('user-id');
    
    if (!userId || !(await checkAdmin(userId))) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Admin access required' },
        { status: 403 }
      );
    }

    const { uid } = params;

    // Get subscription
    const subDoc = await db.collection('subscriptions').doc(uid).get();
    if (!subDoc.exists) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    const subData = subDoc.data()!;
    const stripeCustomerId = subData.stripeCustomerId;

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);

    // Get invoices
    const invoices = await stripe.invoices.list({
      customer: stripeCustomerId,
      limit: 100,
    });

    // Get payment intents
    const paymentIntents = await stripe.paymentIntents.list({
      customer: stripeCustomerId,
      limit: 100,
    });

    return NextResponse.json({
      invoices: invoices.data.map(inv => ({
        id: inv.id,
        amount: inv.amount_paid,
        currency: inv.currency,
        status: inv.status,
        created: new Date(inv.created * 1000).toISOString(),
        paidAt: inv.status_transitions?.paid_at ? new Date(inv.status_transitions.paid_at * 1000).toISOString() : null,
        hostedInvoiceUrl: inv.hosted_invoice_url,
        invoicePdf: inv.invoice_pdf,
      })),
      paymentIntents: paymentIntents.data.map(pi => ({
        id: pi.id,
        amount: pi.amount,
        currency: pi.currency,
        status: pi.status,
        created: new Date(pi.created * 1000).toISOString(),
      })),
    });
  } catch (error: any) {
    console.error('[ERROR] Get payment history failed:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

