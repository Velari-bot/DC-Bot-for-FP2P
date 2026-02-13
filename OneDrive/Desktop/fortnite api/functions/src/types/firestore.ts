// PathGen Backend — Fortnite AI Coach

/**
 * Firestore Data Model Types
 * Following exact schema requirements
 */

export type Platform = "iOS" | "Android" | "Web";
export type PlanId = "free" | "pro_monthly" | "pro_yearly";
export type SubscriptionStatus = "active" | "past_due" | "canceled";
export type MessageType = "text" | "voice";
export type MessageRole = "user" | "assistant";

/**
 * /users/{uid}
 */
export interface User {
  createdAt: FirebaseFirestore.Timestamp;
  email: string;
  username: string;
  platform: Platform;
  lastLogin: FirebaseFirestore.Timestamp;
  fortniteSkill?: string;
  coachMode?: string;
  avatar?: string;
  stripeCustomerId: string;
  activePlanId: PlanId;
  isPremium: boolean; // cached boolean
}

/**
 * /subscriptions/{uid}
 */
export interface Subscription {
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  planId: PlanId;
  status: SubscriptionStatus;
  currentPeriodStart: FirebaseFirestore.Timestamp;
  currentPeriodEnd: FirebaseFirestore.Timestamp;
  cancelAtPeriodEnd: boolean;
  updatedAt: FirebaseFirestore.Timestamp;
}

/**
 * /usage/{uid}
 */
export interface Usage {
  messagesThisPeriod: number;
  voiceSecondsThisPeriod: number;
  freeTierLimits: {
    maxMessages: number;
    maxVoiceSeconds: number;
  };
  premiumTierLimits: {
    maxMessages: number;
    maxVoiceSeconds: number;
  };
  periodStart: FirebaseFirestore.Timestamp;
  periodEnd: FirebaseFirestore.Timestamp;
}

/**
 * /conversations/{uid}/{conversationId}
 */
export interface Conversation {
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  title: string;
  lastMessageSnippet: string;
  type: MessageType;
}

/**
 * /messages/{uid}/{conversationId}/{messageId}
 */
export interface Message {
  role: MessageRole;
  content: string;
  tokens: number;
  timestamp: FirebaseFirestore.Timestamp;
  audioUrl?: string;
  metadata: {
    model: string;
    latencyMs: number;
  };
}

/**
 * /config/global
 */
export interface GlobalConfig {
  freeMessageLimit: number;
  freeVoiceLimit: number;
  price_pro_monthly: number;
  price_pro_yearly: number;
  currentFortnitePatch: string;
  lastUpdated: FirebaseFirestore.Timestamp;
}

/**
 * /webhooks/stripe/{eventId}
 */
export interface StripeWebhook {
  type: string;
  data: any;
  createdAt: FirebaseFirestore.Timestamp;
}

/**
 * /abuse/{uid}
 */
export interface AbuseRecord {
  flaggedMessages: string[];
  lastFlagAt: FirebaseFirestore.Timestamp;
  bannedUntil?: FirebaseFirestore.Timestamp;
}
