/**
 * Twitter Polling Connector (Essential Tier Compatible)
 * Uses recent search endpoint instead of filtered stream
 */

import axios from 'axios';
import { TweetData } from './types';
import { saveTweet } from './storage';

const TWITTER_API_URL = 'https://api.twitter.com/2';
const SEARCH_URL = `${TWITTER_API_URL}/tweets/search/recent`;

export interface PollerConfig {
  bearerToken: string;
  trackedUsers: string[];
  pollInterval?: number; // milliseconds (default: 120000 = 2 minutes)
  onTweet?: (tweet: TweetData) => void | Promise<void>;
  onError?: (error: Error) => void;
}

export class TwitterPoller {
  private config: PollerConfig;
  private isRunning: boolean = false;
  private pollTimer: NodeJS.Timeout | null = null;
  private lastTweetIds: Set<string> = new Set();
  private pollInterval: number;

  constructor(config: PollerConfig) {
    this.config = config;
    this.pollInterval = config.pollInterval || 120000; // 2 minutes default
  }

  /**
   * Fetch recent tweets from tracked users
   */
  private async fetchRecentTweets(): Promise<void> {
    try {
      // Build search query: from:user1 OR from:user2
      const query = this.config.trackedUsers
        .map(user => `from:${user}`)
        .join(' OR ');

      const response = await axios.get(SEARCH_URL, {
        headers: {
          'Authorization': `Bearer ${this.config.bearerToken}`
        },
        params: {
          'query': query,
          'tweet.fields': 'created_at,text,author_id',
          'user.fields': 'username,name,profile_image_url',
          'expansions': 'author_id',
          'max_results': 10, // Recent tweets per request
          'sort_order': 'recency'
        }
      });

      if (!response.data.data || response.data.data.length === 0) {
        console.log('No new tweets found');
        return;
      }

      // Process tweets
      const tweets = response.data.data;
      const users = response.data.includes?.users || [];

      for (const tweetRaw of tweets) {
        // Skip if we've already processed this tweet
        if (this.lastTweetIds.has(tweetRaw.id)) {
          continue;
        }

        // Find user info
        const user = users.find((u: any) => u.id === tweetRaw.author_id);
        if (!user) {
          console.warn('Tweet received without user info');
          continue;
        }

        const tweetData: TweetData = {
          tweet_id: tweetRaw.id,
          username: user.username,
          author_id: tweetRaw.author_id,
          name: user.name,
          profile_image_url: user.profile_image_url,
          text: tweetRaw.text,
          created_at: new Date(tweetRaw.created_at),
          raw: { data: tweetRaw, includes: { users: [user] } }
        };

        // Save to database
        const saved = await saveTweet(tweetData);
        
        if (saved) {
          // Track this tweet ID
          this.lastTweetIds.add(tweetRaw.id);

          // Call custom callback if provided
          if (this.config.onTweet) {
            await this.config.onTweet(tweetData);
          }
        }
      }

      // Keep only recent tweet IDs (last 100) to prevent memory bloat
      if (this.lastTweetIds.size > 100) {
        const idsArray = Array.from(this.lastTweetIds);
        this.lastTweetIds = new Set(idsArray.slice(-100));
      }

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        
        // Handle rate limiting gracefully
        if (status === 429) {
          console.warn('⚠️  Rate limit reached - will retry on next poll cycle');
          return;
        }
        
        // Don't continue polling on auth errors
        if (status === 401 || status === 403) {
          console.error('❌ Authentication error - check your bearer token');
          this.stop();
          return;
        }
        
        console.error('Twitter API error:', status, error.response?.data);
      } else {
        console.error('Error fetching tweets:', error);
      }

      if (this.config.onError) {
        this.config.onError(error as Error);
      }
    }
  }

  /**
   * Start polling for tweets
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Poller is already running');
      return;
    }

    console.log('Starting Twitter tweet poller...');
    console.log(`Tracking: ${this.config.trackedUsers.join(', ')}`);
    console.log(`Poll interval: ${this.pollInterval / 1000} seconds`);

    this.isRunning = true;

    // Fetch immediately on start
    await this.fetchRecentTweets();

    // Then poll at intervals
    this.pollTimer = setInterval(async () => {
      if (this.isRunning) {
        await this.fetchRecentTweets();
      }
    }, this.pollInterval);

    console.log('✅ Tweet poller started');
  }

  /**
   * Stop polling
   */
  stop(): void {
    console.log('Stopping Twitter poller...');
    this.isRunning = false;
    
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    console.log('✅ Tweet poller stopped');
  }

  /**
   * Check if poller is running
   */
  isPollerRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Update tracked users and restart poller
   */
  async updateTrackedUsers(users: string[]): Promise<void> {
    console.log('Updating tracked users...');
    this.config.trackedUsers = users;
    
    if (this.isRunning) {
      this.stop();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.start();
    }
  }
}

