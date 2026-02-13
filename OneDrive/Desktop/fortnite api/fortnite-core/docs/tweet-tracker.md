# Tweet Tracker Documentation

## Overview

The Tweet Tracker package provides real-time integration with Twitter/X API to monitor and store tweets from specified Fortnite-related accounts. It uses the Twitter v2 filtered stream API to receive tweets in real-time and stores them in a JSON-based database.

## Features

- ✅ Real-time tweet streaming from Twitter v2 API
- ✅ Automatic reconnection with exponential backoff
- ✅ Tweet storage with duplicate detection
- ✅ RESTful API endpoints for accessing tweets
- ✅ Support for multiple tracked accounts
- ✅ "Live" indicator for recent tweets (< 5 minutes)
- ✅ User statistics and analytics
- ✅ Graceful error handling and logging

## Architecture

### Package Structure

```
packages/tweet-tracker/
├── src/
│   ├── index.ts        # Main entry point and exports
│   ├── stream.ts       # Twitter stream connector with reconnection
│   ├── storage.ts      # Tweet database operations
│   └── types.ts        # TypeScript type definitions
├── package.json
└── tsconfig.json
```

### Data Flow

1. **Stream Connection**: Connects to Twitter v2 filtered stream API
2. **Tweet Reception**: Receives tweets matching filter rules in real-time
3. **Processing**: Parses tweet data and extracts relevant fields
4. **Storage**: Saves tweets to JSON database (with duplicate detection)
5. **API Access**: Exposes tweets via REST endpoints

## Setup

### 1. Twitter API Credentials

You need a Twitter Developer account with access to the Twitter API v2.

1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new App or use an existing one
3. Generate a **Bearer Token** from the "Keys and Tokens" section
4. Copy the Bearer Token for the next step

### 2. Environment Variables

Create or update your `.env` file in the `fortnite-core` directory:

```env
# Twitter/X API Configuration
X_BEARER_TOKEN=your_bearer_token_here

# Tracked Twitter accounts (comma-separated, no @ symbols)
TRACKED_TWITTER_USERS=FortniteGame,EpicGames,Kinch,Osirion
```

#### Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `X_BEARER_TOKEN` | Yes | - | Twitter API Bearer Token |
| `TRACKED_TWITTER_USERS` | No | `FortniteGame,EpicGames,Kinch,Osirion` | Comma-separated list of Twitter usernames to track (without @) |

### 3. Installation

```bash
# Install dependencies for all packages
cd fortnite-core
npm install

# Build all packages
npm run build
```

### 4. Running the Tweet Tracker

The tweet tracker starts automatically when you run the API server:

```bash
# Start the API server (includes tweet tracker)
cd packages/api
npm start
```

Or run the tweet tracker standalone:

```bash
cd packages/tweet-tracker
npm start
```

## API Endpoints

### Get Recent Tweets

Get the most recent tweets from all tracked accounts.

```http
GET /api/tweets
```

**Query Parameters:**
- `limit` (optional): Maximum number of tweets to return (default: 50)
- `username` (optional): Filter by specific username

**Example Request:**
```bash
curl http://localhost:3000/api/tweets?limit=10
```

**Example Response:**
```json
{
  "data": [
    {
      "tweet_id": "1832928193239822",
      "username": "FortniteGame",
      "author_id": "123456789",
      "name": "Fortnite",
      "profile_image_url": "https://pbs.twimg.com/profile_images/...",
      "text": "New update drops tomorrow! Get ready for Chapter 5!",
      "created_at": "2025-11-04T14:30:00.000Z",
      "isLive": true,
      "raw": { ... }
    }
  ],
  "total": 10,
  "streamConnected": true
}
```

### Get Tweets by User

Get tweets from a specific tracked user.

```http
GET /api/tweets/:username
```

**Path Parameters:**
- `username`: Twitter username (without @)

**Query Parameters:**
- `limit` (optional): Maximum number of tweets to return (default: 50)

**Example Request:**
```bash
curl http://localhost:3000/api/tweets/FortniteGame?limit=20
```

