// PathGen Email System — Engagement Tracking
// Tracks opens, clicks, replies to improve sender reputation

import * as admin from "firebase-admin";
import { COLLECTIONS } from "../utils/constants";

const db = admin.firestore();

/**
 * Track email open event
 */
export async function trackEmailOpen(messageId: string, email: string): Promise<void> {
  try {
    await db.collection(COLLECTIONS.EMAIL_LOGS)
      .where("messageId", "==", messageId)
      .where("to", "array-contains", email)
      .limit(1)
      .get()
      .then(async (snapshot) => {
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          await doc.ref.update({
            opened: true,
            openedAt: admin.firestore.FieldValue.serverTimestamp(),
            openCount: admin.firestore.FieldValue.increment(1),
          });
        }
      });

    // Also track in user engagement collection
    await db.collection("emailEngagement").add({
      email,
      messageId,
      event: "open",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("[EMAIL] Failed to track open:", error);
  }
}

/**
 * Track email click event
 */
export async function trackEmailClick(
  messageId: string,
  email: string,
  url: string
): Promise<void> {
  try {
    await db.collection(COLLECTIONS.EMAIL_LOGS)
      .where("messageId", "==", messageId)
      .where("to", "array-contains", email)
      .limit(1)
      .get()
      .then(async (snapshot) => {
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          await doc.ref.update({
            clicked: true,
            clickedAt: admin.firestore.FieldValue.serverTimestamp(),
            clickCount: admin.firestore.FieldValue.increment(1),
            clickedUrls: admin.firestore.FieldValue.arrayUnion(url),
          });
        }
      });

    // Track in engagement collection
    await db.collection("emailEngagement").add({
      email,
      messageId,
      event: "click",
      url,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("[EMAIL] Failed to track click:", error);
  }
}

/**
 * Track email reply event (via webhook or manual detection)
 */
export async function trackEmailReply(messageId: string, email: string): Promise<void> {
  try {
    await db.collection(COLLECTIONS.EMAIL_LOGS)
      .where("messageId", "==", messageId)
      .where("to", "array-contains", email)
      .limit(1)
      .get()
      .then(async (snapshot) => {
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          await doc.ref.update({
            replied: true,
            repliedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      });

    // Track in engagement collection
    await db.collection("emailEngagement").add({
      email,
      messageId,
      event: "reply",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("[EMAIL] Failed to track reply:", error);
  }
}

/**
 * Get engagement stats for an email
 */
export async function getEmailEngagementStats(messageId: string): Promise<{
  opens: number;
  clicks: number;
  replies: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
}> {
  try {
    const logDoc = await db.collection(COLLECTIONS.EMAIL_LOGS)
      .where("messageId", "==", messageId)
      .limit(1)
      .get();

    if (logDoc.empty) {
      return { opens: 0, clicks: 0, replies: 0, openRate: 0, clickRate: 0, replyRate: 0 };
    }

    const data = logDoc.docs[0].data();
    const sentCount = data.sentCount || 1;
    const opens = data.openCount || 0;
    const clicks = data.clickCount || 0;
    const replies = data.replied ? 1 : 0;

    return {
      opens,
      clicks,
      replies,
      openRate: sentCount > 0 ? (opens / sentCount) * 100 : 0,
      clickRate: sentCount > 0 ? (clicks / sentCount) * 100 : 0,
      replyRate: sentCount > 0 ? (replies / sentCount) * 100 : 0,
    };
  } catch (error) {
    console.error("[EMAIL] Failed to get engagement stats:", error);
    return { opens: 0, clicks: 0, replies: 0, openRate: 0, clickRate: 0, replyRate: 0 };
  }
}

/**
 * Get user engagement history
 */
export async function getUserEngagementHistory(email: string, days: number = 30): Promise<{
  totalOpens: number;
  totalClicks: number;
  totalReplies: number;
  recentEngagements: any[];
}> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const snapshot = await db.collection("emailEngagement")
      .where("email", "==", email)
      .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(cutoffDate))
      .orderBy("timestamp", "desc")
      .get();

    let totalOpens = 0;
    let totalClicks = 0;
    let totalReplies = 0;
    const recentEngagements: any[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      recentEngagements.push({ id: doc.id, ...data });

      if (data.event === "open") totalOpens++;
      if (data.event === "click") totalClicks++;
      if (data.event === "reply") totalReplies++;
    });

    return {
      totalOpens,
      totalClicks,
      totalReplies,
      recentEngagements: recentEngagements.slice(0, 50),
    };
  } catch (error) {
    console.error("[EMAIL] Failed to get user engagement:", error);
    return { totalOpens: 0, totalClicks: 0, totalReplies: 0, recentEngagements: [] };
  }
}

