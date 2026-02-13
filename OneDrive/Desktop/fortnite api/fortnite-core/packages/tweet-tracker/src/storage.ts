/**
 * Tweet Storage Layer
 * Handles saving and retrieving tweets from the database
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { TweetData, TweetQueryOptions } from './types';

// Try multiple possible paths for tweets.json
const getTweetsPath = (): string => {
  const possiblePaths = [
    // From fortnite-core/packages/tweet-tracker (most likely)
    path.resolve(__dirname, '..', '..', '..', 'data', 'tweets', 'tweets.json'),
    // From root directory
    path.resolve(process.cwd(), 'fortnite-core', 'data', 'tweets', 'tweets.json'),
    path.resolve(process.cwd(), '..', 'fortnite-core', 'data', 'tweets', 'tweets.json'),
    path.resolve(process.cwd(), '..', '..', 'fortnite-core', 'data', 'tweets', 'tweets.json'),
    // From packages/api or packages/tweet-tracker
    path.resolve(process.cwd(), '..', '..', 'data', 'tweets', 'tweets.json'),
    path.resolve(process.cwd(), '..', 'data', 'tweets', 'tweets.json'),
    path.resolve(process.cwd(), 'data', 'tweets', 'tweets.json'),
    // Absolute paths using __dirname from dist folder
    path.resolve(__dirname, '..', '..', '..', '..', 'data', 'tweets', 'tweets.json'),
    path.resolve(__dirname, '..', '..', '..', '..', '..', 'data', 'tweets', 'tweets.json'),
  ];

  // Return first path that exists, or fall back to first one
  for (const filePath of possiblePaths) {
    try {
      const resolved = path.resolve(filePath);
      if (fs.existsSync(resolved)) {
        console.log(`Found tweets.json at: ${resolved}`);
        return resolved;
      }
    } catch {
      continue;
    }
  }

  // Fallback to most likely path (fortnite-core/data/tweets/tweets.json)
  const fallbackPath = path.resolve(__dirname, '..', '..', '..', 'data', 'tweets', 'tweets.json');
  console.log(`Using fallback path for tweets.json: ${fallbackPath}`);
  return fallbackPath;
};

const TWEETS_DB_FILE = getTweetsPath();

interface TweetsDatabase {
  tweets: TweetData[];
  lastUpdate: string;
}

let tweetsCache: TweetsDatabase | null = null;

/**
 * Initialize tweet storage
 */
export const initTweetStorage = async (): Promise<void> => {
  console.log('Initializing tweet storage...');
  
  // Ensure the directory exists
  const tweetsDir = path.dirname(TWEETS_DB_FILE);
  await fs.ensureDir(tweetsDir);
  
  // Create database file if it doesn't exist
  if (!await fs.pathExists(TWEETS_DB_FILE)) {
    console.log(`Creating new tweets database at: ${TWEETS_DB_FILE}`);
    const initialData: TweetsDatabase = {
      tweets: [],
      lastUpdate: new Date().toISOString()
    };
    await fs.writeJSON(TWEETS_DB_FILE, initialData, { spaces: 2 });
  }
  
  // Load into cache
  try {
    tweetsCache = await fs.readJSON(TWEETS_DB_FILE);
    console.log(`✅ Tweet storage initialized with ${tweetsCache?.tweets.length || 0} tweets from ${TWEETS_DB_FILE}`);
  } catch (error: any) {
    console.error(`⚠️  Failed to load tweets from ${TWEETS_DB_FILE}:`, error.message);
    // Initialize with empty data
    tweetsCache = {
      tweets: [],
      lastUpdate: new Date().toISOString()
    };
  }
};

/**
 * Load tweets from storage
 */
const loadTweets = async (): Promise<TweetsDatabase> => {
  if (tweetsCache) {
    return tweetsCache;
  }
  
  if (!await fs.pathExists(TWEETS_DB_FILE)) {
    await initTweetStorage();
  }
  
  tweetsCache = await fs.readJSON(TWEETS_DB_FILE);
  return tweetsCache!;
};

/**
 * Save tweets to storage
 */
