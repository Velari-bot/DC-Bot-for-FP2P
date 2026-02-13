import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import cors from '@fastify/cors';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { Pool } from 'pg';
import * as path from 'path';
import * as fs from 'fs/promises';
import 'dotenv/config';
import { detectFights, generateFightBreakdown, FightBreakdownResult } from './fightEngine';

const fastify = Fastify({ logger: true });

// Try to import AI assistant (may not be available in all setups)
let handleChatQuery: any = null;

async function loadAIAssistant() {
  try {
    // Try multiple possible paths (from packages/papi directory)
    const possiblePaths = [
      path.resolve(process.cwd(), '..', '..', 'fortnite-core', 'packages', 'ai-assistant', 'dist', 'chat.js'),
      path.join(process.cwd(), '../../fortnite-core/packages/ai-assistant/dist/chat.js'),
      path.join(__dirname, '../../../fortnite-core/packages/ai-assistant/dist/chat.js'),
      path.resolve(process.cwd(), '..', 'fortnite-core', 'packages', 'ai-assistant', 'dist', 'chat.js'),
    ];

    for (const aiAssistantPath of possiblePaths) {
      try {
        const normalizedPath = path.resolve(aiAssistantPath);
        const exists = await fs.access(normalizedPath).then(() => true).catch(() => false);
        if (exists) {
          fastify.log.info(`Found AI Assistant at: ${normalizedPath}`);
          // Use require for CommonJS modules
          try {
            // Try direct require first
            delete require.cache[normalizedPath];
            const chatModule = require(normalizedPath);
            handleChatQuery = chatModule.handleChatQuery || chatModule.default?.handleChatQuery;
            if (handleChatQuery) {
              fastify.log.info('✅ AI Assistant loaded successfully!');
              return;
            } else {
              fastify.log.warn(`handleChatQuery not found in module. Exports: ${Object.keys(chatModule).join(', ')}`);
            }
          } catch (requireError: any) {
            fastify.log.warn(`Failed to require AI Assistant: ${requireError.message}`);
            // Try next path
            continue;
          }
        } else {
          fastify.log.debug(`Path does not exist: ${normalizedPath}`);
        }
      } catch (e: any) {
        // Try next path
        continue;
      }
    }
    fastify.log.warn('AI Assistant not found - chat endpoint will use fallback');
  } catch (error: any) {
    fastify.log.warn('AI Assistant not available - chat endpoint will use fallback');
  }
}

// Osirion API configuration
const OSIRION_API_KEY = process.env.OSIRION_API_KEY || '35402b9d-c247-4408-96cc-cd158547baaa';
const OSIRION_API_BASE = 'https://api.osirion.gg/fortnite/v1';

// Register plugins
fastify.register(multipart, {
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
  },
});

fastify.register(cors, {
  origin: true,
});

// Initialize Redis connection (optional - API will still run without it)
let redisConnection: IORedis | null = null;
let queue: Queue | null = null;
let redisErrorLogged = false;

// Only initialize Redis if explicitly enabled or URL provided
const redisUrl = process.env.REDIS_URL;
const redisEnabled = process.env.REDIS_ENABLED !== 'false'; // Default to true for backward compat

if (redisEnabled && redisUrl) {
  try {
    redisConnection = new IORedis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          if (!redisErrorLogged) {
            fastify.log.warn('Redis connection failed - queue features disabled');
            redisErrorLogged = true;
          }
          return null; // Stop retrying
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true, // Don't connect immediately
    });

    redisConnection.on('error', (err) => {
      if (!redisErrorLogged) {
        fastify.log.warn('Redis connection error - queue features disabled');
        redisErrorLogged = true;
      }
    });

    redisConnection.on('connect', () => {
      fastify.log.info('Redis connected');
      queue = new Queue('analysis', { connection: redisConnection! });
      redisErrorLogged = false; // Reset on successful connection
    });

    // Try to connect (will fail silently if Redis not available)
    redisConnection.connect().catch(() => {
      if (!redisErrorLogged) {
        fastify.log.warn('Redis not available - queue features disabled');
        redisErrorLogged = true;
      }
    });
  } catch (error: any) {
    if (!redisErrorLogged) {
      fastify.log.warn('Redis initialization failed - queue features disabled');
      redisErrorLogged = true;
    }
  }
} else if (!redisUrl) {
  fastify.log.info('Redis not configured (set REDIS_URL to enable queue features)');
}

// Initialize Postgres connection (optional - API will still run without it)
let pool: Pool | null = null;
let dbErrorLogged = false;

