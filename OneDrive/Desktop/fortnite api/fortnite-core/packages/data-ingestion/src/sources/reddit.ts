/**
 * Reddit Data Source
 * Fetches posts from Fortnite subreddits
 */

import Snoowrap from 'snoowrap';
import { config } from '../config';
import { FortniteRecord } from '../types';

export async function collectRedditData(): Promise<FortniteRecord[]> {
  const records: FortniteRecord[] = [];

  try {
    if (!config.reddit.clientId || !config.reddit.clientSecret) {
      console.log('  ⚠️  Reddit credentials not configured');
      return [];
    }

    console.log('  🤖 Fetching Reddit data...');

    const reddit = new Snoowrap({
      userAgent: config.reddit.userAgent,
      clientId: config.reddit.clientId,
      clientSecret: config.reddit.clientSecret,
      refreshToken: '', // Using anonymous/app-only auth
    });

    for (const subreddit of config.reddit.subreddits) {
      try {
        const posts = await reddit
          .getSubreddit(subreddit)
          .getHot({ limit: config.reddit.postsPerSubreddit });

        console.log(`  📱 r/${subreddit}: ${posts.length} posts`);

        for (const post of posts) {
          // Skip stickied posts
          if (post.stickied) continue;

          records.push({
            id: `reddit-${post.id}`,
            source: 'reddit',
            author: post.author?.name || 'unknown',
            title: post.title,
            content: post.selftext || post.title,
            created_at: new Date(post.created_utc * 1000).toISOString(),
            url: `https://reddit.com${post.permalink}`,
            tags: extractRedditTags(post.title, subreddit, post.link_flair_text),
            metadata: {
              subreddit: post.subreddit.display_name,
              score: post.score,
              num_comments: post.num_comments,
              flair: post.link_flair_text,
              is_video: post.is_video,
            },
          });
        }
      } catch (error) {
        console.error(`  ⚠️  Error fetching r/${subreddit}:`, error instanceof Error ? error.message : error);
      }
    }

    console.log(`  ✅ Collected ${records.length} Reddit records`);
  } catch (error) {
    console.error('  ❌ Error collecting Reddit data:', error instanceof Error ? error.message : error);
  }

  return records;
}

function extractRedditTags(title: string, subreddit: string, flair?: string | null): string[] {
  const tags = new Set<string>();

  tags.add('reddit');
  tags.add(subreddit.toLowerCase());

  if (flair) {
    tags.add(flair.toLowerCase().replace(/\s+/g, '-'));
  }

  // Keywords
  const keywords = [
    'leak', 'update', 'patch', 'bug', 'meta', 'competitive',
    'tournament', 'fncs', 'news', 'suggestion', 'concept',
  ];

  const lowerTitle = title.toLowerCase();
  keywords.forEach(keyword => {
    if (lowerTitle.includes(keyword)) {
      tags.add(keyword);
    }
  });

  return Array.from(tags);
}

