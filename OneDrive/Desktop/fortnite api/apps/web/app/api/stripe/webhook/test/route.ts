import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Test endpoint to verify webhook configuration
 * Visit: /api/stripe/webhook/test
 */
export async function GET(req: NextRequest) {
  const checks = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY ? '✅ Set' : '❌ Not Set',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ? '✅ Set' : '❌ Not Set',
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Not Set',
    webhookEndpoint: '/api/stripe/webhook',
    status: 'OK',
  };

  const allConfigured = 
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_WEBHOOK_SECRET &&
    process.env.FIREBASE_PROJECT_ID;

  return NextResponse.json({
    ...checks,
    configured: allConfigured ? '✅ All Required Env Vars Set' : '❌ Missing Env Vars',
    message: allConfigured 
      ? 'Webhook endpoint is properly configured' 
      : 'Some environment variables are missing',
  }, { status: 200 });
}
