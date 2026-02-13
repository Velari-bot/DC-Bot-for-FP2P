/**
 * Data Loader
 * Collects and normalizes data from all sources
 * Now loads from the unified data-ingestion package
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { config } from './config';
import { FortniteDataRecord, DataSource } from './types';

// Resolve paths relative to the monorepo root (fortnite-core/)
// dist files live at packages/ai-assistant/dist, so go up 3 levels
const REPO_ROOT = path.resolve(__dirname, '../../../');
const INGESTION_FILE = path.join(REPO_ROOT, 'data', 'ingestion', 'records.json');
const VIDEOS_INDEX = path.join(REPO_ROOT, 'data', 'videos', 'index.json');
const DOCS_INDEX = path.join(REPO_ROOT, 'data', 'docs', 'index.json');

/**
 * Load tweets from the tweet-tracker database
 */
export async function loadTweets(): Promise<FortniteDataRecord[]> {
  try {
    if (!await fs.pathExists(config.tweetsFile)) {
      console.warn('Tweets file not found, skipping...');
      return [];
    }

    const data = await fs.readJSON(config.tweetsFile);
    const tweets = data.tweets || [];

    console.log(`📱 Loading ${tweets.length} tweets...`);

    return tweets.map((tweet: any) => ({
      id: `tweet-${tweet.tweet_id}`,
      source: 'twitter' as DataSource,
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
        profile_image_url: tweet.profile_image_url,
      },
    }));
  } catch (error) {
    console.error('Error loading tweets:', error);
    return [];
  }
}

/**
 * Load Fortnite API data (placeholder - extend with actual API calls)
 */
export async function loadFortniteData(): Promise<FortniteDataRecord[]> {
  const records: FortniteDataRecord[] = [];

  try {
    // Load tournament schedule
    const schedulePath = `${config.dataDir}/simpsons-season-schedule.txt`;
    if (await fs.pathExists(schedulePath)) {
      const content = await fs.readFile(schedulePath, 'utf-8');
      
      records.push({
        id: `fortnite-schedule-simpsons`,
        source: 'fortnite-api',
        author: 'Fortnite',
        title: 'Simpsons Season Tournament Schedule',
        content,
        created_at: new Date().toISOString(),
        tags: ['tournament', 'schedule', 'simpsons-season', 'competitive'],
      });
    }

    console.log(`🎮 Loaded ${records.length} Fortnite data records`);
  } catch (error) {
    console.error('Error loading Fortnite data:', error);
  }

  return records;
}

/**
 * Parse WebVTT time (e.g., "00:01:23.456") into seconds
 */
