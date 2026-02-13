/**
 * Twitter Stream Connector
 * Connects to Twitter v2 filtered stream API with automatic reconnection
 */

import axios, { AxiosError } from 'axios';
import { StreamConfig, TwitterStreamResponse, TwitterStreamRule, TweetData } from './types';
import { saveTweet } from './storage';

const TWITTER_API_URL = 'https://api.twitter.com/2';
const STREAM_URL = `${TWITTER_API_URL}/tweets/search/stream`;
const RULES_URL = `${TWITTER_API_URL}/tweets/search/stream/rules`;

export class TwitterStream {
  private config: StreamConfig;
  private isConnected: boolean = false;
  private shouldReconnect: boolean = true;
  private reconnectDelay: number;
  private readonly maxReconnectDelay: number;
  private reconnectAttempts: number = 0;
  private abortController: AbortController | null = null;

  constructor(config: StreamConfig) {
    this.config = config;
    this.reconnectDelay = config.reconnectDelay || 1000; // Start with 1 second
    this.maxReconnectDelay = config.maxReconnectDelay || 60000; // Max 60 seconds
  }

  /**
   * Get current stream rules
   */
  private async getRules(): Promise<TwitterStreamRule[]> {
    try {
      const response = await axios.get(RULES_URL, {
        headers: {
          'Authorization': `Bearer ${this.config.bearerToken}`
        }
      });

      return response.data.data || [];
    } catch (error) {
      console.error('Error getting stream rules:', error);
      return [];
    }
  }

  /**
   * Delete all existing rules
   */
  private async deleteAllRules(): Promise<void> {
    const rules = await this.getRules();
    
    if (rules.length === 0) {
      console.log('No existing rules to delete');
      return;
    }

    const ids = rules.map((rule: any) => rule.id);

    try {
      await axios.post(
        RULES_URL,
        { delete: { ids } },
        {
          headers: {
            'Authorization': `Bearer ${this.config.bearerToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`Deleted ${ids.length} existing rules`);
    } catch (error) {
      console.error('Error deleting rules:', error);
      throw error;
    }
  }

  /**
   * Set up stream rules for tracked users
   */
  private async setupRules(): Promise<void> {
    try {
      // Delete existing rules first
      await this.deleteAllRules();

      // Create rule for tracked users
      const userQuery = this.config.trackedUsers
        .map(user => `from:${user}`)
        .join(' OR ');

      const rules: TwitterStreamRule[] = [
        {
          value: userQuery,
          tag: 'fortnite-accounts'
        }
      ];

      await axios.post(
        RULES_URL,
        { add: rules },
        {
          headers: {
            'Authorization': `Bearer ${this.config.bearerToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`Stream rules set up for users: ${this.config.trackedUsers.join(', ')}`);
    } catch (error) {
      console.error('Error setting up rules:', error);
      throw error;
    }
  }

  /**
   * Process incoming tweet data
   */
  private async processTweet(data: TwitterStreamResponse): Promise<void> {
    try {
      if (!data.data) {
        console.warn('Received tweet without data field');
        return;
      }

      // Find user info from includes
      const user = data.includes?.users?.find(u => u.id === data.data.author_id);

      if (!user) {
        console.warn('Tweet received without user info');
        return;
      }

      const tweetData: TweetData = {
        tweet_id: data.data.id,
        username: user.username,
        author_id: data.data.author_id,
        name: user.name,
        profile_image_url: user.profile_image_url,
        text: data.data.text,
        created_at: new Date(data.data.created_at),
        raw: data
      };

      // Save to database
      await saveTweet(tweetData);

      // Call custom callback if provided
      if (this.config.onTweet) {
        await this.config.onTweet(tweetData);
      }
    } catch (error) {
      console.error('Error processing tweet:', error);
      if (this.config.onError) {
        this.config.onError(error as Error);
      }
    }
  }

  /**
   * Connect to the Twitter stream
   */
  private async connectStream(): Promise<void> {
    try {
      console.log('Connecting to Twitter stream...');

      this.abortController = new AbortController();

      const response = await axios.get(STREAM_URL, {
        headers: {
          'Authorization': `Bearer ${this.config.bearerToken}`
        },
        params: {
          'tweet.fields': 'created_at,text,author_id',
          'user.fields': 'username,name,profile_image_url',
          'expansions': 'author_id'
        },
        responseType: 'stream',
        signal: this.abortController.signal
      });

      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.reconnectDelay = this.config.reconnectDelay || 1000;

      console.log('✅ Connected to Twitter stream');

      // Process stream data
      let buffer = '';

      response.data.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();

        // Split on newlines
        const lines = buffer.split('\r\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.trim() === '') continue;

          try {
            const data = JSON.parse(line);
            this.processTweet(data);
          } catch (error) {
            console.error('Error parsing tweet JSON:', line.substring(0, 100));
          }
        }
      });

      response.data.on('error', (error: Error) => {
        console.error('Stream error:', error);
        this.isConnected = false;
        
        if (this.config.onError) {
          this.config.onError(error);
        }

        this.handleReconnect();
      });

      response.data.on('end', () => {
        console.log('Stream ended');
        this.isConnected = false;
        this.handleReconnect();
      });

    } catch (error) {
      this.isConnected = false;
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        console.error('Stream connection error:', axiosError.response?.status, axiosError.response?.data);
        
        // Don't reconnect on auth errors
        if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
          console.error('❌ Authentication error - check your X_BEARER_TOKEN');
          this.shouldReconnect = false;
          return;
        }
      } else {
        console.error('Stream connection error:', error);
      }

      if (this.config.onError) {
        this.config.onError(error as Error);
      }

      this.handleReconnect();
    }
  }

  /**
   * Handle reconnection with exponential backoff
   */
  private handleReconnect(): void {
    if (!this.shouldReconnect) {
      console.log('Reconnection disabled');
      return;
    }

    this.reconnectAttempts++;
    
    console.log(`Reconnecting in ${this.reconnectDelay / 1000}s (attempt ${this.reconnectAttempts})...`);

    if (this.config.onReconnect) {
      this.config.onReconnect();
    }

    setTimeout(() => {
      if (this.shouldReconnect) {
        this.connectStream();
      }
    }, this.reconnectDelay);

    // Exponential backoff (double delay each time, up to max)
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
  }

  /**
   * Start the stream connection
   */
  async start(): Promise<void> {
    try {
      console.log('Starting Twitter stream tracker...');
      
      // Set up stream rules
      await this.setupRules();

      // Connect to stream
      await this.connectStream();
    } catch (error) {
      console.error('Error starting stream:', error);
      throw error;
    }
  }

  /**
   * Stop the stream connection
   */
  stop(): void {
    console.log('Stopping Twitter stream...');
    this.shouldReconnect = false;
    this.isConnected = false;
    
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Check if stream is currently connected
   */
  isStreamConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Update tracked users and restart stream
   */
  async updateTrackedUsers(users: string[]): Promise<void> {
    console.log('Updating tracked users...');
    this.config.trackedUsers = users;
    
    // Stop current stream
    this.stop();
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Restart with new rules
    this.shouldReconnect = true;
    await this.start();
  }
}