const saveTweets = async (data: TweetsDatabase): Promise<void> => {
  data.lastUpdate = new Date().toISOString();
  await fs.writeJSON(TWEETS_DB_FILE, data, { spaces: 2 });
  tweetsCache = data;
};

/**
 * Save a single tweet to the database
 * @param tweet - Tweet data to save
 * @returns true if saved, false if duplicate
 */
export const saveTweet = async (tweet: TweetData): Promise<boolean> => {
  try {
    const data = await loadTweets();
    
    // Check for duplicates
    const exists = data.tweets.some(t => t.tweet_id === tweet.tweet_id);
    if (exists) {
      console.log(`Tweet ${tweet.tweet_id} already exists, skipping`);
      return false;
    }
    
    // Ensure created_at is a Date object
    if (typeof tweet.created_at === 'string') {
      tweet.created_at = new Date(tweet.created_at);
    }
    
    // Add tweet to beginning of array (newest first)
    data.tweets.unshift(tweet);
    
    // Keep only the most recent 10,000 tweets to prevent file bloat
    if (data.tweets.length > 10000) {
      data.tweets = data.tweets.slice(0, 10000);
    }
    
    await saveTweets(data);
    console.log(`Saved tweet from @${tweet.username}: ${tweet.text.substring(0, 50)}...`);
    
    return true;
  } catch (error) {
    console.error('Error saving tweet:', error);
    throw error;
  }
};

/**
 * Get recent tweets from the database
 * @param options - Query options
 * @returns Array of tweets
 */
export const getRecentTweets = async (options: TweetQueryOptions = {}): Promise<TweetData[]> => {
  try {
    const data = await loadTweets();
    let tweets = [...data.tweets];
    
    // Filter by username if specified
    if (options.username) {
      tweets = tweets.filter(t => 
        t.username.toLowerCase() === options.username!.toLowerCase()
      );
    }
    
    // Filter by date range
    if (options.startDate) {
      tweets = tweets.filter(t => 
        new Date(t.created_at) >= options.startDate!
      );
    }
    
    if (options.endDate) {
      tweets = tweets.filter(t => 
        new Date(t.created_at) <= options.endDate!
      );
    }
    
    // Sort by created_at descending (newest first)
    tweets.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    // Apply limit
    const limit = options.limit || 50;
    return tweets.slice(0, limit);
  } catch (error) {
    console.error('Error getting recent tweets:', error);
    return [];
  }
};

/**
 * Get tweets by a specific user
 * @param username - Twitter username (without @)
 * @param limit - Maximum number of tweets to return
 * @returns Array of tweets from that user
 */
export const getTweetsByUser = async (username: string, limit: number = 50): Promise<TweetData[]> => {
  return getRecentTweets({ username, limit });
};

/**
 * Get tweet statistics
 * @returns Stats object with tweet counts per user
 */
export const getTweetStats = async (): Promise<{
  total: number;
  byUser: Record<string, number>;
  oldestTweet?: string;
  newestTweet?: string;
}> => {
  try {
    const data = await loadTweets();
    const tweets = data.tweets;
    
    const stats = {
      total: tweets.length,
      byUser: {} as Record<string, number>,
      oldestTweet: undefined as string | undefined,
      newestTweet: undefined as string | undefined
    };
    
    // Count tweets per user
    tweets.forEach(tweet => {
      stats.byUser[tweet.username] = (stats.byUser[tweet.username] || 0) + 1;
    });
    
    // Find oldest and newest
    if (tweets.length > 0) {
      const sorted = [...tweets].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      stats.oldestTweet = sorted[0] ? new Date(sorted[0].created_at).toISOString() : undefined;
      stats.newestTweet = sorted[sorted.length - 1] ? new Date(sorted[sorted.length - 1].created_at).toISOString() : undefined;
    }
    
    return stats;
  } catch (error) {
    console.error('Error getting tweet stats:', error);
    return {
      total: 0,
      byUser: {}
    };
  }
};

/**
 * Clear all tweets (for testing/maintenance)
 */
export const clearAllTweets = async (): Promise<void> => {
  const data: TweetsDatabase = {
    tweets: [],
    lastUpdate: new Date().toISOString()
  };
  await saveTweets(data);
  console.log('All tweets cleared');
};

