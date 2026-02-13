// PathGen Email System — Domain Warm-Up
// Gradually increases email volume to build sender reputation

import * as admin from "firebase-admin";
import { sendEmail, SendEmailOptions } from "./sender";
import { generatePlainTextEmail, generatePlainTextHTML } from "./plain-text";
import { COLLECTIONS } from "../utils/constants";

const db = admin.firestore();

/**
 * Warm-up schedule: Days 1-10
 * Gradually increase from 50 to 150 emails per day
 */
const WARMUP_SCHEDULE = [
  { day: 1, maxEmails: 50 },
  { day: 2, maxEmails: 60 },
  { day: 3, maxEmails: 70 },
  { day: 4, maxEmails: 80 },
  { day: 5, maxEmails: 90 },
  { day: 6, maxEmails: 100 },
  { day: 7, maxEmails: 110 },
  { day: 8, maxEmails: 120 },
  { day: 9, maxEmails: 135 },
  { day: 10, maxEmails: 150 },
];

/**
 * Get current warm-up day
 */
export async function getWarmupDay(): Promise<number> {
  try {
    const warmupDoc = await db.collection("emailWarmup").doc("status").get();
    
    if (!warmupDoc.exists) {
      // Initialize warm-up
      await db.collection("emailWarmup").doc("status").set({
        startDate: admin.firestore.FieldValue.serverTimestamp(),
        currentDay: 1,
        totalSent: 0,
      });
      return 1;
    }

    const data = warmupDoc.data();
    const startDate = data?.startDate?.toDate() || new Date();
    const daysSinceStart = Math.floor(
      (Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    // Cap at day 10
    return Math.min(daysSinceStart, 10);
  } catch (error) {
    console.error("[EMAIL] Failed to get warm-up day:", error);
    return 1; // Default to day 1 if error
  }
}

/**
 * Get max emails allowed for current warm-up day
 */
export async function getWarmupMaxEmails(): Promise<number> {
  const day = await getWarmupDay();
  const schedule = WARMUP_SCHEDULE.find((s) => s.day === day);
  return schedule?.maxEmails || 50;
}

/**
 * Check if we can send email during warm-up
 */
export async function canSendDuringWarmup(): Promise<{
  allowed: boolean;
  reason?: string;
  maxEmails: number;
  sentToday: number;
}> {
  const maxEmails = await getWarmupMaxEmails();
  
  // Get emails sent today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todaySnapshot = await db.collection(COLLECTIONS.EMAIL_LOGS)
    .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(today))
    .where("event", "==", "sent")
    .get();

  let sentToday = 0;
  todaySnapshot.forEach((doc) => {
    const data = doc.data();
    sentToday += data.sentCount || 1;
  });

  if (sentToday >= maxEmails) {
    return {
      allowed: false,
      reason: `Warm-up limit reached: ${sentToday}/${maxEmails} emails sent today`,
      maxEmails,
      sentToday,
    };
  }

  return {
    allowed: true,
    maxEmails,
    sentToday,
  };
}

/**
 * Send a warm-up email (personal, no links, conversational)
 */
export async function sendWarmupEmail(
  to: string,
  options?: {
    personalMessage?: string;
    askQuestion?: boolean;
  }
): Promise<{ success: boolean; messageId?: string }> {
  const warmupCheck = await canSendDuringWarmup();
  
  if (!warmupCheck.allowed) {
    throw new Error(warmupCheck.reason);
  }

  const personalMessage = options?.personalMessage || 
    "I wanted to reach out and see how your Fortnite practice is going. We're working on some updates to PathGen that I think you'll really like.";
  
  const question = options?.askQuestion !== false
    ? "What's been your biggest challenge in ranked lately? I'd love to hear your thoughts."
    : undefined;

  const text = generatePlainTextEmail({
    greeting: "Hey there,",
    body: personalMessage,
    question,
    signature: "- Ben from PathGen",
  });

  const html = generatePlainTextHTML({
    greeting: "Hey there,",
    body: personalMessage,
    question,
    signature: "- Ben from PathGen",
  });

  const result = await sendEmail({
    to,
    subject: "Quick update from PathGen",
    html,
    text,
    skipRateLimit: true, // Warm-up emails bypass normal rate limits
  });

  // Update warm-up stats
  await db.collection("emailWarmup").doc("status").update({
    totalSent: admin.firestore.FieldValue.increment(1),
  });

  return {
    success: result.success,
    messageId: result.messageId,
  };
}

/**
 * Check if domain is still in warm-up period
 */
export async function isWarmupPeriod(): Promise<boolean> {
  const day = await getWarmupDay();
  return day <= 10;
}

