import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

const TARGET_USERS = ['KinchAnalytics', 'osirion_gg'];
const APIFY_ACTOR_ID = 'apidojo/tweet-scraper';
const APIFY_API_BASE = 'https://api.apify.com/v2';

interface ApifyTweet {
  id: string;
  text: string;
  createdAt: string;
  username?: string;
  url?: string;
  isRetweet?: boolean;
  isReply?: boolean;
}

interface ApifyRunResponse {
  data: {
    id: string;
    status: string;
    defaultDatasetId?: string;
  };
}

interface ApifyRunStatusResponse {
  data: {
    status: string;
    defaultDatasetId?: string;
  };
}


async function pollRunStatus(apiToken: string, runId: string, maxAttempts: number = 30): Promise<string> {
  const actorIdEncoded = encodeURIComponent(APIFY_ACTOR_ID);
  const statusUrl = `${APIFY_API_BASE}/acts/${actorIdEncoded}/runs/${runId}?token=${apiToken}`;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const response = await fetch(statusUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to check run status: ${response.status}`);
    }

    const statusData = await response.json() as ApifyRunStatusResponse;
    const status = statusData.data.status;
    
    if (status === 'SUCCEEDED') {
      console.log(`[TWITTER] Apify run completed successfully`);
      return statusData.data.defaultDatasetId || '';
    }
    
    if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
      throw new Error(`Apify run ${status.toLowerCase()}`);
    }
  }

  throw new Error('Apify run timeout');
}

async function fetchDataset(apiToken: string, datasetId: string): Promise<ApifyTweet[]> {
  const datasetUrl = `${APIFY_API_BASE}/datasets/${datasetId}/items?token=${apiToken}&format=json&clean=true`;
  
  const response = await fetch(datasetUrl);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[TWITTER] Failed to fetch dataset: ${response.status} - ${errorText}`);
    throw new Error(`Failed to fetch dataset: ${response.status}`);
  }

  const tweets = await response.json() as any[];
  
  console.log(`[TWITTER] Raw dataset items: ${tweets.length}`);
  if (tweets.length > 0) {
    console.log(`[TWITTER] Sample tweet structure:`, JSON.stringify(tweets[0], null, 2).substring(0, 1000));
  }
  
  const demoCount = tweets.filter((t: any) => t.demo).length;
  if (demoCount > 0 || (tweets.length > 0 && tweets.every((t: any) => t.demo))) {
    console.error(`[TWITTER] ERROR: Actor returned demo items only`);
    console.error(`[TWITTER] Free plan users CANNOT use actor via API - only manual runs work`);
    console.error(`[TWITTER] Manual runs work (max 10 items) but API calls are blocked on free plan`);
    console.error(`[TWITTER] Upgrade required: https://apify.com/pricing`);
    throw new Error('Apify free plan cannot use actor via API. Upgrade to paid plan or use manual runs only.');
  }
  
  const parsedTweets = tweets
    .filter((tweet: any) => !tweet.demo && tweet.type === 'tweet')
    .map((tweet: any) => {
    
    const url = tweet.url || tweet.twitterUrl || '';
    const idMatch = url.match(/status\/(\d+)/);
    const id = tweet.id || idMatch?.[1] || '';
    
    if (!id) {
      return null;
    }
    
    const text = tweet.text || tweet.full_text || tweet.fullText || '';
    const createdAt = tweet.createdAt || tweet.created_at || new Date().toISOString();
    
    const usernameMatch = url.match(/(?:twitter\.com|x\.com)\/([^\/]+)/);
    const username = tweet.author?.userName || tweet.username || tweet.userName || usernameMatch?.[1] || '';
    
    const isRetweet = tweet.isRetweet || tweet.is_retweet || tweet.type === 'retweet' || (text && text.toLowerCase().startsWith('rt @')) || false;
    const isReply = tweet.isReply || tweet.is_reply || tweet.type === 'reply' || false;
    
    return {
      id,
      text,
      createdAt,
      username,
      url,
      isRetweet,
      isReply,
    };
    })
    .filter((tweet): tweet is NonNullable<typeof tweet> => 
      tweet !== null && tweet.id && tweet.text && tweet.username && tweet.url !== undefined);
  
  console.log(`[TWITTER] Parsed ${parsedTweets.length} valid tweets from ${tweets.length} items`);
  
  return parsedTweets;
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
    console.error(`[TWITTER] Error getting lastTweetId for ${username}:`, error.message);
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
    console.error(`[TWITTER] Error updating lastTweetId for ${username}:`, error.message);
    throw error;
  }
}

function isMeaningfulTweet(tweet: ApifyTweet): boolean {
  if (!tweet.text || tweet.text.trim().length === 0) return false;
  if (tweet.isRetweet) return false;
  if (tweet.isReply) return false;
  
  const trimmed = tweet.text.trim();
  if (trimmed.length < 10) return false;
  
  const lowerText = trimmed.toLowerCase();
  if (lowerText.startsWith('rt @')) return false;
  
  return true;
}

