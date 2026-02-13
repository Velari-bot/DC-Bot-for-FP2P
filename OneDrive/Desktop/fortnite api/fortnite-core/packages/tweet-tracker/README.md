# @fortnite-core/tweet-tracker

Real-time Twitter/X API integration for tracking Fortnite-related tweets.

## Features

- 🔄 Real-time tweet streaming via Twitter v2 API
- 💾 Automatic tweet storage with duplicate detection
- 🔌 Auto-reconnection with exponential backoff
- 📊 Tweet statistics and analytics
- 🔥 "Live" indicator for recent tweets
- 🛡️ Robust error handling

## Quick Start

### 1. Get Twitter API Credentials

1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create an App and generate a **Bearer Token**

### 2. Configure Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit .env and add your credentials
X_BEARER_TOKEN=your_bearer_token_here
TRACKED_TWITTER_USERS=FortniteGame,EpicGames,Kinch,Osirion
```

### 3. Install & Build

```bash
npm install
npm run build
```

### 4. Run

```bash
# Run standalone
npm start

# Or integrated with API server
cd ../api && npm start
```

## Usage

### Import in Your Code

```typescript
import { 
  startTweetTracker,
  getRecentTweets,
  getTweetsByUser,
  getTweetStats
} from '@fortnite-core/tweet-tracker';

// Start tracking
await startTweetTracker();

// Get recent tweets
const tweets = await getRecentTweets({ limit: 10 });

// Get tweets from specific user
const fortniteTweets = await getTweetsByUser('FortniteGame', 20);
```

### API Endpoints

When integrated with the API package:

- `GET /api/tweets` - Get recent tweets
- `GET /api/tweets/:username` - Get tweets by user
- `GET /api/tweet-stats` - Get statistics

## Documentation

See [docs/tweet-tracker.md](../../docs/tweet-tracker.md) for complete documentation.

## License

Part of the Fortnite Core API monorepo.

