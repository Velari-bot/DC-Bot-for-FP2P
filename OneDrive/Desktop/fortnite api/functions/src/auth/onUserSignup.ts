// PathGen Backend — Fortnite AI Coach

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import {db, createBatch} from "../utils/firestore";
import {COLLECTIONS, DEFAULT_FREE_LIMITS, DEFAULT_PREMIUM_LIMITS, DEFAULT_PLAN_ID} from "../utils/constants";
import {User, Usage, Subscription} from "../types/firestore";

function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY || functions.config().stripe?.secret_key;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY not configured");
  }
  return new Stripe(secretKey, {
    apiVersion: "2023-10-16",
  });
}

/**
 * Triggered when a new user signs up
 * Creates user document, usage document, Stripe customer, and subscription
 */
export const onUserSignup = functions.auth.user().onCreate(async (user) => {
  const uid = user.uid;
  const email = user.email || "";
  const now = admin.firestore.Timestamp.now();

  try {
    // Create Stripe customer
    const customer = await getStripe().customers.create({
      email: email,
      metadata: {
        firebase_uid: uid,
      },
    });

    // Create batch for atomic writes
    const batch = createBatch();
    const userRef = db.collection(COLLECTIONS.USERS).doc(uid);
    const usageRef = db.collection(COLLECTIONS.USAGE).doc(uid);
    const subscriptionRef = db.collection(COLLECTIONS.SUBSCRIPTIONS).doc(uid);

    // Create user document
    const userData: Omit<User, "createdAt" | "lastLogin"> & {
      createdAt: admin.firestore.Timestamp;
      lastLogin: admin.firestore.Timestamp;
    } = {
      createdAt: now,
      email: email,
      username: user.displayName || `user_${uid.slice(0, 8)}`,
      platform: "Web", // Default, can be updated later
      lastLogin: now,
      stripeCustomerId: customer.id,
      activePlanId: DEFAULT_PLAN_ID,
      isPremium: false,
    };
    batch.set(userRef, userData);

    // Create usage document with free limits
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1); // 30 days from now

    const usageData: Usage = {
      messagesThisPeriod: 0,
      voiceSecondsThisPeriod: 0,
      freeTierLimits: DEFAULT_FREE_LIMITS,
      premiumTierLimits: DEFAULT_PREMIUM_LIMITS,
      periodStart: now,
      periodEnd: admin.firestore.Timestamp.fromDate(periodEnd),
    };
    batch.set(usageRef, usageData);

    // Create subscription document
    const subscriptionData: Subscription = {
      stripeCustomerId: customer.id,
      stripeSubscriptionId: "", // No active subscription yet
      planId: DEFAULT_PLAN_ID,
      status: "active", // Free tier is "active"
      currentPeriodStart: now,
      currentPeriodEnd: admin.firestore.Timestamp.fromDate(periodEnd),
      cancelAtPeriodEnd: false,
      updatedAt: now,
    };
    batch.set(subscriptionRef, subscriptionData);

    // Commit all writes atomically
    await batch.commit();

    functions.logger.info(`User ${uid} created successfully with Stripe customer ${customer.id}`);
    return null;
  } catch (error: any) {
    functions.logger.error(`Error creating user ${uid}:`, error);
    throw new functions.https.HttpsError("internal", "Failed to create user", error.message);
  }
});