async function ingestTweet(username: string, tweetText: string): Promise<boolean> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    
    const response = await fetch(`${baseUrl}/api/memory/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'twitter',
        author: username,
        content: tweetText,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[TWITTER] Failed to ingest tweet for ${username}:`, response.status, errorText);
      return false;
    }

    return true;
  } catch (error: any) {
    console.error(`[TWITTER] Exception ingesting tweet for ${username}:`, error.message);
    return false;
  }
}

async function processTweets(tweets: ApifyTweet[]): Promise<Record<string, { processed: number; errors: number }>> {
  console.log(`[TWITTER] Processing ${tweets.length} total tweets`);
  
  const lastTweetIds: Record<string, string | null> = {};
  
  for (const username of TARGET_USERS) {
    lastTweetIds[username] = await getLastTweetId(username);
    console.log(`[TWITTER] Last tweet ID for ${username}: ${lastTweetIds[username] || 'none (will process all)'}`);
  }

  const userTweets: Record<string, ApifyTweet[]> = {};
  TARGET_USERS.forEach(user => userTweets[user] = []);

  for (const tweet of tweets) {
    if (!tweet.username) {
      console.warn(`[TWITTER] Tweet missing username:`, tweet.id);
      continue;
    }
    
    const username = tweet.username;
    if (!TARGET_USERS.includes(username)) {
      console.warn(`[TWITTER] Tweet from unexpected user: ${username}`);
      continue;
    }
    
    if (isMeaningfulTweet(tweet)) {
      userTweets[username].push(tweet);
    } else {
      console.log(`[TWITTER] Tweet filtered out (not meaningful): ${tweet.id} from ${username}`);
    }
  }
  
  for (const username of TARGET_USERS) {
    console.log(`[TWITTER] ${username}: ${userTweets[username].length} meaningful tweets`);
  }

  const results: Record<string, { processed: number; errors: number }> = {};

  for (const username of TARGET_USERS) {
    const userTweetList = userTweets[username] || [];
    
    const sortedTweets = userTweetList.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return timeB - timeA;
    });

    let processed = 0;
    let errors = 0;
    let newestTweetId: string | null = null;
    const lastTweetId = lastTweetIds[username];

    for (const tweet of sortedTweets) {
      if (newestTweetId === null) {
        newestTweetId = tweet.id;
      }

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

    results[username] = { processed, errors };
    console.log(`[TWITTER] Completed ${username}: ${processed} processed, ${errors} errors`);
  }

  return results;
}

async function startActorRun(apiToken: string): Promise<string> {
  const actorIdEncoded = encodeURIComponent(APIFY_ACTOR_ID);
  const runUrl = `${APIFY_API_BASE}/acts/${actorIdEncoded}/runs?token=${apiToken}`;
  
  const response = await fetch(runUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      twitterHandles: TARGET_USERS,
      maxItems: 100,
      sortBy: 'Latest',
      tweetLanguage: 'en',
      includeSearchTerms: false,
      onlyImage: false,
      onlyQuote: false,
      onlyTwitterBlue: false,
      onlyVerifiedUsers: false,
      onlyVideo: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to start Apify run: ${response.status} - ${errorText}`);
  }

  const runData = await response.json() as ApifyRunResponse;
  
  if (!runData.data?.id) {
    throw new Error('No run ID in response');
  }

  console.log(`[TWITTER] Apify actor run started: ${runData.data.id}`);
  return runData.data.id;
}

export async function GET(req: NextRequest) {
  try {
    const apiToken = process.env.APIFY_API_TOKEN;
    if (!apiToken) {
      return NextResponse.json(
        { error: 'APIFY_API_TOKEN not configured' },
        { status: 500 }
      );
    }

    console.log(`[TWITTER] Starting ingestion for users: ${TARGET_USERS.join(', ')}`);

    const runId = await startActorRun(apiToken);
    const datasetId = await pollRunStatus(apiToken, runId);
    
    if (!datasetId) {
      return NextResponse.json(
        { error: 'No dataset ID returned from Apify run' },
        { status: 500 }
      );
    }

    console.log(`[TWITTER] Dataset retrieved: ${datasetId}`);
    
    const tweets = await fetchDataset(apiToken, datasetId);
    console.log(`[TWITTER] Fetched ${tweets.length} tweets from dataset`);

    if (tweets.length === 0) {
      console.error(`[TWITTER] No tweets found - dataset may have returned demo items or empty`);
    } else {
      console.log(`[TWITTER] Sample tweet:`, JSON.stringify(tweets[0], null, 2).substring(0, 300));
    }

    const results = await processTweets(tweets);

    const totalProcessed = Object.values(results).reduce((sum, r) => sum + r.processed, 0);
    const totalErrors = Object.values(results).reduce((sum, r) => sum + r.errors, 0);

    return NextResponse.json({
      success: true,
      results,
      summary: {
        totalProcessed,
        totalErrors,
        users: TARGET_USERS.length,
        tweetsFetched: tweets.length,
      },
    });
  } catch (error: any) {
    console.error('[TWITTER] Ingestion worker failed:', error);
    return NextResponse.json(
      { error: 'Ingestion failed', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
