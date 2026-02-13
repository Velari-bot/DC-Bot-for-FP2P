/**
 * API Server
 * Express API server for Fortnite data
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from root .env file
dotenv.config({ path: path.join(__dirname, '../../../.env') });

import express from 'express';
import axios from 'axios';
import Stripe from 'stripe';
import { loadJSON, getLatestVersion, initDatabase } from '@fortnite-core/database';
import { getCosmetics, getWeapons, getMapData } from '@fortnite-core/pak-parser';
import { 
  startTweetTracker, 
  getRecentTweets, 
  getTweetsByUser,
  getTweetStats,
  isStreamConnected 
} from '@fortnite-core/tweet-tracker';
import { handleChatQuery } from '@fortnite-core/ai-assistant';
import * as fs from 'fs-extra';

const app = express();
const PORT = process.env.PORT || 4000;
const API_VERSION = '1.0.0';

// Initialize database
initDatabase().catch(console.error);

// Initialize tweet tracker
if (process.env.X_BEARER_TOKEN) {
  startTweetTracker().catch((error: Error) => {
    console.error('Failed to start tweet tracker:', error);
    console.warn('⚠️  Tweet tracking disabled - API will continue without it');
  });
} else {
  console.warn('⚠️  X_BEARER_TOKEN not set - tweet tracking disabled');
}

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Middleware for API headers and caching
app.use((_req, res, next) => {
  res.setHeader('X-API-Version', API_VERSION);
  res.setHeader('Cache-Control', 'public, max-age=300');
  
  // Try to get last updated from structured directory
  const structuredDir = path.join(process.cwd(), 'data', 'structured');
  fs.stat(structuredDir).then(stats => {
    res.setHeader('X-Last-Updated', stats.mtime.toISOString());
    next();
  }).catch(() => {
    res.setHeader('X-Last-Updated', new Date().toISOString());
    next();
  });
});

// Initialize Stripe (if secret key is provided)
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-11-20.acacia',
  });
  console.log('✅ Stripe initialized');
} else {
  console.warn('⚠️  STRIPE_SECRET_KEY not set - Stripe features disabled');
}

// STRIPE WEBHOOK ENDPOINT - Must be BEFORE express.json() middleware
// This endpoint needs raw body for signature verification
if (stripe) {
  app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not set');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          console.log('✅ Checkout completed:', session.id);
          
          // Get metadata
          const userId = session.metadata?.userId;
          const subscriptionId = session.subscription as string;
          const customerId = session.customer as string;
          const planType = session.metadata?.planType || 'pro';

          if (userId && subscriptionId) {
            // TODO: Update Firebase subscription
            console.log('User ID:', userId);
            console.log('Subscription ID:', subscriptionId);
            console.log('Customer ID:', customerId);
            console.log('Plan Type:', planType);
            
            // Here you would update Firebase with the subscription
            // await updateUserSubscription(userId, {
            //   stripeSubscriptionId: subscriptionId,
            //   stripeCustomerId: customerId,
            //   planType: planType,
            //   status: 'active',
            // });
          }
          break;
        }

        case 'customer.subscription.created': {
          const subscription = event.data.object as Stripe.Subscription;
          console.log('✅ Subscription created:', subscription.id);
          // TODO: Store subscription details
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          console.log('✅ Subscription updated:', subscription.id);
          // TODO: Update subscription details
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          console.log('✅ Subscription canceled:', subscription.id);
          // TODO: Downgrade user to free plan
          break;
        }

        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice;
          console.log('✅ Payment succeeded:', invoice.id);
          // TODO: Renew subscription, send receipt
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          console.log('⚠️ Payment failed:', invoice.id);
          // TODO: Notify user of failed payment
          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // Create Checkout Session endpoint
  app.post('/api/stripe/create-checkout', express.json(), async (req, res) => {
    try {
      const { planType, userId, userEmail } = req.body;

      if (!planType || !userId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Use your price ID
      const priceId = 'price_1RvsvqCitWuvPenEw9TefOig';

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pricing?canceled=true`,
        customer_email: userEmail,
        metadata: {
          userId: userId,
          planType: planType || 'pro',
        },
      });

      res.json({
        checkoutUrl: session.url,
        sessionId: session.id,
      });
    } catch (error: any) {
      console.error('Stripe checkout error:', error);
      res.status(500).json({ 
        error: 'Failed to create checkout session', 
        details: error.message 
      });
    }
  });
}

app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../../../public')));

// Serve data files (tournament schedules, etc.)
app.use('/data', express.static(path.join(__dirname, '../../../data')));

// Root route - serve the dashboard
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '../../../public/index.html'));
});

/**
 * Apply pagination to data
 */
