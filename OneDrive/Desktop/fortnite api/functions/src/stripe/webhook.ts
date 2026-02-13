// PathGen Backend — Fortnite AI Coach

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import {onRequest} from "firebase-functions/v2/https";
import {db, createBatch} from "../utils/firestore";
import {COLLECTIONS, DEFAULT_PREMIUM_LIMITS} from "../utils/constants";
import {Subscription} from "../types/firestore";

// Stripe will be initialized with secret from environment
let stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY || functions.config().stripe?.secret_key;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }
    stripe = new Stripe(secretKey, {
      apiVersion: "2023-10-16",
    });
  }
  return stripe;
}

/**
 * Stripe webhook handler
 * Handles subscription events and updates Firestore
 */
export const stripeWebhook = onRequest(
  {
    secrets: ["STRIPE_WEBHOOK_SECRET", "STRIPE_SECRET_KEY"],
    cors: true,
  },
  async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      functions.logger.error("STRIPE_WEBHOOK_SECRET not configured");
      res.status(500).send("Webhook secret not configured");
      return;
    }

    let event: Stripe.Event;

    try {
      event = getStripe().webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      functions.logger.error(`Webhook signature verification failed:`, err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    // Log webhook event
    await db.collection(COLLECTIONS.WEBHOOKS).doc(event.id).set({
      type: event.type,
      data: event.data.object,
      createdAt: admin.firestore.Timestamp.now(),
    });

    functions.logger.info(`Received Stripe webhook: ${event.type}`);

    try {
      switch (event.type) {
        case "checkout.session.completed":
          await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;

        case "customer.subscription.created":
        case "customer.subscription.updated":
          await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
          break;

        case "invoice.paid":
          await handleInvoicePaid(event.data.object as Stripe.Invoice);
          break;

        case "invoice.payment_failed":
          await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        case "customer.subscription.deleted":
          await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        default:
          functions.logger.info(`Unhandled event type: ${event.type}`);
      }

      res.json({received: true});
    } catch (error: any) {
      functions.logger.error(`Error processing webhook ${event.type}:`, error);
      res.status(500).json({error: error.message});
    }
  }
);

