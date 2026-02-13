/**
 * Twitter Ingestion Utility Module
 * Implements comprehensive AI-safe Twitter data processing
 * Based on the AI Twitter Ingestion Checklist
 */

import { db } from './firebase-admin';

// ============================================================================
// 1. INPUT VALIDATION
// ============================================================================

export interface TwitterIngestionInput {
  query?: string;
  topic?: string;
  handle?: string;
  username?: string;
  dateFilter?: {
    hours?: number;
    days?: number;
  };
  keywords?: string[];
}

export function validateInput(input: TwitterIngestionInput): { valid: boolean; error?: string } {
  // Check if query/topic/handle is valid
  if (!input.query && !input.topic && !input.handle && !input.username) {
    return { valid: false, error: 'Must provide query, topic, handle, or username' };
  }

  // Reject scraping requests that are too broad or unsafe
  if (input.query) {
    const query = input.query.trim().toLowerCase();
    if (query.length < 2) {
      return { valid: false, error: 'Query too short (minimum 2 characters)' };
    }
    if (query.length > 100) {
      return { valid: false, error: 'Query too long (maximum 100 characters)' };
    }
    // Reject overly broad queries
    const broadTerms = ['all', 'everything', 'everyone', 'all tweets', 'all users'];
    if (broadTerms.some(term => query.includes(term))) {
      return { valid: false, error: 'Query too broad - please be more specific' };
    }
  }

  // Validate username/handle format
  const username = input.handle || input.username;
  if (username) {
    const normalized = normalizeUsername(username);
    if (!normalized || normalized.length < 1 || normalized.length > 15) {
      return { valid: false, error: 'Invalid username format' };
    }
    // Reject unsafe usernames
    const unsafePatterns = /[@#$%^&*()+=<>?\/\\|{}[\]]/;
    if (unsafePatterns.test(normalized)) {
      return { valid: false, error: 'Username contains invalid characters' };
    }
  }

  return { valid: true };
}

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase().replace(/^@/, '');
}

export function normalizeText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Remove emojis
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================================
// 2. RATE LIMITING & COOLDOWN
// ============================================================================

const rateLimitStore = new Map<string, { count: number; lastRequest: number }>();
const COOLDOWN_MS = 2000; // 2 seconds between scrapes
const MAX_REQUESTS_PER_MINUTE = 10;

export async function checkRateLimit(identifier: string): Promise<{ allowed: boolean; waitMs?: number }> {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record) {
    rateLimitStore.set(identifier, { count: 1, lastRequest: now });
    return { allowed: true };
  }

  // Check cooldown
  const timeSinceLastRequest = now - record.lastRequest;
  if (timeSinceLastRequest < COOLDOWN_MS) {
    return { allowed: false, waitMs: COOLDOWN_MS - timeSinceLastRequest };
  }

  // Check per-minute limit
  const oneMinuteAgo = now - 60000;
  if (record.lastRequest < oneMinuteAgo) {
    // Reset counter if last request was more than a minute ago
    rateLimitStore.set(identifier, { count: 1, lastRequest: now });
    return { allowed: true };
  }

  if (record.count >= MAX_REQUESTS_PER_MINUTE) {
    return { allowed: false, waitMs: 60000 - (now - (record.lastRequest - (record.count - 1) * 6000)) };
  }

  record.count++;
  record.lastRequest = now;
  return { allowed: true };
}

export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    // Sanitize hostname
    if (!parsed.hostname || parsed.hostname.length > 253) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

// ============================================================================
// 3. DATA FILTERING
// ============================================================================

export interface ProcessedTweet {
  id: string;
  text: string;
  createdAt: string;
  username: string;
  url?: string;
  isRetweet?: boolean;
  isReply?: boolean;
  isPromoted?: boolean;
  images?: string[]; // Array of image URLs
  imageDescriptions?: string[]; // Array of image descriptions/alt text
  engagement?: {
    likes?: number;
    retweets?: number;
    replies?: number;
  };
}

