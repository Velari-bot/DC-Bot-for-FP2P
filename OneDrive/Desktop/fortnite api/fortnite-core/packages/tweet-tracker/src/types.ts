/**
 * Tweet Tracker Types
 * TypeScript types for Twitter/X API integration
 */

export interface TweetData {
  tweet_id: string;
  username: string;
  author_id: string;
  name: string;
  profile_image_url?: string;
  text: string;
  created_at: Date;
  raw: any;
}

export interface TwitterUser {
  id: string;
  username: string;
  name: string;
  profile_image_url?: string;
}

export interface TwitterStreamRule {
  value: string;
  tag?: string;
}

export interface TwitterStreamResponse {
  data: {
    id: string;
    text: string;
    created_at: string;
    author_id: string;
  };
  includes?: {
    users?: Array<{
      id: string;
      username: string;
      name: string;
      profile_image_url?: string;
    }>;
  };
}

export interface StreamConfig {
  bearerToken: string;
  trackedUsers: string[];
  reconnectDelay?: number;
  maxReconnectDelay?: number;
  onTweet?: (tweet: TweetData) => void | Promise<void>;
  onError?: (error: Error) => void;
  onReconnect?: () => void;
}

export interface TweetQueryOptions {
  limit?: number;
  username?: string;
  startDate?: Date;
  endDate?: Date;
}

