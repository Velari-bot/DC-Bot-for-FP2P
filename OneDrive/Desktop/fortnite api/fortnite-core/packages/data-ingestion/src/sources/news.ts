/**
 * News RSS Feed Data Source
 * Fetches from Fortnite news sites
 */

import Parser from 'rss-parser';
import { config } from '../config';
import { FortniteRecord } from '../types';
import { v4 as uuidv4 } from 'uuid';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; FortniteBot/1.0)',
  },
});

export async function collectNewsData(): Promise<FortniteRecord[]> {
  const records: FortniteRecord[] = [];

  try {
    console.log('  📰 Fetching RSS feeds...');

    for (const feed of config.news.feeds) {
      try {
        console.log(`  📡 ${feed.name}...`);

        const rssFeed = await parser.parseURL(feed.url);
        const items = rssFeed.items.slice(0, config.news.itemsPerFeed);

        for (const item of items) {
          const content = item.contentSnippet || item.content || item.summary || item.title || '';
          
          records.push({
            id: `news-${feed.name.toLowerCase().replace(/\s+/g, '-')}-${item.guid || uuidv4()}`,
            source: 'news',
            author: feed.name,
            title: item.title || 'News Article',
            content: cleanContent(content),
            created_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
            url: item.link,
            tags: extractNewsTags(item.title || '', item.categories || []),
            metadata: {
              feedName: feed.name,
              categories: item.categories,
              creator: item.creator,
            },
          });
        }

        console.log(`  ✅ ${feed.name}: ${items.length} items`);
      } catch (error) {
        console.error(`  ⚠️  Error fetching ${feed.name}:`, error instanceof Error ? error.message : error);
      }
    }

    console.log(`  ✅ Total news records: ${records.length}`);
  } catch (error) {
    console.error('  ❌ Error collecting news data:', error instanceof Error ? error.message : error);
  }

  return records;
}

function cleanContent(content: string): string {
  // Remove HTML tags
  let clean = content.replace(/<[^>]*>/g, '');
  
  // Decode HTML entities
  clean = clean
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
  
  // Trim and normalize whitespace
  clean = clean.replace(/\s+/g, ' ').trim();
  
  // Limit length
  return clean.substring(0, 2000);
}

function extractNewsTags(title: string, categories: string[] = []): string[] {
  const tags = new Set<string>();

  tags.add('news');

  // Add categories
  categories.forEach(cat => {
    tags.add(cat.toLowerCase().replace(/\s+/g, '-'));
  });

  // Keywords
  const keywords = [
    'leak', 'update', 'patch', 'season', 'chapter', 'event',
    'skin', 'cosmetic', 'weapon', 'map', 'poi', 'ltm',
    'tournament', 'competitive', 'fncs',
  ];

  const lowerTitle = title.toLowerCase();
  keywords.forEach(keyword => {
    if (lowerTitle.includes(keyword)) {
      tags.add(keyword);
    }
  });

  return Array.from(tags);
}