// Only initialize Postgres if explicitly enabled or URL provided
const databaseUrl = process.env.DATABASE_URL;
const dbEnabled = process.env.DATABASE_ENABLED !== 'false'; // Default to true for backward compat

if (dbEnabled && databaseUrl) {
  try {
    pool = new Pool({
      connectionString: databaseUrl,
      max: 5,
    });

    pool.on('error', (err) => {
      if (!dbErrorLogged) {
        fastify.log.warn('Postgres pool error - database features disabled');
        dbErrorLogged = true;
      }
    });

    // Test connection (will fail silently if DB not available)
    pool.query('SELECT 1').then(() => {
      fastify.log.info('Postgres connected');
      dbErrorLogged = false; // Reset on successful connection
    }).catch(() => {
      if (!dbErrorLogged) {
        fastify.log.warn('Postgres not available - database features disabled');
        dbErrorLogged = true;
      }
    });
  } catch (error: any) {
    if (!dbErrorLogged) {
      fastify.log.warn('Postgres initialization failed - database features disabled');
      dbErrorLogged = true;
    }
  }
} else if (!databaseUrl) {
  fastify.log.info('Postgres not configured (set DATABASE_URL to enable database features)');
}

// Ensure uploads directory exists
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
fs.mkdir(UPLOAD_DIR, { recursive: true }).catch(console.error);

