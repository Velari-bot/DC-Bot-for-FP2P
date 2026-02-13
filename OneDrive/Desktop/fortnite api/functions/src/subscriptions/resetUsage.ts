// PathGen Backend — Fortnite AI Coach

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {db} from "../utils/firestore";
import {COLLECTIONS} from "../utils/constants";

/**
 * Reset usage counters on billing cycle renewal
 * This is also handled in the Stripe webhook, but this can be called separately
 */
export const resetUsageOnRenewal = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }

  try {
    // Get subscription to check billing period
    const subscriptionDoc = await db.collection(COLLECTIONS.SUBSCRIPTIONS).doc(uid).get();

    if (!subscriptionDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Subscription not found");
    }

    const subscription = subscriptionDoc.data()!;
    const now = admin.firestore.Timestamp.now();

    // Check if we're in a new billing period
    if (now.toMillis() > subscription.currentPeriodEnd.toMillis()) {
      // Reset usage
      await db.collection(COLLECTIONS.USAGE).doc(uid).update({
        messagesThisPeriod: 0,
        voiceSecondsThisPeriod: 0,
        periodStart: subscription.currentPeriodStart,
        periodEnd: subscription.currentPeriodEnd,
      });

      functions.logger.info(`✅ Reset usage for user ${uid}`);
      return {success: true, message: "Usage reset for new billing period"};
    }

    return {success: false, message: "Not yet time to reset usage"};
  } catch (error: any) {
    functions.logger.error(`Error resetting usage for user ${uid}:`, error);
    throw new functions.https.HttpsError("internal", "Failed to reset usage", error.message);
  }
});
