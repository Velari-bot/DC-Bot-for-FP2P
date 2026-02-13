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
  ProcessedTweet,
  FilterOptions,
} from '@/lib/twitter-ingestion';

const TARGET_USERS = ['KinchAnalytics', 'osirion_gg'];
const TWITTER_API_BASE = 'https://api.twitter.com/2';

// Known user IDs (to avoid API lookups when rate-limited)
// These can be found by looking up the users once when not rate-limited
const KNOWN_USER_IDS: Record<string, string> = {
  // Add user IDs here if known, or they'll be cached after first successful lookup
};

interface TwitterTweet {
  id: string;
  text: string;
  created_at: string;
  author_id?: string;
  public_metrics?: {
    retweet_count: number;
    like_count: number;
    reply_count: number;
  };
}

interface TwitterUser {
  id: string;
  username: string;
  name: string;
}

interface TwitterAPIResponse {
  data?: TwitterTweet[];
  includes?: {
    users?: TwitterUser[];
  };
  meta?: {
    result_count: number;
    next_token?: string;
  };
  errors?: Array<{ message: string }>;
}

async function getCachedUserIds(): Promise<Record<string, string>> {
  // First check known hardcoded IDs
  if (Object.keys(KNOWN_USER_IDS).length > 0) {
    const allKnown = TARGET_USERS.every(u => KNOWN_USER_IDS[u.toLowerCase()]);
    if (allKnown) {
      console.log(`[TWITTER V2] Using known hardcoded user IDs`);
      return KNOWN_USER_IDS;
    }
  }

  // Then try Firestore cache
  try {
    const docRef = db.collection('twitter_user_ids').doc('cached');
    const doc = await docRef.get();
    
    if (doc.exists) {
      const data = doc.data();
      const cachedIds = { ...KNOWN_USER_IDS, ...(data?.userIds || {}) };
      const cachedAt = data?.cachedAt?.toDate?.() || new Date(0);
      
      // Cache is valid for 24 hours
      const cacheAge = Date.now() - cachedAt.getTime();
      const cacheValid = cacheAge < 24 * 60 * 60 * 1000; // 24 hours
      
      if (cacheValid && Object.keys(cachedIds).length > 0) {
        console.log(`[TWITTER V2] Using cached user IDs (age: ${Math.round(cacheAge / 1000 / 60)} minutes)`);
        return cachedIds;
      }
    }
  } catch (error: any) {
    console.warn(`[TWITTER V2] Error reading cached user IDs: ${error.message}`);
  }
  
  // Return known IDs even if incomplete (better than nothing)
  return KNOWN_USER_IDS;
}

async function cacheUserIds(userIdMap: Record<string, string>): Promise<void> {
  try {
    const docRef = db.collection('twitter_user_ids').doc('cached');
    await docRef.set({
      userIds: userIdMap,
      cachedAt: new Date(),
    }, { merge: true });
    console.log(`[TWITTER V2] Cached user IDs for future use`);
  } catch (error: any) {
    console.warn(`[TWITTER V2] Error caching user IDs: ${error.message}`);
  }
}

async function getUserIds(bearerToken: string, usernames: string[]): Promise<Record<string, string>> {
  // Try to get from cache first
  const cached = await getCachedUserIds();
  
  // Check if we have all needed user IDs in cache
  const allCached = usernames.every(u => cached[u.toLowerCase()]);
  if (allCached) {
    return cached;
  }

  // Fetch missing user IDs from Twitter API
  const usernameParam = usernames.join(',');
  const url = `${TWITTER_API_BASE}/users/by?usernames=${usernameParam}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${bearerToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 429) {
      // If rate limited but we have cached IDs, use those
      if (Object.keys(cached).length > 0) {
        console.warn(`[TWITTER V2] Rate limited on user lookup, using cached IDs`);
        return cached;
      }
      throw new Error(`Twitter API rate limit exceeded (429) on user lookup. Please wait 15 minutes before trying again.`);
    }
    throw new Error(`Failed to get user IDs: ${response.status} - ${errorText}`);
  }

  const data = await response.json() as { data?: TwitterUser[]; errors?: Array<{ message: string }> };
  
  if (data.errors) {
    // If we have cached IDs, use those instead
    if (Object.keys(cached).length > 0) {
      console.warn(`[TWITTER V2] Error fetching user IDs, using cached IDs`);
      return cached;
    }
    throw new Error(`Twitter API errors: ${JSON.stringify(data.errors)}`);
  }

  const userIdMap: Record<string, string> = { ...cached }; // Start with cached
  if (data.data) {
    for (const user of data.data) {
      userIdMap[user.username.toLowerCase()] = user.id;
    }
  }

  // Cache the updated map
  await cacheUserIds(userIdMap);

  return userIdMap;
}

async function fetchUserTweets(bearerToken: string, userId: string, username: string, maxResults: number = 10): Promise<TwitterTweet[]> {
  // Check rate limit
  const rateLimitCheck = await checkRateLimit('twitter-api-v2');
  if (!rateLimitCheck.allowed) {
    throw new Error(`Rate limit exceeded. Please wait ${Math.ceil((rateLimitCheck.waitMs || 0) / 1000)} seconds.`);
  }

  return await retryWithBackoff(async () => {
    // Exclude retweets and replies using query parameters - only get original posts
    const url = `${TWITTER_API_BASE}/users/${userId}/tweets?max_results=${maxResults}&tweet.fields=created_at,author_id,public_metrics,referenced_tweets&exclude=retweets,replies`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 429) {
        throw new Error(`Twitter API rate limit exceeded (429). Please wait before trying again. Free tier limits: 100 tweets/month.`);
      }
      throw new Error(`Failed to fetch tweets for ${username}: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as TwitterAPIResponse;
    
    if (data.errors) {
      throw new Error(`Twitter API errors: ${JSON.stringify(data.errors)}`);
    }

    return data.data || [];
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
    console.error(`[TWITTER V2] Error getting lastTweetId for ${username}:`, error.message);
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
    console.error(`[TWITTER V2] Error updating lastTweetId for ${username}:`, error.message);
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
      console.error(`[TWITTER V2] Failed to ingest tweet for ${username}:`, response.status, errorText);
      return false;
    }

    return true;
  } catch (error: any) {
    console.error(`[TWITTER V2] Exception ingesting tweet for ${username}:`, error.message);
    return false;
  }
}

