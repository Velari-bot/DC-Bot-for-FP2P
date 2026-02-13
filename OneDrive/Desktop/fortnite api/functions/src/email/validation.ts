// PathGen Email System — Email Validation

import validator from "validator";

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") {
    return false;
  }
  return validator.isEmail(email.trim());
}

/**
 * Validate multiple email addresses
 */
export function validateEmails(emails: string | string[]): {
  valid: string[];
  invalid: string[];
} {
  const emailArray = Array.isArray(emails) ? emails : [emails];
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const email of emailArray) {
    if (isValidEmail(email)) {
      valid.push(email.trim().toLowerCase());
    } else {
      invalid.push(email);
    }
  }

  return { valid, invalid };
}

/**
 * Sanitize email address (trim, lowercase)
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

