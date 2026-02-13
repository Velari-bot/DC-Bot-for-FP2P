import { NextRequest, NextResponse } from "next/server";

// Cache tweets for 24 hours (in milliseconds)
const CACHE_DURATION = 24 * 60 * 60 * 1000;

// In-memory cache
let cachedTweets: any[] | null = null;
let lastFetchTime = 0;

interface ApifyTweet {
  id: string;
  text: string;
  author: {
    userName: string;
    name: string;
    profileImageUrl?: string;
  };
  createdAt: string;
  likeCount?: number;
  retweetCount?: number;
  replyCount?: number;
  url?: string;
  media?: any[];
}

/**
 * Fetch tweets from Apify API
 */
async function fetchTweetsFromMemory(): Promise<ApifyTweet[]> {
  try {
    // Use memory API directly via Firestore
    const { db } = await import('@/lib/firebase-admin');
    
    const snapshot = await db.collection('memories')
      .where('source', '==', 'twitter')
      .limit(50)
      .get();
    
    const memories = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
    }));
    
    // Sort by timestamp
    memories.sort((a, b) => {
      const aTime = typeof a.timestamp === 'number' ? a.timestamp : 
                   (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const bTime = typeof b.timestamp === 'number' ? b.timestamp : 
                   (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return bTime - aTime; // Descending
    });
    
    // Transform memory format to tweet format
    return memories.map((memory: any) => ({
      id: memory.id || '',
      text: memory.content || '',
      author: {
        userName: memory.author || '',
        name: memory.author || '',
      },
      createdAt: memory.createdAt || new Date().toISOString(),
      likeCount: 0,
      retweetCount: 0,
      replyCount: 0,
    }));
  } catch (error: any) {
    console.error("❌ Error fetching tweets from memory API:", error.message);
    return [];
  }
}

