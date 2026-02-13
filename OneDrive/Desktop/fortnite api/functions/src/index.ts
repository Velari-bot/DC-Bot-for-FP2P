// PathGen Backend — Fortnite AI Coach

import * as admin from "firebase-admin";

// Initialize Firebase Admin
admin.initializeApp();

// Export all functions
export {onUserSignup} from "./auth/onUserSignup";
export {sendMessage} from "./messages/sendMessage";
export {pruneOldMessages} from "./messages/pruneMessages";
export {createConversation} from "./conversations/createConversation";
export {stripeWebhook} from "./stripe/webhook";
export {resetUsageOnRenewal} from "./subscriptions/resetUsage";
export {detectAbuse} from "./abuse/detectAbuse";
export {trackVoiceUsage} from "./usage/trackVoiceUsage";

// Email system functions are available via Next.js API routes
// Firebase Functions email exports can be added here if needed for callable functions