export interface FilterOptions {
  removeRetweets?: boolean;
  removeReplies?: boolean;
  removePromoted?: boolean;
  removeDuplicates?: boolean;
  keywords?: string[];
  dateFilter?: {
    hours?: number;
    days?: number;
  };
}

export function filterTweets(tweets: ProcessedTweet[], options: FilterOptions = {}): ProcessedTweet[] {
  let filtered = [...tweets];

  // Remove retweets
  if (options.removeRetweets !== false) {
    filtered = filtered.filter(t => !t.isRetweet && !t.text.toLowerCase().startsWith('rt @'));
  }

  // Remove replies
  if (options.removeReplies !== false) {
    filtered = filtered.filter(t => !t.isReply);
  }

  // Remove promoted content
  if (options.removePromoted !== false) {
    filtered = filtered.filter(t => !t.isPromoted);
  }

  // Remove duplicates
  if (options.removeDuplicates !== false) {
    const seen = new Set<string>();
    filtered = filtered.filter(t => {
      const key = t.id || t.text.toLowerCase().trim();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // Filter by keywords
  if (options.keywords && options.keywords.length > 0) {
    const keywordLower = options.keywords.map(k => k.toLowerCase());
    filtered = filtered.filter(t => {
      const textLower = t.text.toLowerCase();
      return keywordLower.some(keyword => textLower.includes(keyword));
    });
  }

  // Apply date filtering
  if (options.dateFilter) {
    const now = Date.now();
    const cutoffMs = options.dateFilter.hours
      ? now - (options.dateFilter.hours * 60 * 60 * 1000)
      : options.dateFilter.days
      ? now - (options.dateFilter.days * 24 * 60 * 60 * 1000)
      : 0;

    if (cutoffMs > 0) {
      filtered = filtered.filter(t => {
        const tweetDate = new Date(t.createdAt).getTime();
        return tweetDate >= cutoffMs;
      });
    }
  }

  return filtered;
}

// ============================================================================
// 4. TEXT CLEANING
// ============================================================================

export function cleanTweetText(text: string, options: {
  stripUrls?: boolean;
  stripHashtags?: boolean;
  stripMentions?: boolean;
  stripTracking?: boolean;
} = {}): string {
  let cleaned = text;

  // Strip URLs
  if (options.stripUrls !== false) {
    cleaned = cleaned.replace(/https?:\/\/[^\s]+/gi, '');
  }

  // Strip hashtags
  if (options.stripHashtags !== false) {
    cleaned = cleaned.replace(/#\w+/g, '');
  }

  // Strip @mentions
  if (options.stripMentions !== false) {
    cleaned = cleaned.replace(/@\w+/g, '');
  }

  // Remove tracking junk
  if (options.stripTracking !== false) {
    cleaned = cleaned.replace(/view status/gi, '');
    cleaned = cleaned.replace(/view this tweet/gi, '');
    cleaned = cleaned.replace(/pic\.twitter\.com\/\w+/gi, '');
  }

  // Clean up whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * Extract image URLs from tweet text or metadata
 * Looks for Twitter image URLs (pbs.twimg.com) and pic.twitter.com links
 */
export function extractImageUrls(text: string, metadata?: any): string[] {
  const imageUrls: string[] = [];
  
  // Extract Twitter image URLs from text
  const twitterImagePattern = /https?:\/\/pbs\.twimg\.com\/[^\s]+/gi;
  const matches = text.match(twitterImagePattern);
  if (matches) {
    imageUrls.push(...matches.map(url => url.trim()));
  }
  
  // Extract pic.twitter.com links (these can be converted to image URLs)
  const picTwitterPattern = /pic\.twitter\.com\/(\w+)/gi;
  const picMatches = text.match(picTwitterPattern);
  if (picMatches) {
    // Note: pic.twitter.com links need to be resolved to actual image URLs
    // For now, we'll store them as-is and they can be resolved later
    picMatches.forEach(match => {
      if (!imageUrls.includes(match)) {
        imageUrls.push(`https://${match}`);
      }
    });
  }
  
  // Check metadata for attached media (if available from API)
  if (metadata?.attachments?.media_keys) {
    // If we have media keys, we'd need to resolve them via Twitter API
    // For now, we'll just note that media exists
  }
  
  // Remove duplicates and validate URLs
  const uniqueUrls = Array.from(new Set(imageUrls))
    .map(url => sanitizeUrl(url))
    .filter((url): url is string => url !== null);
  
  return uniqueUrls;
}

// ============================================================================
// 5. AI-SAFE CONTENT FILTER
// ============================================================================

const VIOLENT_KEYWORDS = [
  'kill', 'murder', 'violence', 'assault', 'attack', 'harm', 'hurt',
  'weapon', 'gun', 'knife', 'bomb', 'explosive'
];

const HATE_KEYWORDS = [
  'hate', 'racist', 'sexist', 'discriminat', 'slur'
];

const NSFW_KEYWORDS = [
  'nsfw', 'porn', 'explicit', 'adult content'
];

const POLITICAL_KEYWORDS = [
  'vote for', 'campaign', 'election', 'political party', 'endorsement',
  'vote', 'ballot', 'candidate'
];

const MISINFORMATION_KEYWORDS = [
  'fake news', 'conspiracy', 'hoax', 'false claim'
];

const MALICIOUS_KEYWORDS = [
  'hack', 'malware', 'virus', 'exploit', 'crack', 'pirate'
];

export function isSafeForAI(content: string): { safe: boolean; reason?: string } {
  const lower = content.toLowerCase();

  // Check for violent content
  if (VIOLENT_KEYWORDS.some(keyword => lower.includes(keyword))) {
    return { safe: false, reason: 'Contains violent content' };
  }

  // Check for hate speech
  if (HATE_KEYWORDS.some(keyword => lower.includes(keyword))) {
    return { safe: false, reason: 'Contains hate speech' };
  }

  // Check for NSFW content
  if (NSFW_KEYWORDS.some(keyword => lower.includes(keyword))) {
    return { safe: false, reason: 'Contains NSFW content' };
  }

  // Check for political campaign content
  if (POLITICAL_KEYWORDS.some(keyword => lower.includes(keyword))) {
    return { safe: false, reason: 'Contains political campaign content' };
  }

  // Check for known misinformation terms
  if (MISINFORMATION_KEYWORDS.some(keyword => lower.includes(keyword))) {
    return { safe: false, reason: 'Contains misinformation indicators' };
  }

  // Check for harmful instructions (coding malware, etc.)
  if (MALICIOUS_KEYWORDS.some(keyword => lower.includes(keyword))) {
    return { safe: false, reason: 'Contains potentially malicious content' };
  }

  return { safe: true };
}

// ============================================================================
// 6. DEDUPLICATION + COMPRESSION
// ============================================================================

export function deduplicateTweets(tweets: ProcessedTweet[]): ProcessedTweet[] {
  const seen = new Map<string, ProcessedTweet>();

  for (const tweet of tweets) {
    const key = tweet.text.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.set(key, tweet);
    } else {
      // Keep the most viral or most recent version
      const existing = seen.get(key)!;
      const existingEngagement = (existing.engagement?.likes || 0) + (existing.engagement?.retweets || 0);
      const newEngagement = (tweet.engagement?.likes || 0) + (tweet.engagement?.retweets || 0);
      
      if (newEngagement > existingEngagement || new Date(tweet.createdAt) > new Date(existing.createdAt)) {
        seen.set(key, tweet);
      }
    }
  }

  return Array.from(seen.values());
}

// ============================================================================
// 7. TAGGING + METADATA EXTRACTION
// ============================================================================

export interface TweetMetadata {
  sentiment?: 'positive' | 'neutral' | 'negative';
  topics?: string[];
  entities?: string[];
  timestamp: string;
  engagement: {
    likes: number;
    retweets: number;
    replies: number;
  };
}

const POSITIVE_WORDS = ['great', 'amazing', 'excellent', 'love', 'best', 'awesome', 'fantastic', 'wonderful'];
const NEGATIVE_WORDS = ['bad', 'terrible', 'awful', 'hate', 'worst', 'disappointing', 'frustrating'];

export function extractMetadata(tweet: ProcessedTweet): TweetMetadata {
  const text = tweet.text.toLowerCase();
  
  // Extract sentiment
  let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
  const positiveCount = POSITIVE_WORDS.filter(word => text.includes(word)).length;
  const negativeCount = NEGATIVE_WORDS.filter(word => text.includes(word)).length;
  if (positiveCount > negativeCount) sentiment = 'positive';
  else if (negativeCount > positiveCount) sentiment = 'negative';

  // Extract topics (simple keyword-based)
  const topics: string[] = [];
  const topicKeywords: Record<string, string[]> = {
    'fortnite': ['fortnite', 'fn', 'chapter', 'season'],
    'competitive': ['tournament', 'fncs', 'competitive', 'ranked', 'scrim'],
    'update': ['update', 'patch', 'nerf', 'buff', 'changes'],
    'weapon': ['weapon', 'gun', 'rifle', 'shotgun', 'sniper'],
    'meta': ['meta', 'loadout', 'strategy']
  };

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(kw => text.includes(kw))) {
      topics.push(topic);
    }
  }

  // Extract entities (simple - names, stocks, etc.)
  const entities: string[] = [];
  const entityPatterns = [
    /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, // Names
    /\$[A-Z]{1,5}\b/g, // Stock symbols
  ];

  for (const pattern of entityPatterns) {
    const matches = tweet.text.match(pattern);
    if (matches) {
      entities.push(...matches);
    }
  }

  return {
    sentiment,
    topics: topics.length > 0 ? topics : undefined,
    entities: entities.length > 0 ? entities : undefined,
    timestamp: tweet.createdAt,
    engagement: {
      likes: tweet.engagement?.likes || 0,
      retweets: tweet.engagement?.retweets || 0,
      replies: tweet.engagement?.replies || 0,
    },
  };
}

// ============================================================================
// 8. AI MEMORY INGESTION RULES
// ============================================================================

export async function shouldIngestToMemory(tweet: ProcessedTweet): Promise<boolean> {
  // Only save information if it is long-term relevant
  const text = tweet.text.toLowerCase();
  const longTermKeywords = [
    'update', 'patch', 'announcement', 'release', 'new', 'change',
    'tournament', 'event', 'meta', 'strategy', 'guide', 'tip'
  ];

  const isLongTermRelevant = longTermKeywords.some(keyword => text.includes(keyword));

  // Check if it's factual and verifiable (not speculation)
  const speculationKeywords = ['maybe', 'might', 'rumor', 'leak', 'unconfirmed', 'possibly'];
  const isSpeculation = speculationKeywords.some(keyword => text.includes(keyword));

  // Check if it benefits future recommendations
  const isActionable = text.length > 50 && !text.startsWith('rt @');

  // Never store tweets with personal data
  const personalDataPatterns = [
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN
    /\b\d{16}\b/, // Credit card
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
  ];

  const hasPersonalData = personalDataPatterns.some(pattern => pattern.test(tweet.text));

  return isLongTermRelevant && !isSpeculation && isActionable && !hasPersonalData;
}

export function stripUsernames(text: string): string {
  return text.replace(/@\w+/g, '[USER]');
}

// ============================================================================
// 9. ERROR PROTECTION
// ============================================================================

export interface ScraperError {
  type: 'rate_limit' | 'not_found' | 'failed_job' | 'network' | 'unknown';
  message: string;
  statusCode?: number;
  retryable: boolean;
}

export function classifyError(error: any): ScraperError {
  const message = error.message || String(error);
  const statusCode = error.status || error.statusCode;

  if (statusCode === 429 || message.includes('rate limit') || message.includes('Too Many Requests')) {
    return {
      type: 'rate_limit',
      message: 'Rate limit exceeded. Please wait before trying again.',
      statusCode: 429,
      retryable: true,
    };
  }

  if (statusCode === 404 || message.includes('not found') || message.includes('404')) {
    return {
      type: 'not_found',
      message: 'Resource not found',
      statusCode: 404,
      retryable: false,
    };
  }

  if (message.includes('failed') || message.includes('error') || message.includes('exception')) {
    return {
      type: 'failed_job',
      message: 'Scraper job failed',
      statusCode: statusCode || 500,
      retryable: true,
    };
  }

  if (message.includes('network') || message.includes('timeout') || message.includes('ECONNREFUSED')) {
    return {
      type: 'network',
      message: 'Network error occurred',
      statusCode: statusCode || 0,
      retryable: true,
    };
  }

  return {
    type: 'unknown',
    message: message || 'Unknown error',
    statusCode: statusCode || 500,
    retryable: false,
  };
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorInfo = classifyError(error);

      if (!errorInfo.retryable || attempt === maxRetries - 1) {
        throw error;
      }

      const delay = baseDelayMs * Math.pow(2, attempt);
      console.log(`[RETRY] Attempt ${attempt + 1}/${maxRetries} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// ============================================================================
// 10. OUTPUT FORMATTING
// ============================================================================

export interface TwitterIngestionResult {
  tweets: Array<{
    id: string;
    text: string;
    author: string;
    createdAt: string;
    url?: string;
    metadata?: TweetMetadata;
  }>;
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  topics: string[];
  metadata: {
    total: number;
    processed: number;
    errors: number;
    filtered: number;
    method: string;
  };
}

export function formatIngestionResult(
  tweets: ProcessedTweet[],
  processed: number,
  errors: number,
  filtered: number,
  method: string
): TwitterIngestionResult {
  const allMetadata = tweets.map(t => extractMetadata(t));
  
  // Calculate overall sentiment
  const sentimentCounts = allMetadata.reduce((acc, m) => {
    acc[m.sentiment || 'neutral'] = (acc[m.sentiment || 'neutral'] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  let sentiment: 'positive' | 'neutral' | 'negative' | 'mixed' = 'neutral';
  if (sentimentCounts.positive && sentimentCounts.negative) {
    sentiment = 'mixed';
  } else if (sentimentCounts.positive && sentimentCounts.positive > (sentimentCounts.neutral || 0)) {
    sentiment = 'positive';
  } else if (sentimentCounts.negative && sentimentCounts.negative > (sentimentCounts.neutral || 0)) {
    sentiment = 'negative';
  }

  // Extract unique topics
  const allTopics = new Set<string>();
  allMetadata.forEach(m => {
    if (m.topics) {
      m.topics.forEach(t => allTopics.add(t));
    }
  });

  // Generate summary
  const summary = tweets.length === 0
    ? 'No fresh data found'
    : tweets.length === 1
    ? `Found 1 tweet from ${tweets[0].username}`
    : `Found ${tweets.length} tweets from ${new Set(tweets.map(t => t.username)).size} users`;

  return {
    tweets: tweets.map(t => ({
      id: t.id,
      text: cleanTweetText(t.text),
      author: t.username,
      createdAt: t.createdAt,
      url: t.url,
      metadata: extractMetadata(t),
    })),
    summary,
    sentiment,
    topics: Array.from(allTopics),
    metadata: {
      total: tweets.length,
      processed,
      errors,
      filtered,
      method,
    },
  };
}

// ============================================================================
// MAIN PROCESSING PIPELINE
// ============================================================================

export async function processTweetsForIngestion(
  rawTweets: ProcessedTweet[],
  options: FilterOptions = {}
): Promise<{ safe: ProcessedTweet[]; rejected: ProcessedTweet[] }> {
  const safe: ProcessedTweet[] = [];
  const rejected: ProcessedTweet[] = [];

  // Apply filtering
  let filtered = filterTweets(rawTweets, options);

  // Deduplicate
  filtered = deduplicateTweets(filtered);

  // Check each tweet for AI safety
  for (const tweet of filtered) {
    const cleaned = cleanTweetText(tweet.text);
    const safetyCheck = isSafeForAI(cleaned);

    if (safetyCheck.safe) {
      // Check if it should be ingested to memory
      const shouldIngest = await shouldIngestToMemory(tweet);
      if (shouldIngest) {
        safe.push(tweet);
      } else {
        rejected.push(tweet);
      }
    } else {
      rejected.push(tweet);
    }
  }

  return { safe, rejected };
}

