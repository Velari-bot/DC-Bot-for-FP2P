import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import {
  checkRateLimit,
  validateInput,
  normalizeUsername,
  processTweetsForIngestion,
  formatIngestionResult,
  retryWithBackoff,
  classifyError,
  cleanTweetText,
  stripUsernames,
  ProcessedTweet,
  FilterOptions,
} from '@/lib/twitter-ingestion';

const execAsync = promisify(exec);

const TARGET_USERS = ['KinchAnalytics', 'osirion_gg'];
// Script path relative to Next.js app root (apps/web)
const PYTHON_SCRAPER_SCRIPT = join(process.cwd(), 'scripts', 'simple_scraper.py');

interface ScrapedTweet {
  id: string;
  text: string;
  createdAt: string;
  username: string;
  url: string;
  isRetweet: boolean;
  isReply: boolean;
}

async function runPythonScraper(): Promise<Record<string, ScrapedTweet[]>> {
  // Check rate limit before scraping
  const rateLimitCheck = await checkRateLimit('python-scraper');
  if (!rateLimitCheck.allowed) {
    throw new Error(`Rate limit exceeded. Please wait ${Math.ceil((rateLimitCheck.waitMs || 0) / 1000)} seconds.`);
  }

  return await retryWithBackoff(async () => {
    // Try Python 3 first, then python
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    
    const { stdout, stderr } = await execAsync(
      `${pythonCmd} "${PYTHON_SCRAPER_SCRIPT}"`,
      { maxBuffer: 10 * 1024 * 1024 } // 10MB buffer
    );

    if (stderr) {
      console.warn('[SCRAPER] Python stderr:', stderr);
    }

    const result = JSON.parse(stdout.trim());
    
    if (!result.success) {
      throw new Error(result.error || 'Scraper failed');
    }

    return result.tweets || {};
  }, 3, 1000);
}

async function getLastTweetId(username: string): Promise<string | null> {
  try {
    const docRef = db.collection('twitter_last_tweet').doc(username.toLowerCase());
    const doc = await docRef.get();
    if (doc.exists) {
      return doc.data()?.lastTweetId || null;
    }
    return null;
  } catch (error: any) {
    console.error(`[SCRAPER] Error getting lastTweetId for ${username}:`, error.message);
    return null;
  }
}

async function updateLastTweetId(username: string, tweetId: string): Promise<void> {
  try {
    const docRef = db.collection('twitter_last_tweet').doc(username.toLowerCase());
    await docRef.set({
      lastTweetId: tweetId,
      updatedAt: new Date(),
    }, { merge: true });
  } catch (error: any) {
    console.error(`[SCRAPER] Error updating lastTweetId for ${username}:`, error.message);
    throw error;
  }
}

async function ingestTweet(username: string, tweetText: string): Promise<boolean> {
  try {
    // Strip usernames before saving (privacy protection)
    const cleanedText = stripUsernames(tweetText);
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    
    const response = await fetch(`${baseUrl}/api/memory/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'twitter',
        author: username,
        content: cleanedText,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[SCRAPER] Failed to ingest tweet for ${username}:`, response.status, errorText);
      return false;
    }

    return true;
  } catch (error: any) {
    console.error(`[SCRAPER] Exception ingesting tweet for ${username}:`, error.message);
    return false;
  }
}

async function processTweets(username: string, tweets: ScrapedTweet[]): Promise<{ processed: number; errors: number; filtered: number }> {
  let processed = 0;
  let errors = 0;
  let filtered = 0;

  try {
    const lastTweetId = await getLastTweetId(username);
    console.log(`[SCRAPER] Last tweet ID for ${username}: ${lastTweetId || 'none (processing all)'}`);

    // Convert to ProcessedTweet format
    const processedTweets: ProcessedTweet[] = tweets.map(t => ({
      id: t.id,
      text: t.text,
      createdAt: t.createdAt,
      username: normalizeUsername(t.username),
      url: t.url,
      isRetweet: t.isRetweet,
      isReply: t.isReply,
    }));

    // Apply comprehensive filtering and safety checks
    const filterOptions: FilterOptions = {
      removeRetweets: true,
      removeReplies: true,
      removePromoted: true,
      removeDuplicates: true,
    };

    const { safe, rejected } = await processTweetsForIngestion(processedTweets, filterOptions);
    filtered = rejected.length;

    // Sort by date (newest first)
    const sortedTweets = safe.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return timeB - timeA;
    });

    let newestTweetId: string | null = null;

    for (const tweet of sortedTweets) {
      if (newestTweetId === null) {
        newestTweetId = tweet.id;
      }

      // Stop if we've reached the last processed tweet
      if (lastTweetId && tweet.id === lastTweetId) {
        break;
      }

      const success = await ingestTweet(username, tweet.text);
      if (success) {
        processed++;
      } else {
        errors++;
      }
    }

    if (newestTweetId) {
      await updateLastTweetId(username, newestTweetId);
    }

    console.log(`[SCRAPER] Completed ${username}: ${processed} processed, ${errors} errors, ${filtered} filtered`);
  } catch (error: any) {
    console.error(`[SCRAPER] Exception processing tweets for ${username}:`, error.message);
    errors++;
  }

  return { processed, errors, filtered };
}

export async function GET(req: NextRequest) {
  try {
    // Validate input
    const searchParams = req.nextUrl.searchParams;
    const input = {
      handle: searchParams.get('handle') || undefined,
      username: searchParams.get('username') || undefined,
    };

    if (input.handle || input.username) {
      const validation = validateInput(input);
      if (!validation.valid) {
        return NextResponse.json(
          { error: 'Invalid input', message: validation.error },
          { status: 400 }
        );
      }
    }

    console.log(`[SCRAPER] Starting self-hosted Twitter scraping for users: ${TARGET_USERS.join(', ')}`);

    const scrapedTweets = await runPythonScraper();
    console.log(`[SCRAPER] Scraped tweets:`, Object.keys(scrapedTweets).map(u => `${u}: ${scrapedTweets[u].length}`).join(', '));

    const results: Record<string, { processed: number; errors: number; filtered: number }> = {};
    const allProcessedTweets: ProcessedTweet[] = [];

    for (const username of TARGET_USERS) {
      const tweets = scrapedTweets[username] || [];
      const result = await processTweets(username, tweets);
      results[username] = result;

      // Collect all processed tweets for final formatting
      const processedTweets: ProcessedTweet[] = tweets.map(t => ({
        id: t.id,
        text: t.text,
        createdAt: t.createdAt,
        username: normalizeUsername(t.username),
        url: t.url,
        isRetweet: t.isRetweet,
        isReply: t.isReply,
      }));
      allProcessedTweets.push(...processedTweets);
    }

    const totalProcessed = Object.values(results).reduce((sum, r) => sum + r.processed, 0);
    const totalErrors = Object.values(results).reduce((sum, r) => sum + r.errors, 0);
    const totalFiltered = Object.values(results).reduce((sum, r) => sum + r.filtered, 0);

    // Format final result with comprehensive metadata
    const formattedResult = formatIngestionResult(
      allProcessedTweets,
      totalProcessed,
      totalErrors,
      totalFiltered,
      'self-hosted-python'
    );

    return NextResponse.json({
      success: true,
      ...formattedResult,
      results,
    });
  } catch (error: any) {
    console.error('[SCRAPER] Scraping worker failed:', error);
    
    const errorInfo = classifyError(error);
    
    if (errorInfo.type === 'rate_limit') {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: errorInfo.message,
          statusCode: 429,
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Scraping failed', 
        message: error.message,
        note: 'Make sure Python scraper is installed. See scripts/README.md for setup instructions.',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}

