import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
if (!getApps().length) {
  const serviceAccount = JSON.parse(
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || '{}'
  );
  initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

const db = getFirestore();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover' as any,
});

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, userEmail } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('[PORTAL] Creating portal session for user:', userId);

    // Get user's Stripe customer ID from Firebase
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData || !userData.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No Stripe customer found. Please subscribe first.' },
        { status: 404 }
      );
    }

    const stripeCustomerId = userData.stripeCustomerId;
    console.log('[PORTAL] Found Stripe customer:', stripeCustomerId);

    // Create portal session
    const returnUrl = `${req.headers.get('origin') || 'https://www.pathgen.dev'}/chat.html`;
    
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });

    console.log('[PORTAL] Portal session created:', portalSession.id);

    return NextResponse.json({
      url: portalSession.url,
      sessionId: portalSession.id,
    });
  } catch (error: any) {
    console.error('[PORTAL] Error creating portal session:', error);
    return NextResponse.json(
      {
        error: 'Failed to create portal session',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
