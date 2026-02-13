// PathGen Backend — Fortnite AI Coach

/**
 * Constants and default values
 */

export const DEFAULT_FREE_LIMITS = {
  maxMessages: 50,
  maxVoiceSeconds: 300,
};

export const DEFAULT_PREMIUM_LIMITS = {
  maxMessages: 999999,
  maxVoiceSeconds: 999999,
};

export const DEFAULT_PLAN_ID: "free" = "free";

export const MESSAGE_PRUNE_DAYS = 75; // Between 60-90 days for free users

export const COLLECTIONS = {
  USERS: "users",
  SUBSCRIPTIONS: "subscriptions",
  USAGE: "usage",
  CONVERSATIONS: "conversations",
  MESSAGES: "messages",
  CONFIG: "config",
  WEBHOOKS: "webhooks/stripe",
  ABUSE: "abuse",
  ADMIN: "admin",
  EMAIL_USAGE: "emailUsage",
  EMAIL_LOGS: "emailLogs",
  EMAIL_TEMPLATES: "emailTemplates",
} as const;

// Email rate limits
export const EMAIL_RATE_LIMITS = {
  MAX_PER_MINUTE: 50,
  MAX_PER_DAY_GLOBAL: 500,
  MAX_PER_DAY_PER_USER: 5, // For triggered emails (password resets, etc.)
} as const;

// Email retry configuration
export const EMAIL_RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY_MS: 1000, // 1 second
  MAX_DELAY_MS: 10000, // 10 seconds
} as const;