async function processUserTweets(username: string, tweets: TwitterTweet[]): Promise<{ processed: number; errors: number; filtered: number }> {
  let processed = 0;
  let errors = 0;
  let filtered = 0;

  try {
    const lastTweetId = await getLastTweetId(username);
    console.log(`[TWITTER V2] Last tweet ID for ${username}: ${lastTweetId || 'none (processing all)'}`);

    // Convert to ProcessedTweet format
    const processedTweets: ProcessedTweet[] = tweets.map(t => ({
      id: t.id,
      text: t.text,
      createdAt: t.created_at,
      username: normalizeUsername(username),
      engagement: t.public_metrics ? {
        likes: t.public_metrics.like_count,
        retweets: t.public_metrics.retweet_count,
        replies: t.public_metrics.reply_count,
      } : undefined,
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

    // Sort by date (newest first) - Twitter API already returns newest first
    let newestTweetId: string | null = null;

    for (const tweet of safe) {
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

    console.log(`[TWITTER V2] Completed ${username}: ${processed} processed, ${errors} errors, ${filtered} filtered`);
  } catch (error: any) {
    console.error(`[TWITTER V2] Exception processing tweets for ${username}:`, error.message);
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

    const bearerToken = process.env.TWITTER_BEARER_TOKEN;
    if (!bearerToken) {
      return NextResponse.json(
        { error: 'TWITTER_BEARER_TOKEN not configured' },
        { status: 500 }
      );
    }

    console.log(`[TWITTER V2] Starting ingestion for users: ${TARGET_USERS.join(', ')}`);

    // Get user IDs
    const userIdMap = await getUserIds(bearerToken, TARGET_USERS);
    console.log(`[TWITTER V2] Resolved user IDs:`, userIdMap);

    const results: Record<string, { processed: number; errors: number; filtered: number }> = {};
    const allProcessedTweets: ProcessedTweet[] = [];
    let totalTweetsFetched = 0;

    for (const username of TARGET_USERS) {
      const userId = userIdMap[username.toLowerCase()];
      if (!userId) {
        console.warn(`[TWITTER V2] User ID not found for ${username}`);
        results[username] = { processed: 0, errors: 0, filtered: 0 };
        continue;
      }

      try {
        // Fetch up to 10 tweets per user (stays well under 100/month limit)
        const tweets = await fetchUserTweets(bearerToken, userId, username, 10);
        totalTweetsFetched += tweets.length;
        console.log(`[TWITTER V2] Fetched ${tweets.length} tweets for ${username}`);

        const result = await processUserTweets(username, tweets);
        results[username] = result;

        // Collect processed tweets for final formatting
        const processedTweets: ProcessedTweet[] = tweets.map(t => ({
          id: t.id,
          text: t.text,
          createdAt: t.created_at,
          username: normalizeUsername(username),
          engagement: t.public_metrics ? {
            likes: t.public_metrics.like_count,
            retweets: t.public_metrics.retweet_count,
            replies: t.public_metrics.reply_count,
          } : undefined,
        }));
        allProcessedTweets.push(...processedTweets);
      } catch (error: any) {
        console.error(`[TWITTER V2] Error processing ${username}:`, error.message);
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
      'twitter-api-v2'
    );

    return NextResponse.json({
      success: true,
      ...formattedResult,
      results,
      note: 'Using official Twitter API v2 - respects rate limits',
    });
  } catch (error: any) {
    console.error('[TWITTER V2] Ingestion worker failed:', error);
    
    const errorInfo = classifyError(error);
    
    // Handle rate limit errors specially
    if (errorInfo.type === 'rate_limit') {
      return NextResponse.json(
        { 
          error: 'Twitter API rate limit exceeded',
          message: errorInfo.message,
          note: 'The Twitter API free tier has a 100 tweets/month limit. Please wait before trying again, or check your Twitter API usage at https://developer.twitter.com/en/portal/dashboard',
          statusCode: 429
        },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Ingestion failed', 
        message: error.message,
        note: 'Make sure TWITTER_BEARER_TOKEN is set in .env.local',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}