**Example Response:**
```json
{
  "data": [
    {
      "tweet_id": "1832928193239822",
      "username": "FortniteGame",
      "text": "New update drops tomorrow!",
      "created_at": "2025-11-04T14:30:00.000Z",
      "isLive": false
    }
  ],
  "total": 20,
  "username": "FortniteGame",
  "streamConnected": true
}
```

### Get Tweet Statistics

Get aggregate statistics about stored tweets.

```http
GET /api/tweet-stats
```

**Example Request:**
```bash
curl http://localhost:3000/api/tweets/stats
```

**Example Response:**
```json
{
  "total": 1547,
  "byUser": {
    "FortniteGame": 892,
    "EpicGames": 345,
    "Kinch": 189,
    "Osirion": 121
  },
  "oldestTweet": "2025-10-01T10:00:00.000Z",
  "newestTweet": "2025-11-04T14:30:00.000Z",
  "streamConnected": true
}
```

### Diagnostics

The main diagnostics endpoint includes tweet tracker status:

```http
GET /api/diagnostics
```

Includes `tweetTrackerStatus` (connected/disconnected/disabled) and `tweetCount`.

## Programmatic Usage

### Import and Use in Your Code

```typescript
import { 
  startTweetTracker,
  getRecentTweets,
  getTweetsByUser,
  getTweetStats,
  isStreamConnected
} from '@fortnite-core/tweet-tracker';

// Start the tracker
await startTweetTracker();

// Get recent tweets
const tweets = await getRecentTweets({ limit: 10 });

// Get tweets from specific user
const fortniteTweets = await getTweetsByUser('FortniteGame', 20);

// Get statistics
const stats = await getTweetStats();

// Check connection status
const connected = isStreamConnected();
```

### Custom Configuration

```typescript
import { initTweetTracker } from '@fortnite-core/tweet-tracker';

const stream = await initTweetTracker({
  bearerToken: 'your_token',
  trackedUsers: ['FortniteGame', 'EpicGames'],
  onTweet: (tweet) => {
    console.log('New tweet:', tweet.text);
  },
  onError: (error) => {
    console.error('Stream error:', error);
  },
  onReconnect: () => {
    console.log('Reconnecting...');
  }
});

await stream.start();
```

## Managing Tracked Accounts

### Adding/Removing Accounts

1. **Update Environment Variable**: Edit your `.env` file:

```env
TRACKED_TWITTER_USERS=FortniteGame,EpicGames,Kinch,Osirion,NewAccount
```

2. **Restart the API Server**: The stream will automatically reconnect with new rules:

```bash
npm start
```

### Programmatically Update Accounts

```typescript
import { getStreamInstance } from '@fortnite-core/tweet-tracker';

const stream = getStreamInstance();
if (stream) {
  await stream.updateTrackedUsers(['FortniteGame', 'EpicGames', 'NewAccount']);
}
```

## Data Storage

### Database Location

Tweets are stored in:
```
fortnite-core/data/tweets/tweets.json
```

### Database Schema

```typescript
interface TweetsDatabase {
  tweets: TweetData[];
  lastUpdate: string;
}

interface TweetData {
  tweet_id: string;
  username: string;
  author_id: string;
  name: string;
  profile_image_url?: string;
  text: string;
  created_at: Date;
  raw: any;  // Full Twitter API response
}
```

### Storage Limits

- Maximum stored tweets: **10,000**
- Older tweets are automatically pruned when limit is reached
- Duplicates are automatically detected and skipped

## Error Handling

### Automatic Reconnection

The stream uses exponential backoff for reconnection:

- Initial delay: 1 second
- Maximum delay: 60 seconds
- Delay doubles after each failed attempt
- Resets to initial delay on successful connection

### Common Issues

#### 1. Authentication Error (401/403)

**Symptom**: `❌ Authentication error - check your X_BEARER_TOKEN`

**Solution**:
- Verify your Bearer Token is correct
- Ensure the token has not expired
- Check your Twitter API access level

#### 2. Stream Disconnects Frequently