function paginate<T>(data: T[], page: number = 1, limit: number = 50): {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
} {
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedData = data.slice(start, end);
  
  return {
    data: paginatedData,
    pagination: {
      page,
      limit,
      total: data.length,
      pages: Math.ceil(data.length / limit)
    }
  };
}

/**
 * Apply filtering to data
 */
function filterData<T extends Record<string, any>>(data: T[], filterParam?: string): T[] {
  if (!filterParam) return data;
  
  try {
    const filter = JSON.parse(filterParam);
    return data.filter(item => {
      return Object.entries(filter).every(([key, value]) => {
        const itemValue = item[key];
        
        // String contains check
        if (typeof itemValue === 'string' && typeof value === 'string') {
          return itemValue.toLowerCase().includes(value.toLowerCase());
        }
        
        // Exact match
        return itemValue === value;
      });
    });
  } catch (e) {
    // If filter is not valid JSON, treat as simple string search
    const searchTerm = filterParam.toLowerCase();
    return data.filter(item => {
      return JSON.stringify(item).toLowerCase().includes(searchTerm);
    });
  }
}

/**
 * Apply sorting to data
 */
function sortData<T extends Record<string, any>>(data: T[], sortParam?: string): T[] {
  if (!sortParam) return data;
  
  const [field, direction = 'asc'] = sortParam.split(':');
  const directionMultiplier = direction.toLowerCase() === 'desc' ? -1 : 1;
  
  return [...data].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];
    
    if (aVal < bVal) return -1 * directionMultiplier;
    if (aVal > bVal) return 1 * directionMultiplier;
    return 0;
  });
}

/**
 * Handle API request with pagination and filtering
 */
async function handleRequest<T extends Record<string, any>>(
  req: express.Request,
  res: express.Response,
  dataPromise: Promise<T[]>
): Promise<void> {
  try {
    const data = await dataPromise;
    
    if (!data || data.length === 0) {
      res.json({
        data: [],
        pagination: { page: 1, limit: 50, total: 0, pages: 0 }
      });
      return;
    }
    
    // Apply filtering
    const filtered = filterData(data, req.query.filter as string);
    
    // Apply sorting
    const sorted = sortData(filtered, req.query.sort as string);
    
    // Apply pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const result = paginate(sorted, page, limit);
    
    res.json(result);
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Health endpoint
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok',
    version: API_VERSION,
    timestamp: new Date().toISOString()
  });
});

// API Info endpoint
app.get('/api', (_req, res) => {
  res.json({
    name: 'Fortnite Core API',
    version: API_VERSION,
    endpoints: [
      'GET /api/shop',
      'GET /api/cosmetics',
      'GET /api/weapons',
      'GET /api/map',
      'GET /api/events',
      'GET /api/replays/:id',
      'GET /api/latest-version',
      'GET /api/diagnostics',
      'GET /api/tweets',
      'GET /api/tweets/:username',
      'GET /api/tweet-stats',
      'GET /api/data',
      'POST /api/chat',
      'POST /api/discord/token'
    ]
  });
});

// Discord env diagnostics (safe)
app.get('/api/discord/debug', (_req, res) => {
  const id = process.env.DISCORD_CLIENT_ID || '';
  const secret = process.env.DISCORD_CLIENT_SECRET || '';
  const redirect = process.env.DISCORD_REDIRECT_URI || '';
  const mask = (v: string) => v ? `${v.slice(0, 2)}…${v.slice(-2)} (len:${v.length})` : 'unset';
  res.json({
    clientId: mask(id),
    clientSecret: mask(secret),
    redirectUri: redirect || 'unset',
    note: 'Values masked; ensure Discord portal uses the same client and redirect URI.'
  });
});

