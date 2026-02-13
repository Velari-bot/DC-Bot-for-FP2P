// PathGen Email System — AWS SES Configuration

/**
 * Email configuration and environment variables
 * Never hardcode secrets — always load from environment variables
 */

export interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  fromAddress: string;
  fromName: string;
}

/**
 * Get email configuration from environment variables
 * Falls back to Firebase Functions config if env vars not set
 */
export function getEmailConfig(): EmailConfig {
  // Try environment variables first (for local dev or Vercel)
  const smtpUser = process.env.EMAIL_SMTP_USER;
  const smtpPass = process.env.EMAIL_SMTP_PASS;
  const fromAddress = process.env.EMAIL_FROM || "no-reply@pathgen.gg";
  const fromName = process.env.EMAIL_FROM_NAME || "PathGen";

  // If env vars not set, try Firebase Functions config (for Cloud Functions)
  // Note: Firebase Functions v2 uses secrets, not config
  // For v1 compatibility, we check both
  const finalSmtpUser = smtpUser || "";
  const finalSmtpPass = smtpPass || "";

  if (!finalSmtpUser || !finalSmtpPass) {
    throw new Error(
      "EMAIL_SMTP_USER and EMAIL_SMTP_PASS must be set as environment variables or Firebase secrets"
    );
  }

  // Parse from address if it includes name
  // Format: "PathGen <no-reply@pathgen.gg>" or just "no-reply@pathgen.gg"
  let parsedFromAddress = fromAddress;
  let parsedFromName = fromName;

  const fromMatch = fromAddress.match(/^(.+?)\s*<(.+?)>$/);
  if (fromMatch) {
    parsedFromName = fromMatch[1].trim();
    parsedFromAddress = fromMatch[2].trim();
  }

  return {
    smtpHost: "email-smtp.us-east-2.amazonaws.com",
    smtpPort: 587, // STARTTLS port (fallback: 2587)
    smtpUser: finalSmtpUser,
    smtpPass: finalSmtpPass,
    fromAddress: parsedFromAddress,
    fromName: parsedFromName,
  };
}

/**
 * Get email configuration for testing
 * Uses environment variables directly
 */
export function getTestEmailConfig(): EmailConfig {
  const smtpUser = process.env.EMAIL_SMTP_USER;
  const smtpPass = process.env.EMAIL_SMTP_PASS;
  const fromAddress = process.env.EMAIL_FROM || "support@pathgen.dev";
  const fromName = process.env.EMAIL_FROM_NAME || "PathGen Support";

  if (!smtpUser || !smtpPass) {
    throw new Error("EMAIL_SMTP_USER and EMAIL_SMTP_PASS must be set");
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

