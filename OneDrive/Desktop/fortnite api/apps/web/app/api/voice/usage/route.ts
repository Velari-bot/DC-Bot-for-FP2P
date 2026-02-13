// PathGen Backend — Voice Usage Check API
// Quick endpoint to check voice usage limits before recording

import { NextRequest, NextResponse } from 'next/server';
import { db, admin } from '@/lib/firebase-admin';
import { COLLECTIONS, DEFAULT_FREE_LIMITS, DEFAULT_PRO_LIMITS, ADDON_LIMITS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, email, durationSeconds = 0 } = body as {
      userId: string;
      email?: string;
      durationSeconds?: number;
    };

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Try multiple lookup methods: direct ID, email query, discordId query
    console.log(`[INFO] Starting user lookup for userId: ${userId}, email: ${email || 'none'}`);
    let userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    let actualUserId = userId;
    let lookupMethod = 'direct_id';

    // If not found by direct ID, try querying by email
    if (!userDoc.exists && userId.includes('@')) {
      console.log(`[INFO] Trying email query with userId (email): ${userId}`);
      const emailQuery = await db.collection(COLLECTIONS.USERS)
        .where('email', '==', userId)
        .limit(1)
        .get();
      if (!emailQuery.empty) {
        userDoc = emailQuery.docs[0];
        actualUserId = userDoc.id;
        lookupMethod = 'email_from_userId';
        console.log(`[INFO] Found user by email (userId): ${actualUserId}`);
      }
    }

    // If still not found, try querying by discordId
    if (!userDoc.exists) {
      console.log(`[INFO] Trying discordId query: ${userId}`);
      const discordQuery = await db.collection(COLLECTIONS.USERS)
        .where('discordId', '==', userId)
        .limit(1)
        .get();
      if (!discordQuery.empty) {
        userDoc = discordQuery.docs[0];
        actualUserId = userDoc.id;
        lookupMethod = 'discordId';
        console.log(`[INFO] Found user by discordId: ${actualUserId}`);
      }
    }

    // If still not found and we have an email parameter, try querying by email
    if (!userDoc.exists && email) {
      console.log(`[INFO] Trying email parameter query: ${email}`);
      const emailQuery = await db.collection(COLLECTIONS.USERS)
        .where('email', '==', email)
        .limit(1)
        .get();
      if (!emailQuery.empty) {
        userDoc = emailQuery.docs[0];
        actualUserId = userDoc.id;
        lookupMethod = 'email_parameter';
        console.log(`[INFO] Found user by email parameter: ${actualUserId}`);
      }
    }

    // If still not found, try querying by email field (case-insensitive fallback)
    if (!userDoc.exists && email) {
      console.log(`[INFO] Trying email parameter (lowercase): ${email.toLowerCase()}`);
      const emailQuery = await db.collection(COLLECTIONS.USERS)
        .where('email', '==', email.toLowerCase())
        .limit(1)
        .get();
      if (!emailQuery.empty) {
        userDoc = emailQuery.docs[0];
        actualUserId = userDoc.id;
        lookupMethod = 'email_lowercase';
        console.log(`[INFO] Found user by email (lowercase): ${actualUserId}`);
      }
    }

    // If still not found, try email-based document ID format (webhook creates users this way)
    if (!userDoc.exists && email) {
      const emailBasedId = email.replace(/[^a-zA-Z0-9]/g, '_');
      console.log(`[INFO] Trying email-based document ID: ${emailBasedId}`);
      const docById = await db.collection(COLLECTIONS.USERS).doc(emailBasedId).get();
      if (docById.exists) {
        userDoc = docById;
        actualUserId = emailBasedId;
        lookupMethod = 'email_based_doc_id';
        console.log(`[INFO] Found user by email-based document ID: ${actualUserId}`);
      }
    }

    // Check if user was found
    if (!userDoc.exists) {
      console.error(`[ERROR] User not found after trying all methods. userId: ${userId}, email: ${email || 'none'}`);
      return NextResponse.json({
        allowed: false,
        remaining: 0,
        limit: 0,
        reason: 'User not found'
      });
    }

    console.log(`[INFO] User found via ${lookupMethod}: ${actualUserId}`);

    // Get usage document using the actual user ID
    let usageDoc = await db.collection(COLLECTIONS.USAGE).doc(actualUserId).get();

    // If usage document doesn't exist, try to create it
    if (!usageDoc.exists) {
      console.warn(`[WARN] Usage document not found for user ${actualUserId}, attempting to create...`);
      const now = admin.firestore.Timestamp.now();
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      
      try {
        await db.collection(COLLECTIONS.USAGE).doc(actualUserId).set({
          messagesThisPeriod: 0,
          voiceSecondsThisPeriod: 0,
          voiceInteractionsThisPeriod: 0,
          freeTierLimits: {
            maxMessages: DEFAULT_FREE_LIMITS.maxMessagesPerDay,
            maxVoiceSeconds: DEFAULT_FREE_LIMITS.maxVoiceSecondsPerDay,
          },
          premiumTierLimits: {
            maxMessages: DEFAULT_PRO_LIMITS.maxMessagesPerMonth,
            maxVoiceSeconds: 0,
          },
          periodStart: now,
          periodEnd: admin.firestore.Timestamp.fromDate(periodEnd),
          lastVoiceUsage: now,
        });
        console.log(`[INFO] Created usage document for user ${actualUserId}`);
        // Re-fetch the usage document
        usageDoc = await db.collection(COLLECTIONS.USAGE).doc(actualUserId).get();
        if (!usageDoc.exists) {
          console.error(`[ERROR] Failed to create usage document for user ${actualUserId}`);
          return NextResponse.json({
            allowed: false,
            remaining: 0,
            limit: 0,
            reason: 'Usage document not found and could not be created'
          });
        }
      } catch (createError: any) {
        console.error(`[ERROR] Failed to create usage document:`, createError);
        return NextResponse.json({
          allowed: false,
          remaining: 0,
          limit: 0,
          reason: 'Usage document not found and could not be created'
        });
      }
    }

    const userData = userDoc.data()!;
    const usageData = usageDoc.data()!;
    const now = admin.firestore.Timestamp.now();

    // Check if period has expired
    if (usageData.periodEnd && now.toMillis() > usageData.periodEnd.toMillis()) {
      // Period expired - limits will be reset by webhook
    }

    const isPremium = userData.isPremium || userData.plan === 'pro';
    const hasVoiceAddon = userData.addons?.includes('voice') || userData.hasVoiceAddon || false;
    const isFreeTier = !isPremium;

    // Free tier limits: 10 interactions/month, 60 seconds/month
    if (isFreeTier && !hasVoiceAddon) {
      const voiceSecondsThisPeriod = usageData.voiceSecondsThisPeriod || 0;
      const voiceInteractionsThisPeriod = usageData.voiceInteractionsThisPeriod || 0;
      const monthlySecondsLimit = DEFAULT_FREE_LIMITS.maxVoiceSecondsPerMonth; // 60 seconds/month
      const monthlyInteractionsLimit = DEFAULT_FREE_LIMITS.maxVoiceInteractionsPerMonth; // 10 interactions/month
      const newSecondsTotal = voiceSecondsThisPeriod + durationSeconds;
      const newInteractionsTotal = voiceInteractionsThisPeriod + 1;

      if (newInteractionsTotal > monthlyInteractionsLimit) {
        return NextResponse.json({
          allowed: false,
          remaining: Math.max(0, monthlyInteractionsLimit - voiceInteractionsThisPeriod),
          limit: monthlyInteractionsLimit,
          reason: 'Free tier: Maximum 10 voice interactions per month reached',
          tier: 'free'
        });
      }

      if (newSecondsTotal > monthlySecondsLimit) {
        return NextResponse.json({
          allowed: false,
          remaining: Math.max(0, monthlySecondsLimit - voiceSecondsThisPeriod),
          limit: monthlySecondsLimit,
          reason: 'Free tier: Maximum 60 seconds per month reached',
          tier: 'free'
        });
      }

      return NextResponse.json({
        allowed: true,
        remaining: monthlySecondsLimit - newSecondsTotal,
        limit: monthlySecondsLimit,
        tier: 'free',
        used: voiceSecondsThisPeriod,
        interactionsRemaining: monthlyInteractionsLimit - newInteractionsTotal,
        interactionsLimit: monthlyInteractionsLimit
      });
    }

    // Voice add-on limits: 550 interactions/month, 3,600 seconds/month (60 minutes)
    if (hasVoiceAddon) {
      const voiceSecondsThisPeriod = usageData.voiceSecondsThisPeriod || 0;
      const voiceInteractionsThisPeriod = usageData.voiceInteractionsThisPeriod || 0;
      const totalInteractionsLimit = ADDON_LIMITS.voice.totalInteractionsPerMonth || 550; // 550 interactions/month
      const maxSecondsPerMonth = ADDON_LIMITS.voice.maxSecondsPerMonth || 3600; // 3,600 seconds/month (60 minutes)
      const sessionLimit = ADDON_LIMITS.voice.maxSecondsPerSession || 1800; // 30 minutes per session (hard cap)
      
      const newInteractionsTotal = voiceInteractionsThisPeriod + 1;
      const newSecondsTotal = voiceSecondsThisPeriod + durationSeconds;

      // Check session limit (30 minutes max per session)
      if (durationSeconds > sessionLimit) {
        return NextResponse.json({
          allowed: false,
          remaining: 0,
          limit: sessionLimit,
          reason: 'Session limit exceeded (30 minutes max per session)',
          tier: 'voice_addon'
        });
      }

      // Check monthly seconds limit (3,600 seconds/month = 60 minutes)
      if (newSecondsTotal > maxSecondsPerMonth) {
        return NextResponse.json({
          allowed: false,
          remaining: Math.max(0, maxSecondsPerMonth - voiceSecondsThisPeriod),
          limit: maxSecondsPerMonth,
          reason: 'Monthly seconds limit reached (3,600 seconds/month)',
          tier: 'voice_addon'
        });
      }

      // Check interaction limit (550 interactions/month)
      if (newInteractionsTotal > totalInteractionsLimit) {
        return NextResponse.json({
          allowed: false,
          remaining: Math.max(0, totalInteractionsLimit - voiceInteractionsThisPeriod),
          limit: totalInteractionsLimit,
          reason: 'Monthly interaction limit reached (550 interactions/month)',
          tier: 'voice_addon'
        });
      }

      // All checks passed
      return NextResponse.json({
        allowed: true,
        remaining: maxSecondsPerMonth - newSecondsTotal,
        limit: maxSecondsPerMonth,
        tier: 'voice_addon',
        used: voiceSecondsThisPeriod,
        interactionsRemaining: totalInteractionsLimit - newInteractionsTotal,
        interactionsLimit: totalInteractionsLimit
      });
    }

    // Base pro has no voice access
    if (isPremium && !hasVoiceAddon) {
      return NextResponse.json({
        allowed: false,
        remaining: 0,
        limit: 0,
        reason: 'Voice interaction requires Voice Add-On. Upgrade to unlock voice coaching.',
        tier: 'pro'
      });
    }

    return NextResponse.json({
      allowed: false,
      remaining: 0,
      limit: 0,
      reason: 'Voice not available for your tier',
      tier: 'unknown'
    });
  } catch (error: any) {
    console.error('[ERROR] Voice usage check error:', error);
    
    // Check if it's a Firebase Admin credentials error
    if (error.message?.includes('Could not load the default credentials') || 
        error.message?.includes('default credentials')) {
      return NextResponse.json(
        {
          error: 'Firebase Admin not configured',
          message: 'Firebase Admin credentials are missing. For local development, set GOOGLE_APPLICATION_CREDENTIALS_JSON in .env.local',
          details: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to check voice usage',
        message: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

