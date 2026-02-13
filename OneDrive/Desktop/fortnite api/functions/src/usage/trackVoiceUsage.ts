// PathGen Backend — Fortnite AI Coach

import * as functions from "firebase-functions";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import {db, runTransaction} from "../utils/firestore";
import {COLLECTIONS} from "../utils/constants";

/**
 * Track voice usage in seconds
 * Every second of audio increments voiceSecondsThisPeriod
 */
export const trackVoiceUsage = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const {seconds} = request.data;

  if (!seconds || typeof seconds !== "number" || seconds <= 0) {
    throw new HttpsError(
      "invalid-argument",
      "Seconds must be a positive number"
    );
  }

  try {
    await runTransaction(async (transaction) => {
      // Get user to check premium status
      const userDoc = await transaction.get(db.collection(COLLECTIONS.USERS).doc(uid));
      if (!userDoc.exists) {
        throw new HttpsError("not-found", "User not found");
      }

      const userData = userDoc.data()!;
      const isPremium = userData.isPremium || false;

      // Get usage document
      const usageDoc = await transaction.get(db.collection(COLLECTIONS.USAGE).doc(uid));
      if (!usageDoc.exists) {
        throw new HttpsError("not-found", "Usage document not found");
      }

      const usageData = usageDoc.data()!;
      const now = admin.firestore.Timestamp.now();

      // Check if period has expired, reset if so
      if (now.toMillis() > usageData.periodEnd.toMillis()) {
        usageData.voiceSecondsThisPeriod = 0;
        usageData.messagesThisPeriod = 0;
        usageData.periodStart = now;
        const periodEnd = new Date();
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        usageData.periodEnd = admin.firestore.Timestamp.fromDate(periodEnd);
      }

      // Check usage limits
      const limits = isPremium ? usageData.premiumTierLimits : usageData.freeTierLimits;

      const newVoiceSeconds = usageData.voiceSecondsThisPeriod + seconds;

      if (!isPremium && newVoiceSeconds > limits.maxVoiceSeconds) {
        throw new HttpsError(
          "resource-exhausted",
          `Free tier limit reached. Maximum ${limits.maxVoiceSeconds} voice seconds per period.`
        );
      }

      // Update usage
      transaction.update(db.collection(COLLECTIONS.USAGE).doc(uid), {
        voiceSecondsThisPeriod: newVoiceSeconds,
        periodStart: usageData.periodStart,
        periodEnd: usageData.periodEnd,
      });

      return {
        usageRemaining: limits.maxVoiceSeconds - newVoiceSeconds,
        totalUsed: newVoiceSeconds,
      };
    });

    return {
      success: true,
      message: "Voice usage tracked successfully",
    };
  } catch (error: any) {
    functions.logger.error(`Error tracking voice usage for user ${uid}:`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Failed to track voice usage", error.message);
  }
});