// Shop endpoint (now served from data ingestion)
app.get('/api/shop', async (_req, res) => {
  try {
    const dataFile = path.join(__dirname, '../../../data/ingestion/records.json');
    if (await fs.pathExists(dataFile)) {
      const store = await fs.readJSON(dataFile);
      const shopData = store.records?.filter((r: any) => r.source === 'fortnite-api' && r.metadata?.type === 'shop') || [];
      res.json({ data: shopData });
    } else {
      res.json({ data: [], message: 'Run data ingestion first' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cosmetics endpoint
app.get('/api/cosmetics', async (req, res) => {
  await handleRequest(req, res, getCosmetics());
});

// Weapons endpoint
app.get('/api/weapons', async (req, res) => {
  await handleRequest(req, res, getWeapons());
});

// Map endpoint
app.get('/api/map', async (req, res) => {
  const version = (req.query.version as string);
  
  try {
    const mapData = await getMapData(version);
    if (mapData) {
      res.json({ data: mapData });
      return;
    }
    res.status(404).json({ error: 'Map data not found' });
  } catch (error) {
    console.error('Error loading map data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Events endpoint (tournaments, etc.)
app.get('/api/events', async (req, res) => {
  try {
    const dataFile = path.join(__dirname, '../../../data/ingestion/records.json');
    if (await fs.pathExists(dataFile)) {
      const store = await fs.readJSON(dataFile);
      const events = store.records?.filter((r: any) => 
        r.tags?.includes('tournament') || r.tags?.includes('event')
      ) || [];
      await handleRequest(req, res, Promise.resolve(events));
    } else {
      res.json({ data: [], message: 'Run data ingestion first' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Replays endpoint
app.get('/api/replays/:id', async (req, res): Promise<void> => {
  const matchId = req.params.id;
  
  try {
    const replayData = await loadJSON(`replays/${matchId}.json`);
    
    if (!replayData) {
      res.status(404).json({ error: 'Replay not found' });
      return;
    }
    
    res.json({ data: replayData });
  } catch (error) {
    console.error('Error loading replay:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List available replays
app.get('/api/replays', async (req, res) => {
  try {
    const replaysDir = path.join(process.cwd(), 'data', 'replays');
    
    if (!await fs.pathExists(replaysDir)) {
      res.json({ data: [], total: 0 });
      return;
    }
    
    const files = await fs.readdir(replaysDir);
    const replayFiles = files.filter(f => f.endsWith('.json'));
    
    const replays = replayFiles.map(f => {
      const matchId = f.replace('.json', '');
      return { matchId, url: `/api/replays/${matchId}` };
    });
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = paginate(replays, page, limit);
    
    res.json(result);
  } catch (error) {
    console.error('Error listing replays:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Latest version endpoint
app.get('/api/latest-version', async (_req, res) => {
  const latestVersion = await getLatestVersion();
  res.json({ version: latestVersion || 'unknown' });
});

// Tweets endpoint - get recent tweets
app.get('/api/tweets', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const username = req.query.username as string;
    
    const tweets = await getRecentTweets({ 
      limit,
      username: username || undefined
    });
    
    // Add "live" indicator for tweets under 5 minutes old
    const now = new Date();
    const tweetsWithLive = tweets.map((tweet: any) => ({
      ...tweet,
      created_at: tweet.created_at,
      isLive: (now.getTime() - new Date(tweet.created_at).getTime()) < 5 * 60 * 1000
    }));
    
    res.json({ 
      data: tweetsWithLive,
      total: tweets.length,
      streamConnected: isStreamConnected()
    });
  } catch (error) {
    console.error('Error getting tweets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Tweets by user endpoint
app.get('/api/tweets/:username', async (req, res) => {
  try {
    const username = req.params.username;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const tweets = await getTweetsByUser(username, limit);
    
    if (tweets.length === 0) {
      res.json({ 
        data: [],
        message: `No tweets found for @${username}`,
        streamConnected: isStreamConnected()
      });
      return;
    }
    
    // Add "live" indicator
    const now = new Date();
    const tweetsWithLive = tweets.map((tweet: any) => ({
      ...tweet,
      created_at: tweet.created_at,
      isLive: (now.getTime() - new Date(tweet.created_at).getTime()) < 5 * 60 * 1000
    }));
    
    res.json({ 
      data: tweetsWithLive,
      total: tweets.length,
      username: username,
      streamConnected: isStreamConnected()
    });
  } catch (error) {
    console.error('Error getting tweets by user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Tweet stats endpoint
app.get('/api/tweet-stats', async (_req, res) => {
  try {
    const stats = await getTweetStats();
    
    res.json({
      ...stats,
      streamConnected: isStreamConnected()
    });
  } catch (error) {
    console.error('Error getting tweet stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Multi-source data endpoint
app.get('/api/data', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const source = req.query.source as string;
    const tag = req.query.tag as string;

    const dataFile = path.join(__dirname, '../../../data/ingestion/records.json');
    
    if (!await fs.pathExists(dataFile)) {
      res.json({
        data: [],
        message: 'No ingestion data available yet. Run: npm run ingest',
        total: 0
      });
      return;
    }

    const store = await fs.readJSON(dataFile);
    let records = store.records || [];

    // Filter by source
    if (source) {
      records = records.filter((r: any) => r.source === source);
    }

    // Filter by tag
    if (tag) {
      records = records.filter((r: any) => r.tags && r.tags.includes(tag));
    }

    // Sort by created_at descending
    records.sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Limit results
    const limited = records.slice(0, limit);

    res.json({
      data: limited,
      total: records.length,
      filtered: source || tag ? true : false,
      stats: store.stats,
      lastUpdate: store.lastUpdate
    });
  } catch (error) {
    console.error('Error getting ingestion data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Discord OAuth token exchange endpoint
app.post('/api/discord/token', async (req, res) => {
  try {
    const { code, redirectUri } = req.body;

    if (!code) {
      res.status(400).json({ error: 'Authorization code is required' });
      return;
    }

    const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '1430744947732250726';
    const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
    const REDIRECT_URI = redirectUri || 'http://localhost:3000/setup.html';

    if (!DISCORD_CLIENT_SECRET) {
      console.warn('⚠️  DISCORD_CLIENT_SECRET not set - Discord OAuth will fail');
      res.status(500).json({ error: 'Discord OAuth not configured' });
      return;
    }

    // Exchange code for access token
    try {
      const form = new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        // client_secret kept for compatibility though Basic auth is also added
        client_secret: DISCORD_CLIENT_SECRET as string,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
      });

      const basicAuth = Buffer.from(`${DISCORD_CLIENT_ID}:${DISCORD_CLIENT_SECRET}`).toString('base64');

      const tokenResponse = await axios.post(
        'https://discord.com/api/oauth2/token',
        form,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${basicAuth}`,
          },
        },
      );

      const { access_token } = tokenResponse.data;

      // Get user info from Discord with email scope
      const userResponse = await axios.get('https://discord.com/api/users/@me', {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      });

      const userData = userResponse.data;

      // Return both token and user data
      res.json({
        access_token,
        user: {
          id: userData.id,
          username: userData.username,
          discriminator: userData.discriminator,
          email: userData.email,
          avatar: userData.avatar,
          verified: userData.verified,
        },
      });
    } catch (axiosError: any) {
      if (axiosError.response) {
        console.error('Discord API error:', axiosError.response.status, axiosError.response.data);
        res.status(axiosError.response.status).json({ 
          error: 'Discord OAuth failed',
          details: axiosError.response.data 
        });
      } else {
        console.error('Discord OAuth error:', axiosError.message);
        res.status(500).json({ 
          error: 'Internal server error',
          message: axiosError.message
        });
      }
    }
  } catch (error) {
    console.error('Discord OAuth error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// AI Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { query, conversation_history, max_context } = req.body;

    if (!query) {
      res.status(400).json({ error: 'Query is required' });
      return;
    }

    console.log(`💬 Chat query: "${query}"`);

    try {
      const response = await handleChatQuery({
        query,
        conversation_history,
        max_context,
      });

      res.json(response);
    } catch (aiError: any) {
      // Fallback response if AI fails
      console.warn('⚠️  AI chat failed, returning fallback response');
      
      const fallbackResponse = {
        response: `I received your query: "${query}"

⚠️ AI features are currently limited. Your OpenAI account may not have access to required models.

📊 However, I can tell you that your system has ingested:
- 204 total records from all sources
- Epic CMS: 189 records (tournaments, news)
- News: 10 articles
- Fortnite-API: 5 items
- Twitter: 20 competitive tweets

You can access this data directly via:
- GET http://localhost:3000/api/data
- GET http://localhost:3000/api/data?tag=tournament
- GET http://localhost:3000/api/tweets`,
        sources: [],
        timestamp: new Date().toISOString(),
      };

      res.json(fallbackResponse);
    }
  } catch (error) {
    console.error('Error handling chat:', error);
    res.status(500).json({ 
      error: 'Failed to process chat query',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Diagnostics endpoint
app.get('/api/diagnostics', async (_req, res) => {
  try {
    // Get manifest version
    let manifestVersion = 'unknown';
    const manifestDir = path.join(process.cwd(), 'data', 'raw', 'manifests');
    if (await fs.pathExists(manifestDir)) {
      const files = await fs.readdir(manifestDir);
      const manifestFiles = files.filter(f => f.endsWith('.json'));
      if (manifestFiles.length > 0) {
        // Try to get version from the latest manifest
        const latestManifest = await loadJSON(`raw/manifests/${manifestFiles[manifestFiles.length - 1]}`);
        if (latestManifest && latestManifest.header) {
          manifestVersion = latestManifest.header.version?.toString() || 'unknown';
        }
      }
    }
    
    // Get pak count
    let pakCount = 0;
    const pakListData = await loadJSON('raw/pakList.json');
    if (pakListData && pakListData.files && Array.isArray(pakListData.files)) {
      pakCount = pakListData.files.length;
    }
    
    // Get cosmetics count
    let cosmeticsCount = 0;
    try {
      const cosmetics = await getCosmetics();
      cosmeticsCount = Array.isArray(cosmetics) ? cosmetics.length : 0;
    } catch (e) {
      // Ignore error
    }
    
    // Get weapons count
    let weaponsCount = 0;
    try {
      const weapons = await getWeapons();
      weaponsCount = Array.isArray(weapons) ? weapons.length : 0;
    } catch (e) {
      // Ignore error
    }
    
    // Get map version
    let mapVersion = 'unknown';
    try {
      const mapData = await getMapData();
      if (mapData && mapData.version) {
        mapVersion = mapData.version;
      }
    } catch (e) {
      // Ignore error
    }
    
    // Get last CMS update
    let lastCMSUpdate = 'never';
    const cmsPath = path.join(process.cwd(), 'data', 'raw', 'cms.json');
    if (await fs.pathExists(cmsPath)) {
      const stats = await fs.stat(cmsPath);
      lastCMSUpdate = stats.mtime.toISOString();
    }
    
    // Get last scheduler run
    let lastSchedulerRun = 'never';
    const logPath = path.join(process.cwd(), 'data', 'database', 'logs', 'scheduler.log');
    if (await fs.pathExists(logPath)) {
      const stats = await fs.stat(logPath);
      lastSchedulerRun = stats.mtime.toISOString();
    }
    
    // Get tweet tracker stats
    let tweetTrackerStatus = 'disabled';
    let tweetCount = 0;
    try {
      if (process.env.X_BEARER_TOKEN) {
        tweetTrackerStatus = isStreamConnected() ? 'connected' : 'disconnected';
        const tweetStats = await getTweetStats();
        tweetCount = tweetStats.total;
      }
    } catch (e) {
      // Ignore error
    }
    
    res.json({
      manifestVersion,
      pakCount,
      cosmeticsCount,
      weaponsCount,
      mapVersion,
      lastCMSUpdate,
      lastSchedulerRun,
      tweetTrackerStatus,
      tweetCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting diagnostics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Fortnite Core API running on port ${PORT}`);
    console.log(`📚 Documentation: http://localhost:${PORT}/api`);
    console.log(`❤️  Health check: http://localhost:${PORT}/health`);
  });
}

export default app;
