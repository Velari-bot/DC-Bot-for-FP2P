// PathGen Email System — Admin Dashboard Functions

import * as admin from "firebase-admin";
import { sendBulkEmail, SendEmailOptions } from "./sender";
import { loadTemplate, injectVariables } from "./templates";
import { getEmailUsage } from "./usage";
import { COLLECTIONS } from "../utils/constants";

const db = admin.firestore();

/**
 * Broadcast email to all users
 */
export async function broadcastEmail(
  options: Omit<SendEmailOptions, "to" | "skipRateLimit"> & {
    template: string;
    variables?: Record<string, any>;
  }
): Promise<{
  success: boolean;
  totalUsers: number;
  sent: number;
  failed: number;
  error?: string;
}> {
  try {
    // Get all users with email addresses
    const usersSnapshot = await db
      .collection(COLLECTIONS.USERS)
      .where("email", "!=", null)
      .get();

    if (usersSnapshot.empty) {
      return {
        success: false,
        totalUsers: 0,
        sent: 0,
        failed: 0,
        error: "No users found with email addresses",
      };
    }

    const emails: string[] = [];
    usersSnapshot.forEach((doc) => {
      const email = doc.data().email;
      if (email) {
        emails.push(email);
      }
    });

    console.log(`[EMAIL] Broadcasting to ${emails.length} users`);

    // Send in batches (skip rate limit for admin broadcasts)
    const result = await sendBulkEmail({
      ...options,
      to: emails,
      skipRateLimit: true, // Admin broadcasts bypass rate limits
    });

    // Log broadcast event
    await db.collection(COLLECTIONS.EMAIL_LOGS).add({
      event: "broadcast",
      template: options.template,
      totalRecipients: emails.length,
      sent: result.totalSent,
      failed: result.totalFailed,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: result.totalFailed === 0,
      totalUsers: emails.length,
      sent: result.totalSent,
      failed: result.totalFailed,
    };
  } catch (error: any) {
    console.error("[EMAIL] Broadcast failed:", error);
    return {
      success: false,
      totalUsers: 0,
      sent: 0,
      failed: 0,
      error: error.message || "Broadcast failed",
    };
  }
}

/**
 * Get email deliverability stats
 */
export async function getDeliverabilityStats(days: number = 7): Promise<{
  totalSent: number;
  totalFailed: number;
  totalRejected: number;
  successRate: number;
  recentLogs: any[];
}> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const logsSnapshot = await db
      .collection(COLLECTIONS.EMAIL_LOGS)
      .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(cutoffDate))
      .orderBy("timestamp", "desc")
      .limit(1000)
      .get();

    let totalSent = 0;
    let totalFailed = 0;
    let totalRejected = 0;
    const recentLogs: any[] = [];

    logsSnapshot.forEach((doc) => {
      const data = doc.data();
      recentLogs.push({
        id: doc.id,
        ...data,
      });

      if (data.event === "sent") {
        totalSent += data.sentCount || 1;
        if (data.rejected && data.rejected.length > 0) {
          totalRejected += data.rejected.length;
        }
      } else if (data.event === "failed" || data.event === "error") {
        totalFailed += 1;
      }
    });

    const total = totalSent + totalFailed;
    const successRate = total > 0 ? (totalSent / total) * 100 : 0;

    return {
      totalSent,
      totalFailed,
      totalRejected,
      successRate: Math.round(successRate * 100) / 100,
      recentLogs: recentLogs.slice(0, 50), // Return last 50 logs
    };
  } catch (error: any) {
    console.error("[EMAIL] Failed to get deliverability stats:", error);
    return {
      totalSent: 0,
      totalFailed: 0,
      totalRejected: 0,
      successRate: 0,
      recentLogs: [],
    };
  }
}

/**
 * Preview email template with variables
 */
export async function previewTemplate(
  templateName: string,
  variables?: Record<string, any>
): Promise<{
  html: string;
  text: string;
  error?: string;
}> {
  try {
    const template = await loadTemplate(templateName);
    const html = variables ? injectVariables(template, variables) : template;
    const { htmlToText } = await import("./templates");
    const text = htmlToText(html);

    return { html, text };
  } catch (error: any) {
    return {
      html: "",
      text: "",
      error: error.message || "Failed to load template",
    };
  }
}

/**
 * Save or update email template in Firestore
 */
export async function saveTemplate(
  templateName: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.collection(COLLECTIONS.EMAIL_TEMPLATES).doc(templateName).set({
      html,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error: any) {
    console.error("[EMAIL] Failed to save template:", error);
    return {
      success: false,
      error: error.message || "Failed to save template",
    };
  }
}

/**
 * Get all email templates
 */
export async function getAllTemplates(): Promise<
  Array<{ name: string; updatedAt: admin.firestore.Timestamp | null }>
> {
  try {
    const templatesSnapshot = await db
      .collection(COLLECTIONS.EMAIL_TEMPLATES)
      .get();

    const templates: Array<{
      name: string;
      updatedAt: admin.firestore.Timestamp | null;
    }> = [];

    templatesSnapshot.forEach((doc) => {
      const data = doc.data();
      templates.push({
        name: doc.id,
        updatedAt: data.updatedAt || null,
      });
    });

    return templates;
  } catch (error: any) {
    console.error("[EMAIL] Failed to get templates:", error);
    return [];
  }
}

/**
 * Get comprehensive email system stats
 */
export async function getEmailStats(): Promise<{
  usage: {
    totalSent: number;
    lastSentAt: admin.firestore.Timestamp | null;
    dailyCount: number;
    minuteCount: number;
  };
  deliverability: {
    totalSent: number;
    totalFailed: number;
    successRate: number;
  };
  templates: number;
}> {
  try {
    const [usage, deliverability, templates] = await Promise.all([
      getEmailUsage(),
      getDeliverabilityStats(7),
      getAllTemplates(),
    ]);

    return {
      usage: {
        totalSent: usage.totalSent,
        lastSentAt: usage.lastSentAt,
        dailyCount: usage.dailyCount,
        minuteCount: usage.minuteCount,
      },
      deliverability: {
        totalSent: deliverability.totalSent,
        totalFailed: deliverability.totalFailed,
        successRate: deliverability.successRate,
      },
      templates: templates.length,
    };
  } catch (error: any) {
    console.error("[EMAIL] Failed to get email stats:", error);
    throw error;
  }
}

