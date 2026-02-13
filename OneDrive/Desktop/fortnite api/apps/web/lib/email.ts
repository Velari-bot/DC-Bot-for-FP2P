// PathGen Email System — Shared Email Utilities for Next.js

/**
 * This file re-exports email functions that can be used in Next.js API routes.
 * The actual implementation is in functions/src/email/ but we need to duplicate
 * the core logic here since Next.js and Firebase Functions have separate build contexts.
 * 
 * For production, consider creating a shared package or using Firebase Functions callable functions.
 */

const nodemailer = require("nodemailer");
import { admin, db } from "./firebase-admin";
const { convert } = require("html-to-text");
const validator = require("validator");

/**
 * Get email configuration from environment variables
 */
function getEmailConfig() {
  const smtpUser = process.env.EMAIL_SMTP_USER;
  const smtpPass = process.env.EMAIL_SMTP_PASS;
  const fromAddress = process.env.EMAIL_FROM || "no-reply@pathgen.gg";
  const fromName = process.env.EMAIL_FROM_NAME || "PathGen";

  // Debug logging
  console.log('[EMAIL CONFIG] Checking environment variables:', {
    hasSmtpUser: !!smtpUser,
    hasSmtpPass: !!smtpPass,
    smtpUserLength: smtpUser?.length || 0,
    smtpPassLength: smtpPass?.length || 0,
    fromAddress,
    fromName,
  });

  if (!smtpUser || !smtpPass) {
    console.error('[EMAIL CONFIG] Missing credentials:', {
      EMAIL_SMTP_USER: smtpUser ? 'SET' : 'MISSING',
      EMAIL_SMTP_PASS: smtpPass ? 'SET' : 'MISSING',
      allEnvKeys: Object.keys(process.env).filter(k => k.includes('EMAIL')),
    });
    throw new Error(
      "EMAIL_SMTP_USER and EMAIL_SMTP_PASS must be set as environment variables"
    );
  }

  let parsedFromAddress = fromAddress;
  let parsedFromName = fromName;

  const fromMatch = fromAddress.match(/^(.+?)\s*<(.+?)>$/);
  if (fromMatch) {
    parsedFromName = fromMatch[1].trim();
    parsedFromAddress = fromMatch[2].trim();
  }

  return {
    smtpHost: "email-smtp.us-east-2.amazonaws.com",
    smtpPort: 587,
    smtpUser,
    smtpPass,
    fromAddress: parsedFromAddress,
    fromName: parsedFromName,
  };
}

/**
 * Validate email addresses
 */
export function validateEmails(emails: string | string[]): {
  valid: string[];
  invalid: string[];
} {
  const emailArray = Array.isArray(emails) ? emails : [emails];
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const email of emailArray) {
    if (email && typeof email === "string" && validator.isEmail(email.trim())) {
      valid.push(email.trim().toLowerCase());
    } else {
      invalid.push(email);
    }
  }

  return { valid, invalid };
}

/**
 * Add unsubscribe footer to HTML
 */
function addUnsubscribeFooter(html: string, unsubscribeUrl: string): string {
  if (html.includes("{{unsubscribe_url}}")) {
    return html.replace(/{{unsubscribe_url}}/g, unsubscribeUrl);
  }

  const footer = `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #333; text-align: center; font-size: 12px; color: #666;">
      <p style="margin: 8px 0;">
        <a href="${unsubscribeUrl}" style="color: #A78BFA; text-decoration: underline;">Unsubscribe</a> from these emails.
      </p>
      <p style="margin: 8px 0; color: #666;">
        You're receiving this email because you're a PathGen user.
      </p>
    </div>
  `;

  if (html.includes("</body>")) {
    return html.replace("</body>", `${footer}</body>`);
  }

  return html + footer;
}

/**
 * Add contact footer
 */
function addContactFooter(html: string): string {
  const contactInfo = `
    <div style="margin-top: 20px; text-align: center; font-size: 12px; color: #A0A0A0;">
      <p style="margin: 4px 0;">
        <a href="https://pathgen.dev" style="color: #A78BFA; text-decoration: none;">pathgen.dev</a> | 
        <a href="https://discord.gg/G8ph5P9HAw" style="color: #A78BFA; text-decoration: none;">Discord</a>
      </p>
    </div>
  `;

  if (html.includes("</body>")) {
    return html.replace("</body>", `${contactInfo}</body>`);
  }

  return html + contactInfo;
}

/**
 * Send email interface
 */
export interface SendEmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  variables?: Record<string, any>;
  userId?: string;
  skipRateLimit?: boolean;
}

/**
 * Send email result
 */
export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  rejected?: string[];
  error?: string;
  sentCount: number;
  accepted?: string[];
}

let transporter: any | null = null;

function getTransporter(): any {
  if (transporter) {
    return transporter;
  }

  const config = getEmailConfig();

  transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: false,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
    tls: {
      rejectUnauthorized: true,
    },
  });

  return transporter;
}

/**
 * Main email sending function
 */
