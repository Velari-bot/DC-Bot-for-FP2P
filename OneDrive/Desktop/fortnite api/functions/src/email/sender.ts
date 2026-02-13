// PathGen Email System — AWS SES Email Sender

import * as nodemailer from "nodemailer";
import * as admin from "firebase-admin";
import { getEmailConfig } from "./config";
import { validateEmails } from "./validation";
import {
  loadTemplate,
  injectVariables,
  htmlToText,
  addUnsubscribeFooter,
  addContactFooter,
  addTrackingPixel,
  addClickTracking,
} from "./templates";
import { canSendEmail, incrementEmailUsage } from "./usage";
import { EMAIL_RETRY_CONFIG } from "../utils/constants";
import { COLLECTIONS } from "../utils/constants";

const db = admin.firestore();

/**
 * Email sending options
 */
export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  variables?: Record<string, any>;
  userId?: string; // For rate limiting per user
  skipRateLimit?: boolean; // For admin broadcasts
}

/**
 * Email sending result
 */
export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  rejected?: string[];
  error?: string;
  sentCount: number;
}

/**
 * Create nodemailer transporter (reused for connection pooling)
 */
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) {
    return transporter;
  }

  const config = getEmailConfig();

  transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: false, // Use STARTTLS
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
    tls: {
      rejectUnauthorized: true, // Verify SSL certificate
    },
  });

  return transporter;
}

/**
 * Sleep utility for retries
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry email send with exponential backoff
 */
async function retrySend(
  sendFn: () => Promise<nodemailer.SentMessageInfo>,
  retryCount: number = 0
): Promise<nodemailer.SentMessageInfo> {
  try {
    return await sendFn();
  } catch (error: any) {
    if (retryCount >= EMAIL_RETRY_CONFIG.MAX_RETRIES) {
      throw error;
    }

    // Calculate exponential backoff delay
    const delay = Math.min(
      EMAIL_RETRY_CONFIG.INITIAL_DELAY_MS * Math.pow(2, retryCount),
      EMAIL_RETRY_CONFIG.MAX_DELAY_MS
    );

    console.warn(
      `[EMAIL] Send failed (attempt ${retryCount + 1}/${EMAIL_RETRY_CONFIG.MAX_RETRIES + 1}), retrying in ${delay}ms...`
    );

    await sleep(delay);
    return retrySend(sendFn, retryCount + 1);
  }
}

/**
 * Log email event to Firestore
 */
async function logEmailEvent(
  event: "sent" | "failed" | "rejected",
  options: SendEmailOptions,
  result?: SendEmailResult,
  error?: any
): Promise<void> {
  try {
    const logData: any = {
      event,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      userId: options.userId || null,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      template: options.template || null,
    };

    if (result) {
      logData.messageId = result.messageId;
      logData.sentCount = result.sentCount;
      logData.rejected = result.rejected || [];
    }

    if (error) {
      logData.error = error.message || String(error);
      logData.errorCode = error.code;
      logData.errorResponse = error.response;
    }

    await db.collection(COLLECTIONS.EMAIL_LOGS).add(logData);
  } catch (logError) {
    // Don't fail email send if logging fails
    console.error("[EMAIL] Failed to log email event:", logError);
  }
}

/**
 * Main email sending function
 */
