// PathGen Backend — Fortnite AI Coach

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {db, runTransaction} from "../utils/firestore";
import {COLLECTIONS} from "../utils/constants";
import {Message, Conversation} from "../types/firestore";

/**
 * Send message endpoint
 * Checks usage limits, increments counters, saves message, updates conversation
 */
export const sendMessage = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const {conversationId, content, role, tokens, metadata, audioUrl} = request.data;

  if (!conversationId || !content || !role) {
    throw new HttpsError(
      "invalid-argument",
      "Missing required fields: conversationId, content, role"
    );
  }

  try {
    // Use transaction to check usage and increment atomically
    const result = await runTransaction(async (transaction) => {
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
        usageData.messagesThisPeriod = 0;
        usageData.voiceSecondsThisPeriod = 0;
        usageData.periodStart = now;
        const periodEnd = new Date();
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        usageData.periodEnd = admin.firestore.Timestamp.fromDate(periodEnd);
      }

      // Check usage limits
      const limits = isPremium ? usageData.premiumTierLimits : usageData.freeTierLimits;

      if (!isPremium && usageData.messagesThisPeriod >= limits.maxMessages) {
        throw new HttpsError(
          "resource-exhausted",
          `Free tier limit reached. Maximum ${limits.maxMessages} messages per period.`
        );
      }

      // Increment message count
      usageData.messagesThisPeriod += 1;

      // Update usage document
      transaction.update(db.collection(COLLECTIONS.USAGE).doc(uid), {
        messagesThisPeriod: usageData.messagesThisPeriod,
        periodStart: usageData.periodStart,
        periodEnd: usageData.periodEnd,
      });

      // Create message
      const messageId = db.collection(COLLECTIONS.MESSAGES).doc().id;
      const messageRef = db
        .collection(COLLECTIONS.MESSAGES)
        .doc(uid)
        .collection(conversationId)
        .doc(messageId);

      const messageData: Message = {
        role: role as "user" | "assistant",
        content: content,
        tokens: tokens || 0,
        timestamp: now,
        audioUrl: audioUrl || undefined,
        metadata: metadata || {
          model: "gpt-4",
          latencyMs: 0,
        },
      };

      transaction.set(messageRef, messageData);

      // Update conversation
      const conversationRef = db
        .collection(COLLECTIONS.CONVERSATIONS)
        .doc(uid)
        .collection(COLLECTIONS.CONVERSATIONS)
        .doc(conversationId);

      const conversationDoc = await transaction.get(conversationRef);
      const lastMessageSnippet = content.length > 100 ? content.substring(0, 100) + "..." : content;

      if (conversationDoc.exists) {
        transaction.update(conversationRef, {
          updatedAt: now,
          lastMessageSnippet: lastMessageSnippet,
        });
      } else {
        // Create conversation if it doesn't exist
        const conversationData: Conversation = {
          createdAt: now,
          updatedAt: now,
          title: lastMessageSnippet,
          lastMessageSnippet: lastMessageSnippet,
          type: audioUrl ? "voice" : "text",
        };
        transaction.set(conversationRef, conversationData);
      }

      return {messageId, usageRemaining: limits.maxMessages - usageData.messagesThisPeriod};
    });

    return {
      success: true,
      messageId: result.messageId,
      usageRemaining: result.usageRemaining,
    };
  } catch (error: any) {
    functions.logger.error(`Error sending message for user ${uid}:`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Failed to send message", error.message);
  }
});
