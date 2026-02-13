// PathGen Backend — Fortnite AI Coach

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {db} from "../utils/firestore";
import {COLLECTIONS} from "../utils/constants";

/**
 * Abuse detection Cloud Function
 * Flags non-Fortnite content, jailbreak attempts, excessive message frequency
 */
export const detectAbuse = functions.firestore
  .document(`${COLLECTIONS.MESSAGES}/{uid}/{conversationId}/{messageId}`)
  .onCreate(async (snap, context) => {
    const messageData = snap.data();
    const uid = context.params.uid;
    const messageId = context.params.messageId;

    if (!messageData || messageData.role !== "user") {
      return; // Only check user messages
    }

    const content = messageData.content.toLowerCase();
    const now = admin.firestore.Timestamp.now();

    try {
      // Check for jailbreak attempts
      const jailbreakKeywords = [
        "ignore previous",
        "forget your instructions",
        "act as",
        "you are now",
        "system prompt",
        "developer mode",
        "jailbreak",
        "dan mode",
      ];

      const isJailbreak = jailbreakKeywords.some((keyword) => content.includes(keyword));

      // Check for non-Fortnite content (simple heuristic - can be improved)
      const fortniteKeywords = [
        "fortnite",
        "battle royale",
        "chapter",
        "season",
        "weapon",
        "build",
        "edit",
        "aim",
        "movement",
        "loot",
        "storm",
        "victory",
        "elimination",
      ];

      const hasFortniteContent = fortniteKeywords.some((keyword) => content.includes(keyword));
      const isNonFortnite = content.length > 20 && !hasFortniteContent;

      // Check message frequency (last hour)
      const oneHourAgo = new Date(now.toMillis() - 60 * 60 * 1000);
      const recentMessages = await db
        .collection(COLLECTIONS.MESSAGES)
        .doc(uid)
        .collection(COLLECTIONS.MESSAGES)
        .where("timestamp", ">", admin.firestore.Timestamp.fromDate(oneHourAgo))
        .where("role", "==", "user")
        .get();

      const isExcessiveFrequency = recentMessages.size > 100; // More than 100 messages per hour

      // If any abuse detected, record it
      if (isJailbreak || isNonFortnite || isExcessiveFrequency) {
        const abuseRef = db.collection(COLLECTIONS.ABUSE).doc(uid);
        const abuseDoc = await abuseRef.get();

        const flags: string[] = [];
        if (isJailbreak) flags.push("jailbreak_attempt");
        if (isNonFortnite) flags.push("non_fortnite_content");
        if (isExcessiveFrequency) flags.push("excessive_frequency");

        const updateData: any = {
          lastFlagAt: now,
          flaggedMessages: admin.firestore.FieldValue.arrayUnion(messageId),
        };

        if (abuseDoc.exists) {
          await abuseRef.update(updateData);
        } else {
          await abuseRef.set({
            ...updateData,
            flaggedMessages: [messageId],
          });
        }

        functions.logger.warn(
          `⚠️ Abuse detected for user ${uid}: ${flags.join(", ")} in message ${messageId}`
        );

        // If too many flags, consider temporary ban
        if (abuseDoc.exists) {
          const abuseData = abuseDoc.data()!;
          const totalFlags = (abuseData.flaggedMessages?.length || 0) + 1;

          if (totalFlags >= 10) {
            // Ban for 24 hours
            const banUntil = new Date(now.toMillis() + 24 * 60 * 60 * 1000);
            await abuseRef.update({
              bannedUntil: admin.firestore.Timestamp.fromDate(banUntil),
            });

            functions.logger.error(`🚫 User ${uid} banned until ${banUntil.toISOString()}`);
          }
        }
      }

      return null;
    } catch (error: any) {
      functions.logger.error(`Error in abuse detection for user ${uid}:`, error);
      return null;
    }
  });