export async function sendEmail(
  options: SendEmailOptions
): Promise<SendEmailResult> {
  const startTime = Date.now();

  try {
    // Validate email addresses
    const { valid, invalid } = validateEmails(options.to);

    if (invalid.length > 0) {
      console.error(`[EMAIL] Invalid email addresses: ${invalid.join(", ")}`);
      // Continue with valid emails only
    }

    if (valid.length === 0) {
      throw new Error("No valid email addresses provided");
    }

    // Check rate limits (unless skipped for admin broadcasts)
    if (!options.skipRateLimit) {
      const rateLimitCheck = await canSendEmail(options.userId);
      if (!rateLimitCheck.allowed) {
        const error = new Error(rateLimitCheck.reason || "Rate limit exceeded");
        await logEmailEvent("failed", options, undefined, error);
        throw error;
      }
    }

    // Load template if provided
    let html = options.html || "";
    if (options.template) {
      const template = await loadTemplate(options.template);
      html = injectVariables(template, options.variables || {});
    }

    if (!html) {
      throw new Error("Email HTML content is required");
    }

    // Generate unsubscribe URL
    const unsubscribeUrl =
      options.variables?.unsubscribe_url ||
      `https://pathgen.dev/unsubscribe?email=${encodeURIComponent(
        Array.isArray(options.to) ? options.to[0] : options.to
      )}`;

    // Add required footers
    html = addUnsubscribeFooter(html, unsubscribeUrl);
    html = addContactFooter(html);

    // Add tracking (only if we have messageId and email)
    const primaryEmail = Array.isArray(options.to) ? options.to[0] : options.to;
    if (messageId && primaryEmail) {
      html = addTrackingPixel(html, messageId, primaryEmail);
      html = addClickTracking(html, messageId, primaryEmail);
    }

    // Generate text version if not provided
    let text = options.text;
    if (!text) {
      text = htmlToText(html);
    }

    // Get email config
    const config = getEmailConfig();

    // Prepare unsubscribe URL
    const unsubscribeUrl =
      `https://pathgen.dev/unsubscribe?email=${encodeURIComponent(
        Array.isArray(options.to) ? valid[0] : valid[0]
      )}`;

    // Generate unique Message-ID
    const messageId = `<${Date.now()}.${Math.random().toString(36).substring(7)}@pathgen.dev>`;

    // Prepare email message with proper headers for deliverability
    const message: nodemailer.SendMailOptions = {
      from: `"${config.fromName}" <${config.fromAddress}>`,
      to: valid,
      subject: options.subject,
      html,
      text,
      // Add headers to improve deliverability and land in Primary inbox
      headers: {
        // List-Unsubscribe header (RFC 2369) - Required for compliance
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        // DO NOT use Precedence: bulk - it triggers Promotions tab
        // Instead use headers that make it look transactional/personal
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
        // Date header - proper timestamp
        'Date': new Date().toUTCString(),
        // MIME-Version
        'MIME-Version': '1.0',
      },
      // Reply-To header - should match From address
      replyTo: config.fromAddress,
      // Envelope from - should match From address
      envelope: {
        from: config.fromAddress,
        to: valid,
      },
    };

    // Add configuration set if specified (optional)
    const configSet = process.env.SES_CONFIGURATION_SET || "PathGen-Email-Events";
    if (configSet) {
      (message as any).ses = {
        ConfigurationSetName: configSet
      };
    }

    // Send email with retry logic
    const transporter = getTransporter();
    const sendFn = () => transporter.sendMail(message);

    let sentInfo: nodemailer.SentMessageInfo;
    try {
      sentInfo = await retrySend(sendFn);
    } catch (sendError: any) {
      // Log failure
      await logEmailEvent("failed", options, undefined, sendError);

      // Store error for admin dashboard
      await db.collection(COLLECTIONS.EMAIL_LOGS).add({
        event: "error",
        error: sendError.message || String(sendError),
        errorCode: sendError.code,
        errorResponse: sendError.response,
        to: valid,
        subject: options.subject,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      throw sendError;
    }

    // Increment usage counters
    const sentCount = valid.length;
    await incrementEmailUsage(options.userId, sentCount);

    // Log success
    const result: SendEmailResult = {
      success: true,
      messageId: sentInfo.messageId,
      rejected: invalid.length > 0 ? invalid : undefined,
      sentCount,
    };

    await logEmailEvent("sent", options, result);

    const duration = Date.now() - startTime;
    console.log(
      `[EMAIL] Sent ${sentCount} email(s) in ${duration}ms (messageId: ${sentInfo.messageId})`
    );

    return result;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[EMAIL] Send failed after ${duration}ms:`, error);

    // Return sanitized error (never leak AWS credentials)
    const sanitizedError = error.message || "Failed to send email";
    if (error.code) {
      console.error(`[EMAIL] SES Error Code: ${error.code}`);
    }
    if (error.response) {
      console.error(`[EMAIL] SES Response: ${error.response}`);
    }

    return {
      success: false,
      error: sanitizedError,
      sentCount: 0,
    };
  }
}

/**
 * Send email to multiple recipients (batched)
 * AWS SES allows up to 50 recipients per email
 */
export async function sendBulkEmail(
  options: Omit<SendEmailOptions, "to"> & {
    to: string[];
    batchSize?: number;
  }
): Promise<{
  totalSent: number;
  totalFailed: number;
  results: SendEmailResult[];
}> {
  const batchSize = options.batchSize || 50; // AWS SES limit
  const allRecipients = options.to;
  const results: SendEmailResult[] = [];
  let totalSent = 0;
  let totalFailed = 0;

  // Process in batches
  for (let i = 0; i < allRecipients.length; i += batchSize) {
    const batch = allRecipients.slice(i, i + batchSize);

    try {
      const result = await sendEmail({
        ...options,
        to: batch,
      });

      results.push(result);

      if (result.success) {
        totalSent += result.sentCount;
      } else {
        totalFailed += batch.length;
      }

      // Small delay between batches to avoid rate limits
      if (i + batchSize < allRecipients.length) {
        await sleep(100);
      }
    } catch (error: any) {
      console.error(`[EMAIL] Batch failed:`, error);
      totalFailed += batch.length;
      results.push({
        success: false,
        error: error.message || "Batch send failed",
        sentCount: 0,
      });
    }
  }

  return {
    totalSent,
    totalFailed,
    results,
  };
}

