// PathGen Backend — Fortnite AI Coach

/**
 * Firestore Data Model Types
 * Following exact schema requirements
 */

import * as admin from 'firebase-admin';

export type Platform = 'iOS' | 'Android' | 'Web';
export type PlanId = 'free' | 'pro_monthly' | 'pro_yearly';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled';
export type MessageType = 'text' | 'voice';
export type MessageRole = 'user' | 'assistant';

/**
 * /users/{uid}
 */
export interface User {
  createdAt: admin.firestore.Timestamp;
  email: string;
  username: string;
  platform: Platform;
  lastLogin: admin.firestore.Timestamp;
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
  currentPeriodStart: admin.firestore.Timestamp;
  currentPeriodEnd: admin.firestore.Timestamp;
  cancelAtPeriodEnd: boolean;
  updatedAt: admin.firestore.Timestamp;
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
  periodStart: admin.firestore.Timestamp;
  periodEnd: admin.firestore.Timestamp;
}

