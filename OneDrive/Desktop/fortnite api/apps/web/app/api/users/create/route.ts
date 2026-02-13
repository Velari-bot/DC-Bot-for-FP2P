// PathGen Backend — Create User
// API route to create user in Firestore when they sign up
// This is a fallback if Firebase Auth trigger isn't working

import { NextRequest, NextResponse } from 'next/server';
import { db, admin } from '@/lib/firebase-admin';
import { COLLECTIONS, DEFAULT_FREE_LIMITS, DEFAULT_PRO_LIMITS, ADDON_LIMITS } from '@/lib/constants';
import Stripe from 'stripe';
import { notifyUserSignup } from '@/lib/discord-webhook';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

/**
 * Create user document in Firestore
 * Matches your preferred structure: /users/{userId}
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, email, username, displayName } = body as {
      userId: string;
      email?: string;
      username?: string;
      displayName?: string;
    };

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log(`[INFO] Creating user ${userId}`);

    // Check if user already exists
    const userRef = db.collection(COLLECTIONS.USERS).doc(userId);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      console.log(`[INFO] User ${userId} already exists`);
      return NextResponse.json({ 
        success: true, 
        message: 'User already exists',
        userId 
      });
    }

    const now = admin.firestore.Timestamp.now();

    // Create Stripe customer
    let stripeCustomerId = '';
    try {
      const customer = await stripe.customers.create({
        email: email || '',
        metadata: {
          firebase_uid: userId,
        },
      });
      stripeCustomerId = customer.id;
      console.log(`[INFO] Created Stripe customer ${stripeCustomerId} for user ${userId}`);
    } catch (stripeError: any) {
      console.error(`[ERROR] Failed to create Stripe customer:`, stripeError);
      // Continue without Stripe customer - can be created later
    }

    // Create user document (matches your preferred structure)
    // FREE TIER limits: 15 messages/day, 200 chars max, no chat history
    const userData = {
      email: email || '',
      username: username || displayName || email?.split('@')[0] || 'User',
      createdAt: now,
      lastLogin: now,
      plan: 'free' as const,
      stripeCustomerId: stripeCustomerId || '',
      // Free tier limits
      messagesSentToday: 0,
      messagesSentThisMonth: 0,
      messageLimitPerDay: DEFAULT_FREE_LIMITS.maxMessagesPerDay, // 15/day
      messageLimitPerMonth: 0, // Not applicable for free tier
      maxMessageLength: DEFAULT_FREE_LIMITS.maxMessageLength, // 200 chars
      saveChatHistory: DEFAULT_FREE_LIMITS.saveChatHistory, // false
      voiceSecondsUsedToday: 0,
      voiceSecondsUsedThisMonth: 0,
      voiceLimitSecondsPerDay: DEFAULT_FREE_LIMITS.maxVoiceSecondsPerDay, // 30s/day
      voiceLimitSecondsPerMonth: 0, // Not applicable for free tier
      // Add-on usage
      gameplayClipsUsedThisMonth: 0,
      gameplayReplaysUsedThisMonth: 0,
      competitiveInsightsUsedThisMonth: 0,
      // Add-on limits (all 0 for free tier)
      gameplayClipsLimitPerMonth: 0,
      gameplayReplaysLimitPerMonth: 0,
      competitiveInsightsLimitPerMonth: DEFAULT_FREE_LIMITS.competitiveInsightsPerWeek * 4, // 4/week = monthly
      lastActive: now,
      lastUpgradeCheck: now,
      // Legacy fields for compatibility
      platform: 'Web' as const,
      activePlanId: 'free' as const,
      isPremium: false,
      messagesSentThisPeriod: 0, // Legacy
      voiceSecondsThisPeriod: 0, // Legacy
    };

    await userRef.set(userData);

    // Create subscription document
    const subscriptionRef = db.collection(COLLECTIONS.SUBSCRIPTIONS).doc(userId);
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await subscriptionRef.set({
      plan: 'free' as const,
      status: 'active' as const,
      stripeCustomerId: stripeCustomerId || '',
      stripeSubscriptionId: '', // No active subscription yet
      currentPeriodStart: now,
      currentPeriodEnd: admin.firestore.Timestamp.fromDate(periodEnd),
      renewsAt: admin.firestore.Timestamp.fromDate(periodEnd),
      // Add-ons (all false for free tier)
      addons: {
        gameplay: false, // Gameplay Analysis Add-On
        competitive: false, // Competitive Insights Add-On
        voice: false, // Voice Interaction Add-On
      },
      // Legacy fields for compatibility
      planId: 'free' as const,
      cancelAtPeriodEnd: false,
      updatedAt: now,
    });

    console.log(`[SUCCESS] Created user ${userId} in Firestore`);

    // Send Discord webhook notification for new signup
    try {
      await notifyUserSignup({
        userId,
        email: email || '',
        username: username || displayName || email?.split('@')[0] || 'User',
      });
    } catch (discordError) {
      console.error('[ERROR] Failed to send Discord webhook for signup:', discordError);
      // Don't fail the request if Discord webhook fails
    }

    return NextResponse.json({
      success: true,
      userId,
      stripeCustomerId,
    });
  } catch (error: any) {
    console.error('[ERROR] Failed to create user:', error);
    console.error('[ERROR] Stack:', error.stack);
    return NextResponse.json(
      { 
        error: 'Failed to create user',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