/**
 * Handle checkout session completed
 * Ensures subscription is set up when checkout completes
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const subscriptionId = session.subscription as string;
  const customerId = session.customer as string;

  if (!subscriptionId || !customerId) {
    functions.logger.info("Checkout completed but no subscription or customer ID");
    return;
  }

  // Retrieve the subscription to get full details
  try {
    const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
    // Process the subscription update
    await handleSubscriptionUpdate(subscription);
    functions.logger.info(`Checkout completed - subscription ${subscriptionId} processed`);
  } catch (error: any) {
    functions.logger.error(`Error processing checkout completion:`, error);
    throw error;
  }
}

/**
 * Handle invoice payment failed
 * Updates subscription status when payment fails
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const subscriptionId = (invoice as any).subscription as string;

  if (!subscriptionId) {
    return; // Not a subscription invoice
  }

  // Find user
  const usersSnapshot = await db
    .collection(COLLECTIONS.USERS)
    .where("stripeCustomerId", "==", customerId)
    .limit(1)
    .get();

  if (usersSnapshot.empty) {
    functions.logger.error(`User not found for customer ${customerId}`);
    return;
  }

  const uid = usersSnapshot.docs[0].id;

  // Retrieve subscription to check status
  try {
    const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
    
    // Update subscription status (might be past_due now)
    await handleSubscriptionUpdate(subscription);
    
    functions.logger.info(`Payment failed for user ${uid} - subscription status: ${subscription.status}`);
    
    // You can add notification logic here (email, etc.)
  } catch (error: any) {
    functions.logger.error(`Error handling payment failure:`, error);
    throw error;
  }
}

/**
 * Handle subscription created/updated
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id;

  // Find user by Stripe customer ID
  const usersSnapshot = await db
    .collection(COLLECTIONS.USERS)
    .where("stripeCustomerId", "==", customerId)
    .limit(1)
    .get();

  if (usersSnapshot.empty) {
      functions.logger.error(`User not found for customer ${customerId}`);
    return;
  }

  const userDocSnapshot = usersSnapshot.docs[0];
  const uid = userDocSnapshot.id;

  // Determine plan from price ID
  const priceId = subscription.items.data[0]?.price.id || "";
  const priceMetadata = subscription.items.data[0]?.price.metadata || {};
  let planId: "free" | "pro_monthly" | "pro_yearly" = "free";
  
  // Premium status: active, trialing, or past_due (they still have access during grace period)
  // Only canceled, incomplete, or incomplete_expired lose access
  const isPremium = 
    subscription.status === "active" || 
    subscription.status === "trialing" || 
    subscription.status === "past_due";

  // Check metadata first, then price ID
  if (priceMetadata.plan_id === "pro_monthly" || priceId.includes("monthly")) {
    planId = "pro_monthly";
  } else if (priceMetadata.plan_id === "pro_yearly" || priceId.includes("yearly") || priceId.includes("annual")) {
    planId = "pro_yearly";
  }

  // Ensure user exists and has stripeCustomerId set
  const userDocRef = db.collection(COLLECTIONS.USERS).doc(uid);
  const userDocData = await userDocRef.get();
  
  if (!userDocData.exists) {
    functions.logger.error(`User document ${uid} does not exist`);
    return;
  }

  // Update stripeCustomerId if not set (in case checkout completed first)
  const userData = userDocData.data();
  if (!userData?.stripeCustomerId) {
    functions.logger.info(`Setting stripeCustomerId for user ${uid}`);
    await userDocRef.update({
      stripeCustomerId: customerId,
    });
  }

  const now = admin.firestore.Timestamp.now();
  const currentPeriodStart = admin.firestore.Timestamp.fromDate(
    new Date((subscription as any).current_period_start * 1000)
  );
  const currentPeriodEnd = admin.firestore.Timestamp.fromDate(
    new Date((subscription as any).current_period_end * 1000)
  );

  // Update subscription document
  const subscriptionData: Subscription = {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    planId: planId,
    status: subscription.status as "active" | "past_due" | "canceled",
    currentPeriodStart: currentPeriodStart,
    currentPeriodEnd: currentPeriodEnd,
    cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
    updatedAt: now,
  };

  // Use batch to update multiple documents atomically
  const batch = createBatch();

  // Update subscription
  batch.set(db.collection(COLLECTIONS.SUBSCRIPTIONS).doc(uid), subscriptionData, {merge: true});

  // Update user
  batch.update(db.collection(COLLECTIONS.USERS).doc(uid), {
    isPremium: isPremium,
    activePlanId: planId,
  });

  // Update usage period if subscription is active
  if (isPremium) {
    const usageRef = db.collection(COLLECTIONS.USAGE).doc(uid);
    const usageDoc = await usageRef.get();

    if (usageDoc.exists) {
      batch.update(usageRef, {
        periodStart: currentPeriodStart,
        periodEnd: currentPeriodEnd,
        premiumTierLimits: DEFAULT_PREMIUM_LIMITS,
      });
    }
  }

  try {
    await batch.commit();
    functions.logger.info(`[SUCCESS] Updated subscription for user ${uid}: ${planId} (${subscription.status})`);
  } catch (error: any) {
    functions.logger.error(`[ERROR] Failed to commit subscription update for user ${uid}:`, error);
    throw error; // Re-throw to trigger webhook retry
  }
}

/**
 * Handle invoice paid - reset usage on billing cycle renewal
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) {
    return; // Not a subscription invoice
  }

      // Get subscription (retrieve from Stripe)
      const subscription = await getStripe().subscriptions.retrieve(subscriptionId);

  // Find user
  const usersSnapshot = await db
    .collection(COLLECTIONS.USERS)
    .where("stripeCustomerId", "==", customerId)
    .limit(1)
    .get();

  if (usersSnapshot.empty) {
      functions.logger.error(`User not found for customer ${customerId}`);
    return;
  }

  const uid = usersSnapshot.docs[0].id;

  // Reset usage for new billing period
  const currentPeriodStart = admin.firestore.Timestamp.fromDate(
    new Date((subscription as any).current_period_start * 1000)
  );
  const currentPeriodEnd = admin.firestore.Timestamp.fromDate(
    new Date((subscription as any).current_period_end * 1000)
  );

  try {
    await db.collection(COLLECTIONS.USAGE).doc(uid).update({
      messagesThisPeriod: 0,
      voiceSecondsThisPeriod: 0,
      periodStart: currentPeriodStart,
      periodEnd: currentPeriodEnd,
    });

    functions.logger.info(`[SUCCESS] Reset usage for user ${uid} on invoice payment`);
  } catch (error: any) {
    functions.logger.error(`[ERROR] Failed to reset usage for user ${uid}:`, error);
    throw error; // Re-throw to trigger webhook retry
  }
}

/**
 * Handle subscription deleted - downgrade to free
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  // Find user
  const usersSnapshot = await db
    .collection(COLLECTIONS.USERS)
    .where("stripeCustomerId", "==", customerId)
    .limit(1)
    .get();

  if (usersSnapshot.empty) {
      functions.logger.error(`User not found for customer ${customerId}`);
    return;
  }

  const uid = usersSnapshot.docs[0].id;

  // Update to free tier
  const batch = createBatch();
  const now = admin.firestore.Timestamp.now();

  batch.update(db.collection(COLLECTIONS.USERS).doc(uid), {
    isPremium: false,
    activePlanId: "free",
  });

  batch.update(db.collection(COLLECTIONS.SUBSCRIPTIONS).doc(uid), {
    status: "canceled",
    updatedAt: now,
  });

  try {
    await batch.commit();
    functions.logger.info(`[SUCCESS] Downgraded user ${uid} to free tier`);
  } catch (error: any) {
    functions.logger.error(`[ERROR] Failed to downgrade user ${uid}:`, error);
    throw error; // Re-throw to trigger webhook retry
  }
}
