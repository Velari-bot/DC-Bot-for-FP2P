# Tweet Tracker Quick Start Guide

Get the tweet tracker up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Twitter Developer account with API access
- Twitter API Bearer Token

## Step-by-Step Setup

### 1. Get Twitter API Credentials

1. Go to [https://developer.twitter.com/en/portal/dashboard](https://developer.twitter.com/en/portal/dashboard)
2. Sign in or create a Developer account
3. Create a new Project and App (or use existing)
4. Go to "Keys and Tokens" section
5. Generate a **Bearer Token**
6. Copy the token (you won't see it again!)

### 2. Set Environment Variables

#### Option A: Using .env file (Recommended)

Create a `.env` file in the `fortnite-core` directory:

```bash
# Twitter API Configuration
X_BEARER_TOKEN=your_actual_bearer_token_here
TRACKED_TWITTER_USERS=FortniteGame,EpicGames,Kinch,Osirion
```

#### Option B: System Environment Variables

**Windows PowerShell:**
```powershell
$env:X_BEARER_TOKEN="your_actual_bearer_token_here"
$env:TRACKED_TWITTER_USERS="FortniteGame,EpicGames,Kinch,Osirion"
```

**Linux/Mac:**
```bash
export X_BEARER_TOKEN="your_actual_bearer_token_here"
export TRACKED_TWITTER_USERS="FortniteGame,EpicGames,Kinch,Osirion"
```

### 3. Install Dependencies

```bash
cd fortnite-core
npm install
```

### 4. Build the Packages

```bash
npm run build
```

### 5. Start the Server

```bash
cd packages/api
npm start
```

You should see:
```
Initializing database directories...
Database initialized
Initializing tweet tracker...
Tracking tweets from: FortniteGame, EpicGames, Kinch, Osirion
Connecting to Twitter stream...
Stream rules set up for users: FortniteGame, EpicGames, Kinch, Osirion
✅ Connected to Twitter stream
🚀 Fortnite Core API running on port 3000
```

## Test the Integration

### 1. Check API Status

Open a browser or use curl:

```bash
curl http://localhost:3000/api/diagnostics
```

Look for:
```json
{
  "tweetTrackerStatus": "connected",
  "tweetCount": 0
}
```

### 2. Wait for Tweets

Once the tracked accounts tweet, you'll see in the logs:

```
📱 New tweet from @FortniteGame: New update drops tomorrow! Get ready for...
Saved tweet from @FortniteGame: New update drops tomorrow!...
```

### 3. View Tweets via API

```bash
# Get all recent tweets
curl http://localhost:3000/api/tweets

# Get tweets from specific user
curl http://localhost:3000/api/tweets/FortniteGame

# Get tweet statistics
curl http://localhost:3000/api/tweet-stats
```

## Troubleshooting

### Issue: "Authentication error - check your X_BEARER_TOKEN"

**Solution:**
- Verify your Bearer Token is correct
- Make sure there are no extra spaces or quotes
- Regenerate the token if needed

### Issue: "Stream connected but no tweets"

**Solution:**
- Wait for the tracked accounts to tweet (it's real-time only)
- Verify account names are spelled correctly
- Check accounts are public (not private)

### Issue: "Cannot find module '@fortnite-core/tweet-tracker'"

**Solution:**
```bash
cd fortnite-core
npm install
npm run build
```

### Issue: Stream keeps disconnecting

**Solution:**
- Check your internet connection
- Verify you haven't exceeded Twitter API rate limits
- Check the logs for specific error messages

## Adding/Removing Accounts

1. Edit your `.env` file:
   ```env
   TRACKED_TWITTER_USERS=FortniteGame,EpicGames,Kinch,Osirion,NewAccount
   ```

2. Restart the server:
   ```bash
   npm start
   ```

The stream will automatically reconnect with the new rules.

## Next Steps

- Read the full [Tweet Tracker Documentation](./tweet-tracker.md)
- Integrate tweets into your dashboard
- Set up Discord webhooks for notifications
- Add keyword filtering for specific topics

## API Examples

### Get Live Tweets (< 5 mins old)

```bash
curl "http://localhost:3000/api/tweets?limit=10" | jq '.data[] | select(.isLive == true)'
```

### Get Tweets from Last Hour

```javascript
const response = await fetch('http://localhost:3000/api/tweets?limit=100');
const data = await response.json();

const oneHourAgo = Date.now() - (60 * 60 * 1000);
const recentTweets = data.data.filter(tweet => 
  new Date(tweet.created_at).getTime() > oneHourAgo
);

console.log(`Found ${recentTweets.length} tweets in the last hour`);
```

### Monitor for Specific Keywords

```javascript
import { startTweetTracker } from '@fortnite-core/tweet-tracker';

await startTweetTracker({
  onTweet: (tweet) => {
    const keywords = ['update', 'patch', 'chapter', 'season'];
    const hasKeyword = keywords.some(k => 
      tweet.text.toLowerCase().includes(k)
    );
    
    if (hasKeyword) {
      console.log('🔥 Important tweet:', tweet.text);
      // Send notification, webhook, etc.
    }
  }
});
```

## Need Help?

- Check the logs for error messages
- Review the [full documentation](./tweet-tracker.md)
- Verify your Twitter API credentials
- Make sure all environment variables are set correctly

Happy tracking! 🎮📱

