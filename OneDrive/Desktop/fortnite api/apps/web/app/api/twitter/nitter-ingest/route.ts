import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
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
  sanitizeUrl,
  ProcessedTweet,
  FilterOptions,
} from '@/lib/twitter-ingestion';

/**
 * Nitter-based Twitter ingestion (FREE alternative to Apify)
 * Uses public Nitter instances to scrape tweets without API costs
 */

const TARGET_USERS = ['KinchAnalytics', 'osirion_gg'];
const NITTER_INSTANCES = [
  'https://nitter.net',
  'https://nitter.it',
  'https://nitter.pussthecat.org',
];

interface NitterTweet {
  id: string;
  text: string;
  createdAt: string;
  username: string;
  url: string;
}

async function scrapeNitterUser(instance: string, username: string): Promise<NitterTweet[]> {
  // Check rate limit
  const rateLimitCheck = await checkRateLimit(`nitter-${instance}`);
  if (!rateLimitCheck.allowed) {
    throw new Error(`Rate limit exceeded. Please wait ${Math.ceil((rateLimitCheck.waitMs || 0) / 1000)} seconds.`);
  }

  return await retryWithBackoff(async () => {
    const url = `${instance}/${username}/rss`;
    const sanitizedUrl = sanitizeUrl(url);
    if (!sanitizedUrl) {
      throw new Error('Invalid URL');
    }

    console.log(`[NITTER] Fetching RSS from ${sanitizedUrl}`);
    
    const response = await fetch(sanitizedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
      // Add timeout
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      console.error(`[NITTER] HTTP error ${response.status} from ${instance}`);
      throw new Error(`Nitter RSS failed: ${response.status}`);
    }

    const xml = await response.text();
    console.log(`[NITTER] Received ${xml.length} bytes from ${instance}`);
    
    if (xml.length < 100) {
      console.error(`[NITTER] Response too short, likely error page`);
      throw new Error('Response too short');
    }

    const tweets = parseRssFeed(xml, username, instance);
    console.log(`[NITTER] Parsed ${tweets.length} tweets from ${instance}`);
    return tweets;
  }, 3, 1000);
}

function parseRssFeed(xml: string, username: string, instance: string): NitterTweet[] {
  const tweets: NitterTweet[] = [];
  
  // Try different RSS formats - Nitter can vary
  // Format 1: <link><![[CDATA[...]]]></link>
  // Format 2: <link>...</link>
  // Format 3: <guid>...</guid>
  
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  
  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    
    // Try CDATA link first, then regular link, then guid
    let linkMatch = item.match(/<link><!\[CDATA\[(.*?)\]\]><\/link>/);
    if (!linkMatch) {
      linkMatch = item.match(/<link>(.*?)<\/link>/);
    }
    if (!linkMatch) {
      linkMatch = item.match(/<guid>(.*?)<\/guid>/);
    }
    
    // Try CDATA title first, then regular title
    let titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
    if (!titleMatch) {
      titleMatch = item.match(/<title>(.*?)<\/title>/);
    }
    
    let pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
    if (!pubDateMatch) {
      pubDateMatch = item.match(/<dc:date>(.*?)<\/dc:date>/);
    }
    
    if (linkMatch && titleMatch) {
      const url = linkMatch[1].trim();
      const idMatch = url.match(/status\/(\d+)/);
      const id = idMatch ? idMatch[1] : '';
      
      // Extract tweet text (remove "User: " prefix if present)
      let text = titleMatch[1].trim();
      
      // Remove HTML entities
      text = text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ');
      
      // Remove "Username: " prefix if present
      const colonIndex = text.indexOf(': ');
      if (colonIndex > 0 && colonIndex < 20) {
        text = text.substring(colonIndex + 2);
      }
      
      // Remove "RT @" prefix if present (retweets)
      if (text.toLowerCase().startsWith('rt @')) {
        const rtEnd = text.indexOf(': ');
        if (rtEnd > 0) {
          text = text.substring(rtEnd + 2);
        }
      }
      
      const pubDate = pubDateMatch ? new Date(pubDateMatch[1].trim()).toISOString() : new Date().toISOString();
      
      if (id && text && text.length > 0) {
        tweets.push({
          id,
          text,
          createdAt: pubDate,
          username,
          url,
        });
      }
    }
  }
  
  console.log(`[NITTER] Parsed ${tweets.length} tweets from RSS feed`);
  return tweets;
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
    console.error(`[NITTER] Error getting lastTweetId for ${username}:`, error.message);
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
    console.error(`[NITTER] Error updating lastTweetId for ${username}:`, error.message);
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
      console.error(`[NITTER] Failed to ingest tweet for ${username}:`, response.status, errorText);
      return false;
    }

    return true;
  } catch (error: any) {
    console.error(`[NITTER] Exception ingesting tweet for ${username}:`, error.message);
    return false;
  }
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

    console.log(`[NITTER] Starting free Twitter ingestion for users: ${TARGET_USERS.join(', ')}`);

    const results: Record<string, { processed: number; errors: number; filtered: number }> = {};
    const allProcessedTweets: ProcessedTweet[] = [];

    for (const username of TARGET_USERS) {
      let processed = 0;
      let errors = 0;
      let filtered = 0;

      try {
        const lastTweetId = await getLastTweetId(username);
        console.log(`[NITTER] Last tweet ID for ${username}: ${lastTweetId || 'none'}`);

        // Try each Nitter instance until one works
        let tweets: NitterTweet[] = [];
        let lastError = '';
        
        for (const instance of NITTER_INSTANCES) {
          try {
            tweets = await scrapeNitterUser(instance, username);
            if (tweets.length > 0) {
              console.log(`[NITTER] Successfully fetched ${tweets.length} tweets from ${instance}`);
              break;
            } else {
              console.warn(`[NITTER] No tweets parsed from ${instance} - trying next instance`);
            }
          } catch (error: any) {
            lastError = error.message;
            console.warn(`[NITTER] Instance ${instance} failed: ${error.message}`);
            continue;
          }
        }
        
        if (tweets.length === 0 && lastError) {
          console.error(`[NITTER] All instances failed. Last error: ${lastError}`);
        }

        if (tweets.length === 0) {
          console.warn(`[NITTER] No tweets found for ${username} from any instance`);
          results[username] = { processed: 0, errors: 0, filtered: 0 };
          continue;
        }

        // Convert to ProcessedTweet format
        const processedTweets: ProcessedTweet[] = tweets.map(t => ({
          id: t.id,
          text: t.text,
          createdAt: t.createdAt,
          username: normalizeUsername(t.username),
          url: t.url,
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
        allProcessedTweets.push(...safe);

        // Sort by date (newest first)
        const sortedTweets = safe.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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

        results[username] = { processed, errors, filtered };
        console.log(`[NITTER] Completed ${username}: ${processed} processed, ${errors} errors, ${filtered} filtered`);
      } catch (error: any) {
        console.error(`[NITTER] Error processing ${username}:`, error.message);
        const errorInfo = classifyError(error);
        results[username] = { processed: 0, errors: 1, filtered: 0 };
      }
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
      'nitter'
    );

    return NextResponse.json({
      success: true,
      ...formattedResult,
      results,
      note: 'Free alternative using Nitter RSS feeds - no API costs!',
    });
  } catch (error: any) {
    console.error('[NITTER] Ingestion failed:', error);
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
      { error: 'Ingestion failed', message: error.message },
      { status: 500 }
    );
  }
}