**Symptom**: Stream reconnects every few minutes

**Possible Causes**:
- Network issues
- Twitter API rate limits
- Invalid filter rules

**Solution**:
- Check your internet connection
- Verify filter rules are valid
- Review Twitter API usage limits

#### 3. No Tweets Being Received

**Symptom**: Stream connected but no tweets appear

**Possible Causes**:
- Tracked accounts haven't tweeted recently
- Filter rules don't match any tweets
- Stream rules not set up correctly

**Solution**:
- Wait for tracked accounts to tweet
- Check `TRACKED_TWITTER_USERS` spelling
- Verify accounts exist and are not private

## Monitoring

### Check Stream Status

```bash
# Via API
curl http://localhost:3000/api/diagnostics | jq .tweetTrackerStatus

# Via logs
# Look for: "✅ Connected to Twitter stream"
```

### Logs

The tweet tracker provides detailed logging:

```
Initializing tweet tracker...
Tracking tweets from: FortniteGame, EpicGames, Kinch, Osirion
Connecting to Twitter stream...
Stream rules set up for users: FortniteGame, EpicGames, Kinch, Osirion
✅ Connected to Twitter stream
📱 New tweet from @FortniteGame: New update drops tomorrow! Get ready for...
Saved tweet from @FortniteGame: New update drops tomorrow!...
```

## Performance Considerations

### Memory Usage

- In-memory cache of tweets database
- ~1KB per tweet average
- 10,000 tweets ≈ 10MB memory

### Disk Usage

- JSON database file grows with tweets
- 10,000 tweets ≈ 15-20MB disk space
- Auto-pruning prevents unlimited growth

### Network Usage

- Persistent HTTPS connection to Twitter
- Minimal bandwidth (only when tweets occur)
- Typically < 1MB/hour for active accounts

## Stretch Goals & Extensions

### Firebase Integration

```typescript
import { startTweetTracker } from '@fortnite-core/tweet-tracker';
import { sendToFirebase } from './firebase';

await startTweetTracker({
  onTweet: async (tweet) => {
    await sendToFirebase(tweet);
  }
});
```

### Discord Webhooks

```typescript
import axios from 'axios';

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

await startTweetTracker({
  onTweet: async (tweet) => {
    await axios.post(DISCORD_WEBHOOK_URL, {
      content: `**@${tweet.username}**: ${tweet.text}`,
      username: 'Fortnite Tweet Bot'
    });
  }
});
```

### Keyword Filtering

Modify `stream.ts` to add keyword filters:

```typescript
const rules: TwitterStreamRule[] = [
  {
    value: `(${userQuery}) (Chapter 5 OR update OR "patch notes")`,
    tag: 'fortnite-updates'
  }
];
```

## Troubleshooting

### Clear All Tweets

If you need to reset the tweet database:

```typescript
import { clearAllTweets } from '@fortnite-core/tweet-tracker';

await clearAllTweets();
console.log('All tweets cleared');
```

### Manual Database Inspection

```bash
# View tweets database
cat fortnite-core/data/tweets/tweets.json | jq '.tweets | length'

# Get latest tweet
cat fortnite-core/data/tweets/tweets.json | jq '.tweets[0]'
```

## Testing

### Test Stream Connection

Create a test file `test-tweets.ts`:

```typescript
import { initTweetTracker } from '@fortnite-core/tweet-tracker';

(async () => {
  console.log('Testing tweet tracker...');
  
  const stream = await initTweetTracker({
    onTweet: (tweet) => {
      console.log('✅ Received tweet:', tweet.text);
    },
    onError: (error) => {
      console.error('❌ Error:', error.message);
    }
  });
  
  await stream.start();
  console.log('Waiting for tweets...');
})();
```

Run with:
```bash
npx ts-node test-tweets.ts
```

## Support

For issues or questions:
1. Check the logs for error messages
2. Verify environment variables are set correctly
3. Ensure Twitter API credentials are valid
4. Review the Twitter API documentation: https://developer.twitter.com/en/docs/twitter-api

## License

Part of the Fortnite Core API project.

