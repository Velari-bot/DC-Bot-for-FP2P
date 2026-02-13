/**
 * Twitter Data Source
 * Reads from existing tweet-tracker database
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { FortniteRecord } from '../types';

const TWEETS_FILE = path.join(process.cwd(), 'data', 'tweets', 'tweets.json');

export async function collectTwitterData(): Promise<FortniteRecord[]> {
  const records: FortniteRecord[] = [];

  try {
    if (!await fs.pathExists(TWEETS_FILE)) {
      console.log('  ⚠️  No tweets file found');
      return [];
    }

    const data = await fs.readJSON(TWEETS_FILE);
    const tweets = data.tweets || [];

    console.log(`  📱 Found ${tweets.length} tweets`);

    for (const tweet of tweets) {
      records.push({
        id: `twitter-${tweet.tweet_id}`,
        source: 'twitter',
        author: tweet.username,
        title: undefined,
        content: tweet.text,
        created_at: tweet.created_at,
        url: `https://twitter.com/${tweet.username}/status/${tweet.tweet_id}`,
        tags: extractTags(tweet.text),
        metadata: {
          tweet_id: tweet.tweet_id,
          author_id: tweet.author_id,
          name: tweet.name,
        },
      });
    }

    console.log(`  ✅ Processed ${records.length} Twitter records`);
  } catch (error) {
    console.error('  ❌ Error collecting Twitter data:', error);
  }

  return records;
}

function extractTags(text: string): string[] {
  const tags = new Set<string>();
  
  // Extract hashtags
  const hashtags = text.match(/#\w+/g) || [];
  hashtags.forEach(tag => tags.add(tag.toLowerCase()));
  
  // Common Fortnite keywords
  const keywords = [
    'fncs', 'eval', 'reload', 'vcc', 'solo', 'duo', 'squad',
    'tournament', 'competitive', 'patch', 'update', 'nerf', 'buff',
    'weapon', 'meta', 'ranked', 'arena', 'cup', 'finals',
  ];
  
  const lowerText = text.toLowerCase();
  keywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      tags.add(keyword);
    }
  });
  
  return Array.from(tags);
}