async function fetchTweetsFromApify(): Promise<ApifyTweet[]> {
  const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
  const APIFY_ACTOR_ID = process.env.APIFY_ACTOR_ID || "apidojo/tweet-scraper";
  const TWITTER_USERNAME = process.env.TWITTER_USERNAME || "osirion_gg";

  // Check cache first
  const now = Date.now();
  if (cachedTweets && (now - lastFetchTime) < CACHE_DURATION) {
    console.log("✅ Returning cached tweets:", cachedTweets.length);
    return cachedTweets;
  }

  // If Apify is not configured, use memory API
  if (!APIFY_API_TOKEN) {
    console.log("⚠️ APIFY_API_TOKEN not configured, using memory API");
    const memoryTweets = await fetchTweetsFromMemory();
    if (memoryTweets.length > 0) {
      cachedTweets = memoryTweets;
      lastFetchTime = now;
      return memoryTweets;
    }
    return [];
  }
  
  console.log("🔄 Fetching fresh tweets from Apify...");

  try {
    // Calculate date filter (December 1, 2024 onwards)
    const filterDate = new Date("2024-12-01T00:00:00Z");
    
    // Run Apify actor to scrape tweets
    const runUrl = `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/runs?token=${APIFY_API_TOKEN}`;
    
    const runResponse = await fetch(runUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startUrls: [`https://twitter.com/${TWITTER_USERNAME}`],
        maxItems: 100, // Fetch more to ensure we get enough after filtering
        sort: "Latest",
        searchMode: "live", // Get only recent tweets
      }),
    });

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error("❌ Failed to start Apify run:", runResponse.status, errorText);
      // Fallback to memory API if Apify fails
      console.log("🔄 Falling back to memory API...");
      return await fetchTweetsFromMemory();
    }

    const runData = await runResponse.json();
    console.log("✅ Apify run started:", runData.data?.id);
    
    if (!runData.data || !runData.data.id) {
      console.error("❌ No run ID in response:", runData);
      throw new Error("Invalid Apify response - no run ID");
    }
    
    const runId = runData.data.id;

    // Wait for the run to complete (with timeout)
    let attempts = 0;
    const maxAttempts = 30;
    let runStatus = "RUNNING";

    while (runStatus === "RUNNING" && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      const statusResponse = await fetch(
        `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/runs/${runId}?token=${APIFY_API_TOKEN}`
      );
      
      const statusData = await statusResponse.json();
      runStatus = statusData.data.status;
      attempts++;
    }

    if (runStatus !== "SUCCEEDED") {
      throw new Error(`Apify run did not succeed: ${runStatus}`);
    }

    // Fetch the dataset
    const datasetUrl = `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/runs/${runId}/dataset/items?token=${APIFY_API_TOKEN}`;
    const datasetResponse = await fetch(datasetUrl);

    if (!datasetResponse.ok) {
      throw new Error(`Failed to fetch dataset: ${datasetResponse.status}`);
    }

    const tweets = await datasetResponse.json();

    // Filter tweets from December 1st onwards and deduplicate
    const uniqueTweets: { [key: string]: ApifyTweet } = {};
    tweets.forEach((tweet: any) => {
      if (tweet.id) {
        const tweetDate = new Date(tweet.createdAt);
        
        // Only include tweets from Dec 1, 2024 onwards
        if (tweetDate >= filterDate) {
          uniqueTweets[tweet.id] = {
            id: tweet.id,
            text: tweet.text || tweet.full_text || "",
            author: {
              userName: tweet.author?.userName || TWITTER_USERNAME,
              name: tweet.author?.name || "",
              profileImageUrl: tweet.author?.profileImageUrl,
            },
            createdAt: tweet.createdAt || new Date().toISOString(),
            likeCount: tweet.likeCount || 0,
            retweetCount: tweet.retweetCount || 0,
            replyCount: tweet.replyCount || 0,
            url: tweet.url || `https://twitter.com/${TWITTER_USERNAME}/status/${tweet.id}`,
            media: tweet.media || [],
          };
        }
      }
    });

    const deduplicatedTweets = Object.values(uniqueTweets);

    // Update cache
    cachedTweets = deduplicatedTweets;
    lastFetchTime = now;

    return deduplicatedTweets;
  } catch (error: any) {
    console.error("❌ Error fetching tweets from Apify:", error.message);
    console.error("Full error:", error);
    
    // Try memory API as fallback
    console.log("🔄 Falling back to memory API...");
    const memoryTweets = await fetchTweetsFromMemory();
    if (memoryTweets.length > 0) {
      cachedTweets = memoryTweets;
      lastFetchTime = Date.now();
      return memoryTweets;
    }
    
    // Return cached tweets if available, even if stale
    if (cachedTweets) {
      console.log("⚠️ Returning stale cached tweets due to error");
      return cachedTweets;
    }
    
    // Return empty array instead of throwing to prevent 500 errors
    console.log("⚠️ No cached tweets available, returning empty array");
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("refresh") === "true";

    console.log("📡 Tweets API called, forceRefresh:", forceRefresh);

    // Force refresh if requested
    if (forceRefresh) {
      cachedTweets = null;
      lastFetchTime = 0;
    }

    const tweets = await fetchTweetsFromApify();

    console.log("✅ Returning tweets:", tweets.length);

    return NextResponse.json({
      success: true,
      tweets,
      cached: !forceRefresh && cachedTweets !== null,
      count: tweets.length,
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
      },
    });
  } catch (error: any) {
    console.error("❌ Error in tweets API route:", error);
    console.error("Stack:", error.stack);
    
    // Return empty tweets instead of error to prevent frontend crash
    return NextResponse.json({
      success: false,
      tweets: [],
      cached: false,
      count: 0,
      error: "Failed to fetch tweets",
      message: error.message,
    }, {
      status: 200, // Return 200 to prevent frontend error
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
      },
    });
  }
}

// Optional: Add a POST endpoint to manually trigger refresh
export async function POST(request: NextRequest) {
  try {
    // Clear cache and fetch fresh data
    cachedTweets = null;
    lastFetchTime = 0;

    const tweets = await fetchTweetsFromApify();

    return NextResponse.json({
      success: true,
      message: "Tweets refreshed successfully",
      tweets,
      count: tweets.length,
    });
  } catch (error: any) {
    console.error("Error refreshing tweets:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to refresh tweets",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