// Ensure database schema exists
async function initializeDatabase() {
  if (!pool) {
    // Only log once if we haven't already
    if (!dbErrorLogged) {
      fastify.log.info('Postgres not configured - database features disabled');
    }
    return;
  }

  try {
    // Test connection first
    await pool.query('SELECT 1');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS analysis_jobs (
        id SERIAL PRIMARY KEY,
        job_id VARCHAR(255) UNIQUE NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        file_path TEXT,
        player_id VARCHAR(255),
        result_path TEXT,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_job_id ON analysis_jobs(job_id);
      CREATE INDEX IF NOT EXISTS idx_status ON analysis_jobs(status);
    `);
    fastify.log.info('Database initialized');
    dbErrorLogged = false; // Reset on success
  } catch (error: any) {
    if (!dbErrorLogged) {
      fastify.log.warn('Database initialization error - database features disabled');
      dbErrorLogged = true;
    }
  }
}

// Health check endpoint
fastify.get('/health', async () => {
  const health: any = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {},
  };

  // Check Redis
  if (redisConnection) {
    try {
      await redisConnection.ping();
      health.services.redis = 'connected';
    } catch (error: any) {
      health.services.redis = 'disconnected';
    }
  } else {
    health.services.redis = 'not configured';
  }

  // Check Postgres
  if (pool) {
    try {
      await pool.query('SELECT 1');
      health.services.postgres = 'connected';
    } catch (error: any) {
      health.services.postgres = 'disconnected';
    }
  } else {
    health.services.postgres = 'not configured';
  }

  return health;
});

// Upload replay to Osirion (proxies upload to fix CORS)
fastify.post('/api/analyze/upload', async (req, reply) => {
  try {
    const data = await req.file();
    
    if (!data) {
      return reply.code(400).send({ error: 'No file uploaded' });
    }

    // Step 1: Get upload URL from Osirion
    const utcOffset = -(new Date().getTimezoneOffset() / 60);
    const urlResponse = await fetch(`${OSIRION_API_BASE}/uploads/url?utcOffset=${utcOffset}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${OSIRION_API_KEY}`,
      },
    });

    if (!urlResponse.ok) {
      const error = await urlResponse.json().catch(() => ({ error: 'Failed to get upload URL' }));
      return reply.code(urlResponse.status).send({ error: error.error || 'Failed to get upload URL' });
    }

    const { url, trackingId } = await urlResponse.json();

    // Step 2: Read file buffer
    const fileBuffer = await data.toBuffer();

    // Step 3: Upload file to Google Cloud Storage (server-side, no CORS issues)
    const uploadResponse = await fetch(url, {
      method: 'PUT',
      body: fileBuffer,
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    });

    if (!uploadResponse.ok) {
      return reply.code(uploadResponse.status).send({ 
        error: 'Upload to storage failed', 
        details: `${uploadResponse.status} ${uploadResponse.statusText}` 
      });
    }

    fastify.log.info(`Replay uploaded to Osirion with tracking ID: ${trackingId}`);

    return {
      trackingId,
      status: 'pending',
      message: 'Replay uploaded successfully. Processing...',
    };
  } catch (error: any) {
    fastify.log.error('Upload error:', error);
    return reply.code(500).send({ error: 'Failed to upload file', details: error.message || String(error) });
  }
});

// Get comprehensive match data from Osirion
fastify.get('/api/analyze/status/:trackingId', async (req, reply) => {
  try {
    const { trackingId } = req.params as { trackingId: string };

    // Step 1: Check upload status
    const statusResponse = await fetch(`${OSIRION_API_BASE}/uploads/status?trackingId=${trackingId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${OSIRION_API_KEY}`,
      },
    });

    if (!statusResponse.ok) {
      const error = await statusResponse.json().catch(() => ({ error: 'Failed to check status' }));
      return reply.code(statusResponse.status).send({ 
        error: error.error || 'Failed to check status',
        status: 'STATUS_FAILED'
      });
    }

    const statusData = await statusResponse.json();

    // For DUPLICATE status, if we have a matchId, we can still fetch the match data
    const isDuplicateWithMatchId = (statusData.status === 'DUPLICATE' || statusData.status === 'STATUS_DUPLICATE') && statusData.matchId;
    const isComplete = statusData.status === 'STATUS_COMPLETE' && statusData.matchId;

    // If not complete and not duplicate with matchId, return just the status
    if (!isComplete && !isDuplicateWithMatchId) {
      return {
        ...statusData,
        comprehensiveData: null,
      };
    }

    const matchId = statusData.matchId;
    const comprehensiveData: any = {
      matchId,
    };

    // Step 2: Fetch all available match data from Osirion
    const endpoints = [
      { name: 'matchInfo', url: `/matches/${matchId}` },
      { name: 'players', url: `/matches/${matchId}/players` },
      { name: 'weapons', url: `/matches/${matchId}/weapons` },
      { name: 'buildingStats', url: `/matches/${matchId}/building-stats` },
      { name: 'teamPlayers', url: `/matches/${matchId}/team-players` },
      { name: 'events', url: `/matches/${matchId}/events` },
      { name: 'movementEvents', url: `/matches/${matchId}/events/movement` },
      { name: 'shotEvents', url: `/matches/${matchId}/events/shots?startTimeRelative=0&endTimeRelative=100` },
    ];

    // Fetch all endpoints in parallel
    const fetchPromises = endpoints.map(async ({ name, url }) => {
      try {
        const response = await fetch(`${OSIRION_API_BASE}${url}`, {
          headers: {
            'Authorization': `Bearer ${OSIRION_API_KEY}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          return { name, data, success: true };
        } else {
          fastify.log.warn(`Failed to fetch ${name}: ${response.status} ${response.statusText}`);
          return { name, data: null, success: false };
        }
      } catch (error: any) {
        fastify.log.warn(`Error fetching ${name}:`, error.message);
        return { name, data: null, success: false, error: error.message };
      }
    });

    const results = await Promise.all(fetchPromises);
    
    // Add all successfully fetched data
    results.forEach(({ name, data, success }) => {
      if (success && data) {
        comprehensiveData[name] = data;
      }
    });

    // Step 3: Fetch player per zone stats for all players
    try {
      // First get player IDs from match info
      const playerIds: string[] = [];
      if (comprehensiveData.players?.players) {
        playerIds.push(...comprehensiveData.players.players.map((p: any) => p.epicId));
      } else if (comprehensiveData.matchInfo?.players) {
        playerIds.push(...comprehensiveData.matchInfo.players.map((p: any) => p.epicId));
      }

      if (playerIds.length > 0) {
        // Fetch zone stats for all players (limit to reasonable number)
        const epicIdsParam = playerIds.slice(0, 10).join(',');
        const zoneStatsResponse = await fetch(
          `${OSIRION_API_BASE}/matches/${matchId}/players/zones?epicIds=${epicIdsParam}&zoneIndices=0&zoneIndices=1&zoneIndices=2`,
          {
            headers: {
              'Authorization': `Bearer ${OSIRION_API_KEY}`,
            },
          }
        );

        if (zoneStatsResponse.ok) {
          comprehensiveData.playerPerZoneStats = await zoneStatsResponse.json();
        }
      }
    } catch (error: any) {
      fastify.log.warn('Error fetching zone stats:', error.message);
    }

    // Step 4: Run Fight Breakdown Engine
    let fightBreakdown: FightBreakdownResult | null = null;
    try {
      if (comprehensiveData.shotEvents?.hitscanEvents && comprehensiveData.shotEvents.hitscanEvents.length > 0) {
        // Try to get player Epic ID from match data
        let playerEpicId = 'unknown';
        
        // Try to get from players data
        if (comprehensiveData.players?.players && comprehensiveData.players.players.length > 0) {
          // Use first player as default, or could be passed as parameter
          playerEpicId = comprehensiveData.players.players[0].epicId;
        } else if (comprehensiveData.matchInfo?.players && comprehensiveData.matchInfo.players.length > 0) {
          playerEpicId = comprehensiveData.matchInfo.players[0].epicId;
        }

        // Detect fights from shot events
        const fights = detectFights(
          comprehensiveData.shotEvents.hitscanEvents,
          comprehensiveData.movementEvents?.movementEvents || [],
          comprehensiveData.players?.players || [],
          playerEpicId
        );

        // Generate fight breakdown
        fightBreakdown = generateFightBreakdown(fights, playerEpicId);

        fastify.log.info(`Fight Breakdown Engine: Detected ${fights.length} fights`);
      }
    } catch (error: any) {
      fastify.log.warn('Fight Breakdown Engine error:', error.message);
      // Continue without fight breakdown
    }

    fastify.log.info(`Comprehensive match data fetched for ${matchId}`);

    return {
      ...statusData,
      comprehensiveData,
      fightBreakdown, // Add fight breakdown to response
    };
  } catch (error: any) {
    fastify.log.error('Get comprehensive data error:', error);
    return reply.code(500).send({ 
      error: 'Failed to get comprehensive match data', 
      details: error.message || String(error),
      status: 'STATUS_FAILED'
    });
  }
});