function parseVttTimestamp(ts: string): number {
  const match = ts.trim().match(/(?:(\d+):)?(\d{2}):(\d{2})[.,](\d{1,3})?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  const millis = parseInt(match[4] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds + (millis / 1000);
}

/**
 * Load video transcripts and metadata from data/videos/index.json
 * Supports plain text transcripts or WebVTT (.vtt) with timestamps.
 * Expected index.json schema:
 * [
 *   {
 *     "id": "vid-001",
 *     "title": "My Guide",
 *     "url": "https://www.youtube.com/watch?v=... or mp4 URL",
 *     "transcript": "relative/path/to/transcript.vtt or .txt",
 *     "author": "Channel/Author",
 *     "created_at": "2025-01-01T00:00:00Z",
 *     "thumbnail": "https://.../thumb.jpg",
 *     "tags": ["guide","aim"]
 *   }
 * ]
 */
export async function loadVideos(): Promise<FortniteDataRecord[]> {
  try {
    if (!await fs.pathExists(VIDEOS_INDEX)) {
      return [];
    }
    const items = await fs.readJSON(VIDEOS_INDEX);
    if (!Array.isArray(items)) return [];

    const records: FortniteDataRecord[] = [];

    for (const item of items) {
      const id: string = item.id || `video-${(item.url || item.title || '').slice(-8)}`;
      const title: string | undefined = item.title;
      const videoUrl: string | undefined = item.url;
      const transcriptRel: string | undefined = item.transcript;
      const author: string | undefined = item.author;
      const createdAt: string = item.created_at || new Date().toISOString();
      const thumbnailUrl: string | undefined = item.thumbnail;
      const tags: string[] | undefined = item.tags;

      if (!transcriptRel) continue;
      const transcriptPath = path.isAbsolute(transcriptRel)
        ? transcriptRel
        : path.join(REPO_ROOT, 'data', 'videos', transcriptRel);

      let resolvedPath = transcriptPath;
      if (!await fs.pathExists(resolvedPath)) {
        // Try alternate extension if not found (vtt <-> txt)
        const ext = path.extname(transcriptPath).toLowerCase();
        if (ext === '.vtt') {
          const alt = transcriptPath.replace(/\.vtt$/i, '.txt');
          if (await fs.pathExists(alt)) {
            resolvedPath = alt;
          }
        } else if (ext === '.txt') {
          const alt = transcriptPath.replace(/\.txt$/i, '.vtt');
          if (await fs.pathExists(alt)) {
            resolvedPath = alt;
          }
        }
      }

      if (!await fs.pathExists(resolvedPath)) {
        // Only warn if both .vtt and .txt don't exist (transcript truly missing)
        console.warn(`Video transcript not found (tried both .vtt and .txt): ${transcriptPath}`);
        continue;
      }

      if (resolvedPath.toLowerCase().endsWith('.vtt')) {
        // Parse WebVTT
        const raw = await fs.readFile(resolvedPath, 'utf-8');
        const lines = raw.split(/\r?\n/);
        let buffer: string[] = [];
        let start = 0;
        let end = 0;

        const flush = () => {
          const text = buffer.join(' ').trim();
          if (!text) return;
          records.push({
            id: `${id}-${Math.round(start * 1000)}`,
            source: 'video' as DataSource,
            author,
            title,
            content: text,
            created_at: createdAt,
            url: videoUrl,
            tags,
            metadata: {
              videoUrl,
              videoStart: start,
              videoEnd: end,
              thumbnailUrl,
              indexId: id,
            },
          });
          buffer = [];
        };

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          // Timecode line like "00:00:12.000 --> 00:00:15.000"
          const timeMatch = line.match(/(\d{2}:\d{2}:\d{2}[.,]\d{1,3})\s+-->\s+(\d{2}:\d{2}:\d{2}[.,]\d{1,3})/);
          if (timeMatch) {
            // Flush previous cue
            if (buffer.length) flush();
            start = parseVttTimestamp(timeMatch[1]);
            end = parseVttTimestamp(timeMatch[2]);
            continue;
          }
          // Skip header and cue numbers
          if (/^WEBVTT/i.test(line) || /^\s*\d+\s*$/.test(line)) continue;
          if (line.trim() === '') continue;
          buffer.push(line.trim());
        }
        // Flush last cue
        if (buffer.length) flush();
      } else {
        // Plain text transcript -> chunk
        const text = await fs.readFile(resolvedPath, 'utf-8');
        const chunks = chunkText(text, 800, 100);
        chunks.forEach((chunk, idx) => {
          records.push({
            id: `${id}-chunk-${idx}`,
            source: 'video' as DataSource,
            author,
            title,
            content: chunk,
            created_at: createdAt,
            url: videoUrl,
            tags,
            metadata: {
              videoUrl,
              thumbnailUrl,
              indexId: id,
            },
          });
        });
      }
    }

    console.log(`🎬 Loaded ${records.length} video transcript chunks from ${items.length} videos`);
    return records;
  } catch (error) {
    console.error('Error loading videos:', error);
    return [];
  }
}

/**
 * Load from unified data ingestion (preferred method)
 */
export async function loadFromIngestion(): Promise<FortniteDataRecord[]> {
  try {
    if (!await fs.pathExists(INGESTION_FILE)) {
      console.warn('  ⚠️  Ingestion data not found, using fallback...');
      return loadAllDataLegacy();
    }

    const store = await fs.readJSON(INGESTION_FILE);
    const records = store.records || [];

    console.log(`✅ Loaded ${records.length} records from unified ingestion`);
    console.log(`   Sources: Twitter, Epic CMS, Fortnite-API, Reddit, News`);

    return records;
  } catch (error) {
    console.error('Error loading from ingestion:', error);
    return loadAllDataLegacy();
  }
}

/**
 * Load all data from all sources (legacy method)
 */
export async function loadAllDataLegacy(): Promise<FortniteDataRecord[]> {
  console.log('📊 Loading data from legacy sources...');

  const [tweets, fortniteData] = await Promise.all([
    loadTweets(),
    loadFortniteData(),
  ]);

  const allData = [
    ...tweets,
    ...fortniteData,
  ];

  console.log(`✅ Loaded ${allData.length} total records`);
  console.log(`   - Tweets: ${tweets.length}`);
  console.log(`   - Fortnite Data: ${fortniteData.length}`);

  return allData;
}

/**
 * Load text documents from data/docs/index.json
 * Similar structure to videos but for plain text content
 */
export async function loadDocs(): Promise<FortniteDataRecord[]> {
  try {
    if (!await fs.pathExists(DOCS_INDEX)) {
      return [];
    }
    const items = await fs.readJSON(DOCS_INDEX);
    if (!Array.isArray(items)) return [];

    const records: FortniteDataRecord[] = [];

    for (const item of items) {
      const id: string = item.id || `doc-${(item.title || '').slice(0, 8)}`;
      const title: string | undefined = item.title;
      const contentRel: string | undefined = item.content;
      const author: string | undefined = item.author;
      const createdAt: string = item.created_at || new Date().toISOString();
      const tags: string[] | undefined = item.tags;
      const url: string | undefined = item.url;

      if (!contentRel) continue;
      const contentPath = path.isAbsolute(contentRel)
        ? contentRel
        : path.join(REPO_ROOT, 'data', 'docs', contentRel);

      if (!await fs.pathExists(contentPath)) {
        console.warn(`Document file not found: ${contentPath}`);
        continue;
      }

      const text = await fs.readFile(contentPath, 'utf-8');
      const chunks = chunkText(text, 800, 100);
      chunks.forEach((chunk, idx) => {
        records.push({
          id: `${id}-chunk-${idx}`,
          source: 'doc' as DataSource,
          author,
          title,
          content: chunk,
          created_at: createdAt,
          url,
          tags,
          metadata: {
            indexId: id,
            chunkIndex: idx,
          },
        });
      });
    }

    console.log(`📄 Loaded ${records.length} document chunks from ${items.length} documents`);
    return records;
  } catch (error) {
    console.error('Error loading documents:', error);
    return [];
  }
}

/**
 * Load all data - automatically uses ingestion if available
 */
export async function loadAllData(): Promise<FortniteDataRecord[]> {
  // Prefer unified ingestion, but merge in videos, docs, and tweets if available
  // Always load tweets directly to ensure they're included even if not in ingestion
  const [ingested, videos, docs, tweets] = await Promise.all([
    loadFromIngestion(),
    loadVideos(),
    loadDocs(),
    loadTweets(),
  ]);
  
  // Merge all sources, removing duplicates by ID
  const allRecords = [...ingested, ...videos, ...docs, ...tweets];
  const uniqueRecords = new Map<string, FortniteDataRecord>();
  
  for (const record of allRecords) {
    if (!uniqueRecords.has(record.id)) {
      uniqueRecords.set(record.id, record);
    }
  }
  
  const finalRecords = Array.from(uniqueRecords.values());
  console.log(`✅ Loaded ${finalRecords.length} total records (${ingested.length} ingested + ${videos.length} videos + ${docs.length} docs + ${tweets.length} tweets)`);
  
  return finalRecords;
}

/**
 * Extract hashtags and keywords from text
 */
function extractTags(text: string): string[] {
  const tags = new Set<string>();

  // Extract hashtags
  const hashtags = text.match(/#\w+/g) || [];
  hashtags.forEach(tag => tags.add(tag.toLowerCase()));

  // Extract common Fortnite keywords
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

/**
 * Split text into chunks for embedding
 */
export function chunkText(text: string, chunkSize: number = 500, overlap: number = 50): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end);
    chunks.push(chunk);
    start += chunkSize - overlap;
  }

  return chunks;
}

