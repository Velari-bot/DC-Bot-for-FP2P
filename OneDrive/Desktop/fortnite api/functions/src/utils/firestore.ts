// PathGen Backend — Fortnite AI Coach

import * as admin from "firebase-admin";
import { COLLECTIONS } from "./constants";

/**
 * Firestore helper functions
 */

export const db = admin.firestore();

/**
 * Get user document
 */
export async function getUser(uid: string): Promise<admin.firestore.DocumentSnapshot | null> {
  const userDoc = await db.collection(COLLECTIONS.USERS).doc(uid).get();
  return userDoc.exists ? userDoc : null;
}

/**
 * Get usage document
 */
export async function getUsage(uid: string): Promise<admin.firestore.DocumentSnapshot | null> {
  const usageDoc = await db.collection(COLLECTIONS.USAGE).doc(uid).get();
  return usageDoc.exists ? usageDoc : null;
}

/**
 * Get subscription document
 */
export async function getSubscription(uid: string): Promise<admin.firestore.DocumentSnapshot | null> {
  const subDoc = await db.collection(COLLECTIONS.SUBSCRIPTIONS).doc(uid).get();
  return subDoc.exists ? subDoc : null;
}

/**
 * Get global config
 */
export async function getGlobalConfig(): Promise<admin.firestore.DocumentSnapshot | null> {
  const configDoc = await db.collection(COLLECTIONS.CONFIG).doc("global").get();
  return configDoc.exists ? configDoc : null;
}

/**
 * Batch write helper
 */
export function createBatch() {
  return db.batch();
}

/**
 * Transaction helper
 */
export function runTransaction<T>(
  updateFunction: (transaction: admin.firestore.Transaction) => Promise<T>
): Promise<T> {
  return db.runTransaction(updateFunction);
}
