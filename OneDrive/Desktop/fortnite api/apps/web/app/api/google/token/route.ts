import { NextRequest, NextResponse } from 'next/server';
import { notifyUserSignup } from '@/lib/discord-webhook';
import { db, admin } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/constants';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-11-17.clover',
});

/**
 * Google OAuth token exchange endpoint
 * Exchanges authorization code for access token and user info
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, redirectUri } = body as {
      code: string;
      redirectUri?: string;
    };

    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code is required' },
        { status: 400 }
      );
    }

    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    const REDIRECT_URI = redirectUri || 'https://pathgen.dev/setup.html';

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      console.warn('⚠️  Google OAuth credentials not set');
      return NextResponse.json(
        { error: 'Google OAuth not configured' },
        { status: 500 }
      );
    }

    // Exchange code for access token
    try {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: REDIRECT_URI,
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        console.error('Google token exchange failed:', tokenResponse.status, errorData);
        return NextResponse.json(
          {
            error: 'Google OAuth failed',
            details: errorData,
          },
          { status: tokenResponse.status }
        );
      }

      const tokenData = await tokenResponse.json();
      const { access_token, id_token } = tokenData;

      // Get user info from Google
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.text();
        console.error('Google user fetch failed:', userResponse.status, errorData);
        return NextResponse.json(
          {
            error: 'Failed to fetch Google user info',
            details: errorData,
          },
          { status: userResponse.status }
        );
      }

      const userData = await userResponse.json();

      // Create or update user in Firestore (same as Discord flow)
      const userId = userData.id || `google_${userData.email?.split('@')[0] || Date.now()}`;
      const userRef = db.collection(COLLECTIONS.USERS).doc(userId);
      const userDoc = await userRef.get();

      const now = admin.firestore.Timestamp.now();

      if (!userDoc.exists) {
        // Create new user
        // Create Stripe customer
        let stripeCustomerId = '';
        try {
          const customer = await stripe.customers.create({
            email: userData.email || '',
            metadata: {
              firebase_uid: userId,
            },
          });
          stripeCustomerId = customer.id;
          console.log(`[INFO] Created Stripe customer ${stripeCustomerId} for user ${userId}`);
        } catch (stripeError: any) {
          console.error(`[ERROR] Failed to create Stripe customer:`, stripeError);
        }

        const userDataToStore = {
          email: userData.email || '',
          username: userData.name || userData.email?.split('@')[0] || 'User',
          displayName: userData.name || '',
          createdAt: now,
          lastLogin: now,
          plan: 'free' as const,
          stripeCustomerId: stripeCustomerId || '',
          messagesSentToday: 0,
          messagesSentThisMonth: 0,
          messageLimitPerDay: 5,
          messageLimitPerMonth: 0,
          maxMessageLength: 200,
          saveChatHistory: false,
          voiceSecondsUsedToday: 0,
          voiceSecondsUsedThisMonth: 0,
          voiceLimitSecondsPerDay: 0,
          voiceLimitSecondsPerMonth: 0,
          gameplayClipsUsedThisMonth: 0,
          gameplayReplaysUsedThisMonth: 0,
          competitiveInsightsUsedThisMonth: 0,
          gameplayClipsLimitPerMonth: 0,
          gameplayReplaysLimitPerMonth: 0,
          competitiveInsightsLimitPerMonth: 0,
          lastActive: now,
          lastUpgradeCheck: now,
          platform: 'Web' as const,
          activePlanId: 'free' as const,
          isPremium: false,
          messagesSentThisPeriod: 0,
          voiceSecondsThisPeriod: 0,
          loginMethod: 'google' as const,
          googleId: userData.id,
          avatar: userData.picture,
        };

        await userRef.set(userDataToStore);

        // Create subscription document
        const subscriptionRef = db.collection(COLLECTIONS.SUBSCRIPTIONS).doc(userId);
        const periodEnd = new Date();
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        await subscriptionRef.set({
          plan: 'free' as const,
          status: 'active' as const,
          stripeCustomerId: stripeCustomerId || '',
          stripeSubscriptionId: '',
          currentPeriodStart: now,
          currentPeriodEnd: admin.firestore.Timestamp.fromDate(periodEnd),
          renewsAt: admin.firestore.Timestamp.fromDate(periodEnd),
          addons: {
            gameplay: false,
            competitive: false,
            voice: false,
          },
          planId: 'free' as const,
          cancelAtPeriodEnd: false,
          updatedAt: now,
        });

        // Send Discord webhook notification for new signup
        try {
          await notifyUserSignup({
            userId,
            email: userData.email || '',
            username: userData.name || userData.email?.split('@')[0] || 'User',
          });
        } catch (discordError) {
          console.error('[ERROR] Failed to send Discord webhook for signup:', discordError);
        }

        console.log(`[SUCCESS] Created Google user ${userId} in Firestore`);
      } else {
        // Update existing user
        await userRef.update({
          lastLogin: now,
          lastActive: now,
          email: userData.email || userDoc.data()?.email,
          displayName: userData.name || userDoc.data()?.displayName,
          avatar: userData.picture || userDoc.data()?.avatar,
        });
      }

      // Return user data (same format as Discord)
      return NextResponse.json({
        access_token,
        id_token,
        user: {
          id: userId,
          username: userData.name || userData.email?.split('@')[0] || 'User',
          email: userData.email,
          avatar: userData.picture,
          verified: userData.verified_email || false,
          name: userData.name,
        },
      });
    } catch (error: any) {
      console.error('Google OAuth error:', error);
      return NextResponse.json(
        {
          error: 'Internal server error',
          message: error.message || 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Google OAuth error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