// Upload and analyze replay (legacy endpoint - kept for compatibility)
fastify.post('/api/analyze', async (req, reply) => {
  try {
    const data = await req.file();
    
    if (!data) {
      return reply.code(400).send({ error: 'No file uploaded' });
    }

    const filename = `${Date.now()}_${data.filename}`;
    const filePath = path.join(UPLOAD_DIR, filename);
    
    // Save file to disk
    await data.toFile(filePath);
    
    // Extract player ID from form data if provided
    const playerId = (req.body as any)?.playerId || 'anon';
    
    // Generate a simple job ID if queue is not available
    let jobId: string;
    if (queue) {
      // Create job in queue
      const job = await queue.add('analyze', {
        filePath,
        playerId,
        originalFilename: data.filename,
      }, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      });
      jobId = job.id;
    } else {
      // Fallback: generate a simple ID
      jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      fastify.log.warn('Queue not available - using fallback job ID');
    }

    // Store job metadata in database (if available)
    if (pool) {
      try {
        await pool.query(
          'INSERT INTO analysis_jobs (job_id, status, file_path, player_id) VALUES ($1, $2, $3, $4)',
          [jobId, 'pending', filePath, playerId]
        );
      } catch (error: any) {
        fastify.log.warn('Database not available - job metadata not stored:', error.message);
      }
    }

    fastify.log.info(`Job created: ${jobId} for file: ${filename}`);

    return {
      job_id: jobId,
      status: 'pending',
      message: queue ? 'Replay uploaded and queued for analysis' : 'Replay uploaded (queue not available)',
    };
  } catch (error: any) {
    fastify.log.error('Upload error:', error);
    return reply.code(500).send({ error: 'Failed to upload file', details: error.message || String(error) });
  }
});

// Get analysis status and results
fastify.get('/api/analyze/:id', async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    
    // Get job from database (if available)
    if (pool) {
      try {
        const result = await pool.query(
          'SELECT * FROM analysis_jobs WHERE job_id = $1',
          [id]
        );

        if (result.rows.length > 0) {
          const job = result.rows[0];

          // If completed, try to load result file
          let analysisResult = null;
          if (job.status === 'completed' && job.result_path) {
            try {
              const resultData = await fs.readFile(job.result_path, 'utf-8');
              analysisResult = JSON.parse(resultData);
            } catch (error) {
              fastify.log.warn(`Could not read result file: ${job.result_path}`, error);
            }
          }

          return {
            job_id: job.job_id,
            status: job.status,
            created_at: job.created_at,
            updated_at: job.updated_at,
            error: job.error_message,
            result: analysisResult,
          };
        }
      } catch (error: any) {
        fastify.log.warn('Database query failed:', error.message);
      }
    }

    // Fallback: return pending status if database not available
    // Return 200 with pending status instead of 404, so frontend can continue polling
    return {
      job_id: id,
      status: 'pending',
      message: 'Database not available - job may still be processing. Check API logs for details.',
      database_available: false
    };
  } catch (error: any) {
    fastify.log.error('Get job error:', error);
    return reply.code(500).send({ error: 'Failed to get job status', details: error.message || String(error) });
  }
});

