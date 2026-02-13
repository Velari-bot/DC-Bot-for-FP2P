// PathGen Backend — Fortnite AI Coach

import * as functions from "firebase-functions";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import {db} from "../utils/firestore";
import {COLLECTIONS} from "../utils/constants";
import {Conversation, MessageType} from "../types/firestore";

/**
 * Create a new conversation
 */
export const createConversation = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const {title, type} = request.data;

  if (!title) {
    throw new HttpsError("invalid-argument", "Title is required");
  }

  try {
    const now = admin.firestore.Timestamp.now();
    const conversationId = db.collection(COLLECTIONS.CONVERSATIONS).doc().id;

    const conversationData: Conversation = {
      createdAt: now,
      updatedAt: now,
      title: title,
      lastMessageSnippet: "",
      type: (type as MessageType) || "text",
    };

    // Store as: /conversations/{uid}/conversations/{conversationId}
    await db
      .collection(COLLECTIONS.CONVERSATIONS)
      .doc(uid)
      .collection(COLLECTIONS.CONVERSATIONS)
      .doc(conversationId)
      .set(conversationData);

    return {
      success: true,
      conversationId: conversationId,
    };
  } catch (error: any) {
    functions.logger.error(`Error creating conversation for user ${uid}:`, error);
    throw new HttpsError("internal", "Failed to create conversation", error.message);
  }
});
