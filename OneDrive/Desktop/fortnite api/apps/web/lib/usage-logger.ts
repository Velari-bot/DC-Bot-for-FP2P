// Usage Logger with Batching and Optimization
// Reduces Firebase writes by batching updates

import { db, admin } from './firebase-admin';
import { COLLECTIONS } from './constants';

interface PendingUpdate {
  userId: string;
  tokens?: number;
  messages?: number;
  voiceSeconds?: number;
  voiceInteractions?: number;
  replays?: number;
  images?: number;
  timestamp: number;
}

// In-memory batch queue (will be lost on cold start, but that's okay)
const pendingUpdates: Map<string, PendingUpdate> = new Map();
let flushTimer: NodeJS.Timeout | null = null;

// Batch configuration
const BATCH_INTERVAL = 30000; // Flush every 30 seconds
const MAX_BATCH_SIZE = 50; // Flush when batch reaches 50 users

/**
 * Queue a usage update (batched)
 */
export async function queueUsageUpdate(
  userId: string,
  updates: {
    tokens?: number;
    messages?: number;
    voiceSeconds?: number;
    voiceInteractions?: number;
    replays?: number;
    images?: number;
  }
) {
  const existing = pendingUpdates.get(userId) || {
    userId,
    tokens: 0,
    messages: 0,
    voiceSeconds: 0,
    voiceInteractions: 0,
    replays: 0,
    images: 0,
    timestamp: Date.now(),
  };

  // Accumulate updates
  if (updates.tokens) existing.tokens = (existing.tokens || 0) + updates.tokens;
  if (updates.messages) existing.messages = (existing.messages || 0) + updates.messages;
  if (updates.voiceSeconds) existing.voiceSeconds = (existing.voiceSeconds || 0) + updates.voiceSeconds;
  if (updates.voiceInteractions) existing.voiceInteractions = (existing.voiceInteractions || 0) + updates.voiceInteractions;
  if (updates.replays) existing.replays = (existing.replays || 0) + updates.replays;
  if (updates.images) existing.images = (existing.images || 0) + updates.images;

  pendingUpdates.set(userId, existing);

  // Schedule flush if not already scheduled
  if (!flushTimer) {
    flushTimer = setTimeout(flushPendingUpdates, BATCH_INTERVAL);
  }

  // Flush immediately if batch is large
  if (pendingUpdates.size >= MAX_BATCH_SIZE) {
    await flushPendingUpdates();
  }
}

/**
 * Flush all pending updates to Firestore
 */
async function flushPendingUpdates() {
  if (pendingUpdates.size === 0) return;

  const batch = db.batch();
  const now = admin.firestore.Timestamp.now();
  let updateCount = 0;

  for (const [userId, update] of pendingUpdates.entries()) {
    const usageRef = db.collection(COLLECTIONS.USAGE).doc(userId);
    const updates: any = {
      lastUpdated: now,
    };

    if (update.tokens) updates.tokensUsedThisPeriod = admin.firestore.FieldValue.increment(update.tokens);
    if (update.messages) updates.textMessagesThisPeriod = admin.firestore.FieldValue.increment(update.messages);
    if (update.voiceSeconds) updates.voiceSecondsThisPeriod = admin.firestore.FieldValue.increment(update.voiceSeconds);
    if (update.voiceInteractions) updates.voiceInteractionsThisPeriod = admin.firestore.FieldValue.increment(update.voiceInteractions);
    if (update.replays) updates.replaysUploadedThisPeriod = admin.firestore.FieldValue.increment(update.replays);
    if (update.images) updates.imagesUploadedToday = admin.firestore.FieldValue.increment(update.images);

    batch.set(usageRef, updates, { merge: true });
    updateCount++;
  }

  try {
    await batch.commit();
    console.log(`✅ [BATCH] Flushed ${updateCount} usage updates to Firestore`);
    pendingUpdates.clear();
  } catch (error) {
    console.error('❌ [BATCH] Failed to flush updates:', error);
    // Don't clear - will retry on next flush
  }

  // Clear the timer
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
}

/**
 * Immediate write (for critical updates)
 */
export async function logUsageImmediate(
  userId: string,
  updates: {
    tokens?: number;
    messages?: number;
    voiceSeconds?: number;
    voiceInteractions?: number;
    replays?: number;
    images?: number;
  }
): Promise<void> {
  const now = admin.firestore.Timestamp.now();
  const usageRef = db.collection(COLLECTIONS.USAGE).doc(userId);
  
  const firestoreUpdates: any = {
    lastUpdated: now,
  };

  if (updates.tokens) firestoreUpdates.tokensUsedThisPeriod = admin.firestore.FieldValue.increment(updates.tokens);
  if (updates.messages) firestoreUpdates.textMessagesThisPeriod = admin.firestore.FieldValue.increment(updates.messages);
  if (updates.voiceSeconds) firestoreUpdates.voiceSecondsThisPeriod = admin.firestore.FieldValue.increment(updates.voiceSeconds);
  if (updates.voiceInteractions) firestoreUpdates.voiceInteractionsThisPeriod = admin.firestore.FieldValue.increment(updates.voiceInteractions);
  if (updates.replays) firestoreUpdates.replaysUploadedThisPeriod = admin.firestore.FieldValue.increment(updates.replays);
  if (updates.images) firestoreUpdates.imagesUploadedToday = admin.firestore.FieldValue.increment(updates.images);

  await usageRef.set(firestoreUpdates, { merge: true });
  console.log(`[USAGE] Immediate write for user ${userId}`);
}

// Export for cleanup on shutdown (if needed)
export async function shutdown() {
  if (pendingUpdates.size > 0) {
    console.log('[BATCH] Flushing pending updates on shutdown...');
    await flushPendingUpdates();
  }
}