// List all jobs (optional, for admin/debugging)
fastify.get('/api/jobs', async (req) => {
  if (!pool) {
    return { 
      jobs: [],
      message: 'Database not available - job listing disabled'
    };
  }

  try {
    const result = await pool.query(
      'SELECT job_id, status, player_id, created_at, updated_at FROM analysis_jobs ORDER BY created_at DESC LIMIT 100'
    );
    return { jobs: result.rows };
  } catch (error: any) {
    fastify.log.error('List jobs error:', error);
    return { error: 'Failed to list jobs', details: error.message || String(error) };
  }
});

// Load tweets from JSON file
async function loadTweetsFromFile(): Promise<any[]> {
  const possiblePaths = [
    // From packages/papi directory
    path.resolve(process.cwd(), '..', '..', 'fortnite-core', 'data', 'tweets', 'tweets.json'),
    path.resolve(process.cwd(), '..', 'fortnite-core', 'data', 'tweets', 'tweets.json'),
    path.resolve(process.cwd(), 'fortnite-core', 'data', 'tweets', 'tweets.json'),
    // From root directory
    path.resolve(__dirname, '..', '..', '..', 'fortnite-core', 'data', 'tweets', 'tweets.json'),
    path.resolve(__dirname, '..', '..', 'fortnite-core', 'data', 'tweets', 'tweets.json'),
    // Absolute paths
    path.join(process.cwd(), 'fortnite-core', 'data', 'tweets', 'tweets.json'),
    path.join(process.cwd(), '..', 'fortnite-core', 'data', 'tweets', 'tweets.json'),
    path.join(process.cwd(), '..', '..', 'fortnite-core', 'data', 'tweets', 'tweets.json'),
  ];

  for (const filePath of possiblePaths) {
    try {
      const resolvedPath = path.resolve(filePath);
      const exists = await fs.access(resolvedPath).then(() => true).catch(() => false);
      if (!exists) {
        continue;
      }
      
      const data = await fs.readFile(resolvedPath, 'utf-8');
      const json = JSON.parse(data);
      const tweets = json.tweets || json.data || [];
      fastify.log.info(`✅ Loaded ${tweets.length} tweets from ${resolvedPath}`);
      return tweets;
    } catch (error: any) {
      // File doesn't exist or can't be read - try next path
      if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') {
        fastify.log.debug(`Could not read tweets from ${filePath}: ${error.message}`);
      }
    }
  }

  fastify.log.warn('⚠️  No tweets file found in any of the expected locations. Tweets endpoint will return empty data.');
  fastify.log.warn('   Searched paths from:', process.cwd());
  return [];
}

// Tweets API endpoints
fastify.get('/api/tweets', async (req) => {
  try {
    const { limit = 50 } = req.query as { limit?: number };
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : (limit || 50);
    
    const allTweets = await loadTweetsFromFile();
    
    // Sort by created_at (newest first) and limit
    const now = new Date().getTime();
    const FIVE_MINUTES = 5 * 60 * 1000;
    
    const sortedTweets = allTweets
      .sort((a: any, b: any) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
      })
      .slice(0, limitNum)
      .map((tweet: any) => {
        const tweetTime = new Date(tweet.created_at).getTime();
        const isLive = (now - tweetTime) < FIVE_MINUTES;
        
        return {
          tweet_id: tweet.tweet_id,
          username: tweet.username,
          name: tweet.name,
          text: tweet.text,
          created_at: tweet.created_at,
          isLive,
        };
      });

    return {
      total: allTweets.length,
      data: sortedTweets,
      streamConnected: allTweets.length > 0, // Assume connected if we have data
    };
  } catch (error: any) {
    fastify.log.error('Get tweets error:', error);
    return { 
      total: 0, 
      data: [],
      streamConnected: false,
      error: 'Failed to get tweets',
      details: error.message || String(error)
    };
  }
});

