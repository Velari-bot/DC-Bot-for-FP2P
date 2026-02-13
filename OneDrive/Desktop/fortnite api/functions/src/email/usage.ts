// PathGen Email System — Usage Tracking

import * as admin from "firebase-admin";
import { COLLECTIONS, EMAIL_RATE_LIMITS } from "../utils/constants";

const db = admin.firestore();

/**
 * Email usage statistics
 */
export interface EmailUsage {
  totalSent: number;
  lastSentAt: admin.firestore.Timestamp | null;
  perUserSent: {
    [userId: string]: {
      count: number;
      lastSentAt: admin.firestore.Timestamp | null;
    };
  };
  dailyCount: number;
  dailyResetAt: admin.firestore.Timestamp | null;
  minuteCount: number;
  minuteResetAt: admin.firestore.Timestamp | null;
}

/**
 * Get current email usage stats
 */
export async function getEmailUsage(): Promise<EmailUsage> {
  const usageDoc = await db.collection(COLLECTIONS.EMAIL_USAGE).doc("global").get();

  if (!usageDoc.exists) {
    // Initialize if doesn't exist
    const now = admin.firestore.Timestamp.now();
    const initialUsage: EmailUsage = {
      totalSent: 0,
      lastSentAt: null,
      perUserSent: {},
      dailyCount: 0,
      dailyResetAt: now,
      minuteCount: 0,
      minuteResetAt: now,
    };

    await db.collection(COLLECTIONS.EMAIL_USAGE).doc("global").set(initialUsage);
    return initialUsage;
  }

  return usageDoc.data() as EmailUsage;
}

/**
 * Check if we can send email (rate limit check)
 */
export async function canSendEmail(userId?: string): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const usage = await getEmailUsage();
  const now = admin.firestore.Timestamp.now();

  // Reset daily count if needed (24 hours passed)
  if (usage.dailyResetAt) {
    const resetTime = usage.dailyResetAt.toMillis();
    const nowTime = now.toMillis();
    const hoursSinceReset = (nowTime - resetTime) / (1000 * 60 * 60);

    if (hoursSinceReset >= 24) {
      usage.dailyCount = 0;
      usage.dailyResetAt = now;
    }
  }

  // Reset minute count if needed (1 minute passed)
  if (usage.minuteResetAt) {
    const resetTime = usage.minuteResetAt.toMillis();
    const nowTime = now.toMillis();
    const secondsSinceReset = (nowTime - resetTime) / 1000;

    if (secondsSinceReset >= 60) {
      usage.minuteCount = 0;
      usage.minuteResetAt = now;
    }
  }

  // Check global per-minute limit
  if (usage.minuteCount >= EMAIL_RATE_LIMITS.MAX_PER_MINUTE) {
    return {
      allowed: false,
      reason: `Rate limit exceeded: ${EMAIL_RATE_LIMITS.MAX_PER_MINUTE} emails per minute`,
    };
  }

  // Check global per-day limit
  if (usage.dailyCount >= EMAIL_RATE_LIMITS.MAX_PER_DAY_GLOBAL) {
    return {
      allowed: false,
      reason: `Daily limit exceeded: ${EMAIL_RATE_LIMITS.MAX_PER_DAY_GLOBAL} emails per day`,
    };
  }

  // Check per-user limit (for triggered emails)
  if (userId) {
    const userUsage = usage.perUserSent[userId];
    if (userUsage) {
      const lastSentTime = userUsage.lastSentAt?.toMillis() || 0;
      const nowTime = now.toMillis();
      const hoursSinceLastSent = (nowTime - lastSentTime) / (1000 * 60 * 60);

      // Reset daily count for user if 24 hours passed
      if (hoursSinceLastSent >= 24) {
        userUsage.count = 0;
      }

      if (userUsage.count >= EMAIL_RATE_LIMITS.MAX_PER_DAY_PER_USER) {
        return {
          allowed: false,
          reason: `User limit exceeded: ${EMAIL_RATE_LIMITS.MAX_PER_DAY_PER_USER} emails per day per user`,
        };
      }
    }
  }

  return { allowed: true };
}

/**
 * Increment email usage counters
 */
export async function incrementEmailUsage(
  userId?: string,
  count: number = 1
): Promise<void> {
  const usageRef = db.collection(COLLECTIONS.EMAIL_USAGE).doc("global");
  const now = admin.firestore.Timestamp.now();

  const updates: any = {
    totalSent: admin.firestore.FieldValue.increment(count),
    lastSentAt: now,
    minuteCount: admin.firestore.FieldValue.increment(count),
    dailyCount: admin.firestore.FieldValue.increment(count),
  };

  // Update minute reset time if this is first email in new minute window
  const usage = await getEmailUsage();
  if (!usage.minuteResetAt) {
    updates.minuteResetAt = now;
  } else {
    const resetTime = usage.minuteResetAt.toMillis();
    const nowTime = now.toMillis();
    if ((nowTime - resetTime) / 1000 >= 60) {
      updates.minuteCount = count; // Reset to count instead of increment
      updates.minuteResetAt = now;
    }
  }

  // Update daily reset time if this is first email in new day window
  if (!usage.dailyResetAt) {
    updates.dailyResetAt = now;
  } else {
    const resetTime = usage.dailyResetAt.toMillis();
    const nowTime = now.toMillis();
    if ((nowTime - resetTime) / (1000 * 60 * 60) >= 24) {
      updates.dailyCount = count; // Reset to count instead of increment
      updates.dailyResetAt = now;
    }
  }

  // Update per-user usage
  if (userId) {
    const userUsagePath = `perUserSent.${userId}`;
    updates[`${userUsagePath}.count`] = admin.firestore.FieldValue.increment(count);
    updates[`${userUsagePath}.lastSentAt`] = now;
  }

  await usageRef.update(updates);
}

/**
 * Get user-specific email usage
 */
export async function getUserEmailUsage(userId: string): Promise<{
  count: number;
  lastSentAt: admin.firestore.Timestamp | null;
}> {
  const usage = await getEmailUsage();
  const userUsage = usage.perUserSent[userId];

  if (!userUsage) {
    return { count: 0, lastSentAt: null };
  }

  // Reset if 24 hours passed
  const lastSentTime = userUsage.lastSentAt?.toMillis() || 0;
  const nowTime = admin.firestore.Timestamp.now().toMillis();
  const hoursSinceLastSent = (nowTime - lastSentTime) / (1000 * 60 * 60);

  if (hoursSinceLastSent >= 24) {
    return { count: 0, lastSentAt: null };
  }

  return userUsage;
}

