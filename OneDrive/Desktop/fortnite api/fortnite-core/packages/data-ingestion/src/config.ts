/**
 * Data Ingestion Configuration
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Find project root (go up from packages/data-ingestion)
const projectRoot = path.join(__dirname, '../../..');

export const config = {
  // Storage
  dataDir: path.join(projectRoot, 'data', 'ingestion'),
  recordsFile: path.join(projectRoot, 'data', 'ingestion', 'records.json'),
  latestFile: path.join(projectRoot, 'data', 'ingestion', 'latest.json'),
  maxRecords: 20000,

  // Scheduling
  cronSchedule: '*/10 * * * *', // Every 10 minutes
  
  // Twitter (already handled by tweet-tracker)
  twitter: {
    bearerToken: process.env.X_BEARER_TOKEN || '',
    trackedUsers: (process.env.TRACKED_TWITTER_USERS || '').split(',').map(u => u.trim()),
  },

  // Epic Games APIs
  epic: {
    cmsUrl: 'https://fortnitecontent-website-prod07.ol.epicgames.com/content/api/pages/fortnite-game',
    timeout: 10000,
  },

  // Fortnite-API.com
  fortniteApi: {
    baseUrl: 'https://fortnite-api.com/v2',
    endpoints: {
      news: '/news',
      shop: '/shop/br',
      tournaments: '/tournaments',
    },
    apiKey: process.env.FORTNITE_API_KEY || '', // Optional
  },

  // Reddit
  reddit: {
    clientId: process.env.REDDIT_CLIENT_ID || '',
    clientSecret: process.env.REDDIT_SECRET || '',
    userAgent: process.env.REDDIT_USER_AGENT || 'fortnite-ingestor/1.0',
    subreddits: ['FortniteBR', 'FortniteCompetitive', 'FortniteLeaks'],
    postsPerSubreddit: 10,
  },

  // News RSS Feeds
  news: {
    feeds: [
      { name: 'Fortnite Insider', url: 'https://fortniteinsider.com/feed/' },
      { name: 'ShiinaBR', url: 'https://shiinabr.com/feed/' },
      { name: 'HYPEX', url: 'https://hypex.gg/feed/' },
    ],
    itemsPerFeed: 10,
  },

  // System paths
  tweetsFile: path.join(projectRoot, 'data', 'tweets', 'tweets.json'),

  // Logging
  logging: {
    verbose: true,
    logFile: path.join(projectRoot, 'data', 'ingestion', 'ingestion.log'),
  },
};

export function validateConfig(): string[] {
  const warnings: string[] = [];

  if (!config.twitter.bearerToken) {
    warnings.push('X_BEARER_TOKEN not set - Twitter ingestion disabled');
  }

  if (!config.reddit.clientId || !config.reddit.clientSecret) {
    warnings.push('Reddit credentials not set - Reddit ingestion disabled');
  }

  return warnings;
}