// Get tweets by username
fastify.get('/api/tweets/:username', async (req, reply) => {
  try {
    const { username } = req.params as { username: string };
    const { limit = 50 } = req.query as { limit?: number };
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : (limit || 50);
    
    const allTweets = await loadTweetsFromFile();
    
    // Filter by username (case-insensitive)
    const filteredTweets = allTweets
      .filter((tweet: any) => tweet.username?.toLowerCase() === username.toLowerCase())
      .sort((a: any, b: any) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
      })
      .slice(0, limitNum)
      .map((tweet: any) => {
        const now = new Date().getTime();
        const tweetTime = new Date(tweet.created_at).getTime();
        const FIVE_MINUTES = 5 * 60 * 1000;
        const isLive = (now - tweetTime) < FIVE_MINUTES;
        
        return {
          tweet_id: tweet.tweet_id,
          username: tweet.username,
          name: tweet.name,
          text: tweet.text,
          created_at: tweet.created_at,
          isLive,
        };
      });

    return {
      total: allTweets.filter((tweet: any) => tweet.username?.toLowerCase() === username.toLowerCase()).length,
      data: filteredTweets,
      streamConnected: filteredTweets.length > 0,
      username,
    };
  } catch (error: any) {
    fastify.log.error('Get tweets by username error:', error);
    return reply.code(500).send({ 
      total: 0,
      data: [],
      streamConnected: false,
      error: 'Failed to get tweets',
      details: error.message || String(error)
    });
  }
});

// AI Chat endpoint
fastify.post('/api/chat', async (req, reply) => {
  try {
    const { query, conversation_history, max_context } = req.body as {
      query?: string;
      conversation_history?: any[];
      max_context?: number;
    };

    if (!query) {
      return reply.code(400).send({ error: 'Query is required' });
    }

    fastify.log.info(`💬 Chat query: "${query}"`);

    // Try to use AI assistant if available
    if (handleChatQuery) {
      try {
        const response = await handleChatQuery({
          query,
          conversation_history,
          max_context,
        });
        return response;
      } catch (aiError: any) {
        fastify.log.warn('⚠️  AI chat failed, returning fallback response:', aiError.message);
      }
    }

    // Fallback response
    const fallbackResponse = {
      response: `I received your query: "${query}"

⚠️ AI Assistant is not fully configured. To enable full AI features:
1. Make sure the AI assistant package is built: cd fortnite-core && npm run build
2. Set OPENAI_API_KEY in your .env file (optional but recommended)

📊 However, I can help with:
- Replay analysis via /api/analyze/upload
- Tournament schedules
- Tweet tracking via /api/tweets

Try asking about Fortnite gameplay, tournaments, or competitive scene!`,
      sources: [],
      timestamp: new Date().toISOString(),
    };

    return fallbackResponse;
  } catch (error: any) {
    fastify.log.error('Error handling chat:', error);
    return reply.code(500).send({ 
      error: 'Failed to process chat query',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get tweet statistics
fastify.get('/api/tweet-stats', async (req) => {
  try {
    const allTweets = await loadTweetsFromFile();
    
    // Count tweets by username
    const byUser: Record<string, number> = {};
    allTweets.forEach((tweet: any) => {
      const username = tweet.username;
      if (username) {
        byUser[username] = (byUser[username] || 0) + 1;
      }
    });
    
    return {
      total: allTweets.length,
      byUser: {
        osirion_gg: byUser['osirion_gg'] || 0,
        KinchAnalytics: byUser['KinchAnalytics'] || 0,
        FNcompReport: byUser['FNcompReport'] || 0,
      },
    };
  } catch (error: any) {
    fastify.log.error('Get tweet stats error:', error);
    return { 
      total: 0,
      byUser: {},
      error: 'Failed to get tweet stats',
      details: error.message || String(error)
    };
  }
});

// Start server
async function start() {
  try {
    // Load AI assistant (non-blocking - server will work without it)
    loadAIAssistant().catch((err) => {
      fastify.log.warn('AI Assistant loading failed (server will continue):', err.message);
    });
    
    // Initialize database (non-blocking)
    initializeDatabase().catch((err) => {
      fastify.log.warn('Database initialization failed (server will continue):', err.message);
    });
    
    // Force port 4000 for papi server (frontend expects this)
    const port = 4000;
    
    // Start server immediately
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`✅ Fastify API listening on port ${port}`);
    fastify.log.info(`✅ API endpoints available at http://localhost:${port}/api/chat`);
    fastify.log.info(`✅ Health check: http://localhost:${port}/health`);
  } catch (error: any) {
    fastify.log.error('Failed to start server:', error);
    if (error.code === 'EADDRINUSE') {
      fastify.log.error(`Port ${port} is already in use. Kill the process using it and try again.`);
    }
    process.exit(1);
  }
}

start();
