// PathGen Backend — Fortnite AI Coach

/**
 * Constants and default values
 * Updated to match new pricing structure
 */

// FREE TIER - "Starter"
export const DEFAULT_FREE_LIMITS = {
  maxMessagesPerDay: 5, // 5 messages/day
  maxMessageLength: 200, // Max 200 characters per message
  saveChatHistory: false, // No saved chat history
  maxVoiceSecondsPerDay: 0, // 0 seconds/day
  maxVoiceSecondsPerMonth: 0, // 0 seconds/month
  maxVoiceInteractionsPerMonth: 0, // 0 interactions/month
  gameplayClipsPerWeek: 0, // 0 clips/week
  competitiveInsightsPerWeek: 0, // 0 insights/week
  maxImagesPerDay: 0, // 0 images/day for free users
};

// BASE PRO TIER - "Pro Core" ($6.99/mo)
export const DEFAULT_PRO_LIMITS = {
  maxMessagesPerMonth: 200, // 200 messages/month
  maxMessageLength: 1000, // 1,000 characters max per message
  saveChatHistory: true, // Saves chat history
  betterModelResponses: true, // Better model responses
  maxVoiceSecondsPerMonth: 0, // No voice in base pro
  maxVoiceInteractionsPerMonth: 0, // No voice in base pro
  maxVoiceSecondsPerMonthPro: 0, // Requires add-on
  maxVoiceInteractionsPerMonthPro: 0, // Requires add-on
  gameplayClipsPerMonth: 0, // No gameplay analysis in base pro
  gameplayReplaysPerMonth: 0, // No replays in base pro
  competitiveInsightsPerMonth: 0, // No competitive insights in base pro
  maxImagesPerDay: 3, // 3 images/day for paid users
};

// ADD-ONS
export const ADDON_LIMITS = {
  // Gameplay Analysis Add-On (+$1.50/mo)
  gameplay: {
    clipsPerMonth: 0, // No clips in gameplay add-on
    replaysPerMonth: 15, // 15 replays/month
    priorityProcessing: true,
    basicHeatmaps: true,
    mistakeLabels: true,
  },
  // Competitive Insights Add-On (+$0.75/mo)
  competitive: {
    insightsPerMonth: -1, // UNLIMITED (use -1 to indicate unlimited)
    fncsReports: true, // UNLIMITED
    rankedMetaBreakdowns: true, // UNLIMITED
    loadoutMeta: true, // UNLIMITED
    patchChanges: true, // UNLIMITED
    proPlayPatterns: true, // UNLIMITED
  },
  // Voice Interaction Add-On (+$1.99/mo)
  voice: {
    minutesPerMonth: 60, // 60 minutes/month (3,600 seconds) - 30 min max per session
    totalInteractionsPerMonth: 550, // 550 interactions/month total (all from add-on, base pro has 0)
    maxSecondsPerSession: 1800, // 30 minutes per session (hard cap)
    maxSecondsPerMonth: 3600, // 3,600 seconds/month (60 minutes total)
    unlimitedSeconds: false, // Limited to 3,600 seconds/month
    realTimePushToTalk: true,
    tacticalCoaching: true,
    voicedClipReview: true, // If Gameplay Add-On is active
  },
};

// Legacy compatibility (for existing code)
export const DEFAULT_FREE_LIMITS_LEGACY = {
  maxMessages: 15, // Per day, not per month
  maxVoiceSeconds: 30, // Per day
};

export const DEFAULT_PREMIUM_LIMITS = {
  maxMessages: 300, // Per month for base pro
  maxVoiceSeconds: 0, // Base pro has no voice
};

export const COLLECTIONS = {
  USERS: 'users',
  SUBSCRIPTIONS: 'subscriptions',
  USAGE: 'usage',
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  CONFIG: 'config',
  WEBHOOKS: 'webhooks', // Collection name - use subcollections for organization
  ABUSE: 'abuse',
  ADMIN: 'admin',
} as const;

// Allowed email senders for memory ingestion
export const ALLOWED_EMAIL_SENDERS = [
  'noreply@pathgen.gg',
  'updates@pathgen.gg',
  'kinchanalytics@kinchanalytics.com',
] as const;

