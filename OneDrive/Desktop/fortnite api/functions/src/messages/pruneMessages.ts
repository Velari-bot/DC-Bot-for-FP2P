// PathGen Backend — Fortnite AI Coach

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {db} from "../utils/firestore";
import {COLLECTIONS, MESSAGE_PRUNE_DAYS} from "../utils/constants";

/**
 * Scheduled function to prune old messages for free users
 * Runs daily and deletes messages older than MESSAGE_PRUNE_DAYS
 */
export const pruneOldMessages = functions.pubsub
  .schedule("every 24 hours")
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    const cutoffDate = new Date(now.toMillis());
    cutoffDate.setDate(cutoffDate.getDate() - MESSAGE_PRUNE_DAYS);
    const cutoffTimestamp = admin.firestore.Timestamp.fromDate(cutoffDate);

    functions.logger.info(`Starting message pruning for messages older than ${cutoffDate.toISOString()}`);

    try {
      // Get all users
      const usersSnapshot = await db.collection(COLLECTIONS.USERS).get();

      let totalDeleted = 0;

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const uid = userDoc.id;

        // Only prune messages for free users
        if (userData.isPremium) {
          continue;
        }

        // Get all conversations for this user
        const conversationsSnapshot = await db
          .collection(COLLECTIONS.CONVERSATIONS)
          .doc(uid)
          .collection(COLLECTIONS.CONVERSATIONS)
          .get();

        for (const conversationDoc of conversationsSnapshot.docs) {
          const conversationId = conversationDoc.id;

          // Get messages older than cutoff
          const oldMessagesSnapshot = await db
            .collection(COLLECTIONS.MESSAGES)
            .doc(uid)
            .collection(conversationId)
            .where("timestamp", "<", cutoffTimestamp)
            .get();

          // Delete in batches of 500 (Firestore limit)
          const batch = db.batch();
          let batchCount = 0;

          for (const messageDoc of oldMessagesSnapshot.docs) {
            batch.delete(messageDoc.ref);
            batchCount++;
            totalDeleted++;

            if (batchCount >= 500) {
              await batch.commit();
              batchCount = 0;
            }
          }

          // Commit remaining deletes
          if (batchCount > 0) {
            await batch.commit();
          }
        }
      }

      functions.logger.info(`✅ Message pruning complete. Deleted ${totalDeleted} messages.`);
      return null;
    } catch (error: any) {
      functions.logger.error("❌ Error pruning messages:", error);
      throw error;
    }
  });