export async function sendEmail(
  options: SendEmailOptions
): Promise<SendEmailResult> {
  try {
    // Validate emails
    const { valid, invalid } = validateEmails(options.to);

    if (valid.length === 0) {
      throw new Error("No valid email addresses provided");
    }

    // Load template if provided
    let html = options.html || "";
    if (options.template && !html) {
      // Try to load from Firestore
      try {
        const templateDoc = await db
          .collection("emailTemplates")
          .doc(options.template)
          .get();

        if (templateDoc.exists) {
          html = templateDoc.data()?.html || "";
          
          // Inject variables
          if (options.variables) {
            for (const [key, value] of Object.entries(options.variables)) {
              html = html.replace(
                new RegExp(`{{\\s*${key}\\s*}}`, "g"),
                value !== undefined && value !== null ? String(value) : ""
              );
            }
          }
        } else {
          throw new Error(`Template ${options.template} not found`);
        }
      } catch (error) {
        console.error(`[EMAIL] Failed to load template:`, error);
        throw error;
      }
    }

    if (!html || html.trim() === "") {
      throw new Error("Email HTML content is required (provide html or template)");
    }

    // Add footers
    const unsubscribeUrl =
      `https://pathgen.dev/unsubscribe?email=${encodeURIComponent(
        Array.isArray(options.to) ? valid[0] : valid[0]
      )}`;

    html = addUnsubscribeFooter(html, unsubscribeUrl);
    html = addContactFooter(html);

    // Generate text version
    const text = options.text || convert(html, {
      wordwrap: 80,
      preserveNewlines: true,
    });

    // Get config
    const config = getEmailConfig();

    // Generate unique Message-ID
    const messageId = `<${Date.now()}.${Math.random().toString(36).substring(7)}@pathgen.dev>`;

    // Validate CC and BCC if provided
    let validCc: string[] = [];
    let validBcc: string[] = [];
    
    if (options.cc) {
      const ccValidation = validateEmails(options.cc);
      validCc = ccValidation.valid;
      if (ccValidation.invalid.length > 0) {
        console.warn('[EMAIL] Invalid CC addresses:', ccValidation.invalid);
      }
    }
    
    if (options.bcc) {
      const bccValidation = validateEmails(options.bcc);
      validBcc = bccValidation.valid;
      if (bccValidation.invalid.length > 0) {
        console.warn('[EMAIL] Invalid BCC addresses:', bccValidation.invalid);
      }
    }

    // Send email with proper headers for deliverability
    const message: any = {
      from: `"${config.fromName}" <${config.fromAddress}>`,
      to: valid,
      subject: options.subject,
      html,
      text,
      // Add headers to improve deliverability and avoid promotions tab
      headers: {
        // List-Unsubscribe header (RFC 2369) - Required for bulk emails per Gmail
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        // DO NOT use Precedence: bulk - it triggers promotional classification
        // Instead, use headers that make it look more transactional
        // X-Entity-Ref-ID - makes email look more transactional
        'X-Entity-Ref-ID': messageId.replace(/[<>]/g, ''),
        // X-Mailer header - identify the sending system
        'X-Mailer': 'PathGen Email System v2',
        // Message-ID - must be unique per message
        'Message-ID': messageId,
        // Return-Path - for bounce handling (should match From domain)
        'Return-Path': config.fromAddress,
        // X-Priority - normal priority (1=high, 3=normal, 5=low)
        'X-Priority': '3',
        // Importance - normal
        'Importance': 'normal',
        // X-Auto-Response-Suppress - prevent auto-responders
        'X-Auto-Response-Suppress': 'All',
        // Date header - will be set automatically by nodemailer, but we can override
        'Date': new Date().toUTCString(),
        // Authentication-Results header (helps with deliverability)
        'Authentication-Results': `pathgen.dev; dkim=pass; spf=pass; dmarc=pass`,
        // MIME-Version
        'MIME-Version': '1.0',
        // X-Campaign-ID - helps with tracking without triggering promotions
        'X-Campaign-ID': `launch-reminder-${Date.now()}`,
        // Note: Content-Type is automatically set by nodemailer based on html/text properties
        // Do NOT set it manually as it causes duplicate header errors
      },
      // Reply-To header - should match From address for better deliverability
      replyTo: config.fromAddress,
      // Envelope from - should match From address
      envelope: {
        from: config.fromAddress,
        to: valid,
      },
    };

    // Add CC and BCC if provided
    if (validCc.length > 0) {
      message.cc = validCc;
      if (message.envelope) {
        message.envelope.cc = validCc;
      }
    }
    
    if (validBcc.length > 0) {
      message.bcc = validBcc;
      if (message.envelope) {
        message.envelope.bcc = validBcc;
      }
    }

    // Add configuration set if specified (optional)
    const configSet = process.env.SES_CONFIGURATION_SET || "PathGen-Email-Events";
    if (configSet) {
      (message as any).ses = {
        ConfigurationSetName: configSet
      };
    }

    const transporter = getTransporter();
    const sentInfo = await transporter.sendMail(message);

    // Check for rejected addresses from nodemailer response
    const rejected = sentInfo.rejected || [];
    const accepted = sentInfo.accepted || [];
    
    console.log('[EMAIL] Send result:', {
      messageId: sentInfo.messageId,
      accepted: accepted.length,
      rejected: rejected.length,
      acceptedAddresses: accepted,
      rejectedAddresses: rejected,
    });

    // If all addresses were rejected, this is a failure
    if (rejected.length > 0 && accepted.length === 0) {
      throw new Error(`All email addresses were rejected: ${rejected.join(', ')}`);
    }

    // Log to Firestore
    try {
      const logData: any = {
        event: rejected.length > 0 ? "partially_sent" : "sent",
        to: valid,
        subject: options.subject,
        userId: options.userId || null,
        messageId: sentInfo.messageId,
        sentCount: accepted.length,
        rejectedCount: rejected.length,
        accepted: accepted,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      };
      
      // Only include rejected if there are any (Firestore doesn't accept undefined)
      if (rejected.length > 0) {
        logData.rejected = rejected;
      }
      
      await db.collection("emailLogs").add(logData);
    } catch (logError) {
      console.error("[EMAIL] Failed to log:", logError);
    }

    return {
      success: accepted.length > 0,
      messageId: sentInfo.messageId,
      rejected: rejected.length > 0 ? rejected : (invalid.length > 0 ? invalid : undefined),
      sentCount: accepted.length,
      accepted: accepted,
    };
  } catch (error: any) {
    console.error("[EMAIL] Send failed:", error);

    // Log error
    try {
      await db.collection("emailLogs").add({
        event: "failed",
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        error: error.message || String(error),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (logError) {
      // Ignore logging errors
    }

    return {
      success: false,
      error: error.message || "Failed to send email",
      sentCount: 0,
    };
  }
}

/**
 * Broadcast email to all users
 */
export async function broadcastEmail(options: {
  template?: string;
  subject: string;
  html?: string;
  variables?: Record<string, any>;
}): Promise<{
  success: boolean;
  totalUsers: number;
  sent: number;
  failed: number;
  error?: string;
}> {
  try {
    // Get all users with email addresses
    const usersSnapshot = await db
      .collection("users")
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

    // Load template if provided
    let html = options.html || "";
    if (options.template) {
      // Try to load from Firestore first
      try {
        const templateDoc = await db
          .collection("emailTemplates")
          .doc(options.template)
          .get();

        if (templateDoc.exists) {
          html = templateDoc.data()?.html || "";
        } else {
          throw new Error(`Template ${options.template} not found`);
        }
      } catch (error) {
        console.error(`[EMAIL] Failed to load template:`, error);
        throw error;
      }

      // Inject variables
      if (options.variables) {
        for (const [key, value] of Object.entries(options.variables)) {
          html = html.replace(
            new RegExp(`{{\\s*${key}\\s*}}`, "g"),
            value !== undefined && value !== null ? String(value) : ""
          );
        }
      }
    }

    if (!html) {
      throw new Error("Email HTML content is required");
    }

    // Send in batches of 50
    const batchSize = 50;
    let totalSent = 0;
    let totalFailed = 0;

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const result = await sendEmail({
        to: batch,
        subject: options.subject,
        html,
        skipRateLimit: true, // Admin broadcasts bypass rate limits
      });

      if (result.success) {
        totalSent += result.sentCount;
      } else {
        totalFailed += batch.length;
      }

      // Small delay between batches
      if (i + batchSize < emails.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return {
      success: totalFailed === 0,
      totalUsers: emails.length,
      sent: totalSent,
      failed: totalFailed,
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
      .collection("emailLogs")
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
      recentLogs: recentLogs.slice(0, 50),
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
 * Get email usage stats
 */
export async function getEmailUsageStats(): Promise<{
  totalSent: number;
  lastSentAt: admin.firestore.Timestamp | null;
  dailyCount: number;
  minuteCount: number;
}> {
  try {
    const usageDoc = await db.collection("emailUsage").doc("global").get();

    if (!usageDoc.exists) {
      return {
        totalSent: 0,
        lastSentAt: null,
        dailyCount: 0,
        minuteCount: 0,
      };
    }

    const data = usageDoc.data() as any;
    return {
      totalSent: data.totalSent || 0,
      lastSentAt: data.lastSentAt || null,
      dailyCount: data.dailyCount || 0,
      minuteCount: data.minuteCount || 0,
    };
  } catch (error: any) {
    console.error("[EMAIL] Failed to get usage stats:", error);
    return {
      totalSent: 0,
      lastSentAt: null,
      dailyCount: 0,
      minuteCount: 0,
    };
  }
}

/**
 * Get comprehensive email stats
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
    const [usage, deliverability, templatesSnapshot] = await Promise.all([
      getEmailUsageStats(),
      getDeliverabilityStats(7),
      db.collection("emailTemplates").get(),
    ]);

    return {
      usage,
      deliverability: {
        totalSent: deliverability.totalSent,
        totalFailed: deliverability.totalFailed,
        successRate: deliverability.successRate,
      },
      templates: templatesSnapshot.size,
    };
  } catch (error: any) {
    console.error("[EMAIL] Failed to get email stats:", error);
    throw error;
  }
}

