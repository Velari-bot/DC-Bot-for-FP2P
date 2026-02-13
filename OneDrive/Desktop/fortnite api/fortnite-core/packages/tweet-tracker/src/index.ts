/**
 * Tweet Tracker Package
 * Main entry point for Twitter/X API integration
 */

import * as dotenv from 'dotenv';
import { TwitterStream } from './stream';
import { TwitterPoller } from './poller';
import { 
  initTweetStorage, 
  saveTweet, 
  getRecentTweets, 
  getTweetsByUser,
  getTweetStats,
  clearAllTweets
} from './storage';
import { StreamConfig, TweetData } from './types';

// Load environment variables
dotenv.config();

let streamInstance: TwitterStream | null = null;
let pollerInstance: TwitterPoller | null = null;
let usePolling: boolean = false;

/**
 * Initialize the tweet tracker (with automatic polling fallback for Essential tier)
 * @param customConfig - Optional custom configuration
 * @param forcePolling - Force polling mode instead of streaming
 */
export const initTweetTracker = async (
  customConfig?: Partial<StreamConfig>, 
  forcePolling: boolean = true // Default to polling for Essential tier compatibility
): Promise<TwitterStream | TwitterPoller> => {
  console.log('Initializing tweet tracker...');

  // Initialize storage
  await initTweetStorage();

  // Get configuration from environment
  const bearerToken = process.env.X_BEARER_TOKEN || '';
  const trackedUsersEnv = process.env.TRACKED_TWITTER_USERS || 'FortniteGame,EpicGames,Kinch,Osirion';
  const trackedUsers = trackedUsersEnv.split(',').map(u => u.trim()).filter(u => u);

  if (!bearerToken) {
    throw new Error('X_BEARER_TOKEN environment variable is required');
  }

  if (trackedUsers.length === 0) {
    throw new Error('TRACKED_TWITTER_USERS environment variable must contain at least one username');
  }

  const onTweet = (tweet: TweetData) => {
    console.log(`📱 New tweet from @${tweet.username}: ${tweet.text.substring(0, 80)}...`);
  };

  const onError = (error: Error) => {
    console.error('❌ Error:', error.message);
  };

  console.log(`Tracking tweets from: ${trackedUsers.join(', ')}`);

  // Use polling mode (Essential tier compatible)
  if (forcePolling) {
    usePolling = true;
    console.log('📊 Using polling mode (Essential tier compatible)');
    console.log('🔄 Checking for new tweets every 15 minutes');
    
    pollerInstance = new TwitterPoller({
      bearerToken,
      trackedUsers,
      pollInterval: 900000, // 15 minutes (increased to avoid rate limits)
      onTweet,
      onError
    });
    
    return pollerInstance;
  }

  // Use streaming mode (requires Free tier or higher)
  console.log('📡 Using streaming mode (requires Free/Basic/Pro tier)');
  
  const config: StreamConfig = {
    bearerToken,
    trackedUsers,
    reconnectDelay: 1000,
    maxReconnectDelay: 60000,
    onTweet,
    onError,
    onReconnect: () => {
      console.log('🔄 Reconnecting to Twitter stream...');
    },
    ...customConfig
  };

  streamInstance = new TwitterStream(config);
  return streamInstance;
};

/**
 * Start the tweet tracker (streaming or polling)
 */
export const startTweetTracker = async (forcePolling: boolean = true): Promise<void> => {
  if (usePolling || forcePolling) {
    if (!pollerInstance) {
      pollerInstance = await initTweetTracker({}, true) as TwitterPoller;
    }
    await pollerInstance.start();
  } else {
    if (!streamInstance) {
      streamInstance = await initTweetTracker({}, false) as TwitterStream;
    }
    await streamInstance.start();
  }
};

/**
 * Stop the tweet tracker (streaming or polling)
 */
export const stopTweetTracker = (): void => {
  if (pollerInstance) {
    pollerInstance.stop();
  }
  if (streamInstance) {
    streamInstance.stop();
  }
};

/**
 * Get the current stream instance
 */
export const getStreamInstance = (): TwitterStream | null => {
  return streamInstance;
};

/**
 * Check if the tracker is running (stream or poller)
 */
export const isStreamConnected = (): boolean => {
  if (usePolling) {
    return pollerInstance?.isPollerRunning() || false;
  }
  return streamInstance?.isStreamConnected() || false;
};

// Re-export storage functions
export {
  saveTweet,
  getRecentTweets,
  getTweetsByUser,
  getTweetStats,
  clearAllTweets,
  initTweetStorage
};

// Re-export types
export * from './types';
export { TwitterStream } from './stream';
export { TwitterPoller } from './poller';

// If running directly, start the tracker
if (require.main === module) {
  (async () => {
    try {
      console.log('🚀 Starting Tweet Tracker...');
      await startTweetTracker();
      console.log('✅ Tweet Tracker is running');
    } catch (error) {
      console.error('Failed to start tweet tracker:', error);
      process.exit(1);
    }
  })();
}

