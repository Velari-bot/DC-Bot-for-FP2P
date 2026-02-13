# 🧪 Testing Twitter Ingestion Worker

## Quick Test Methods

### Method 1: PowerShell Script (Recommended)

```powershell
cd apps/web
.\scripts\test-twitter-ingest.ps1
```

This will:
- Call the `/api/twitter/ingest` endpoint
- Show processed tweet counts
- Display any errors

### Method 2: Browser/curl

Make sure your dev server is running (`npm run dev`), then:

**Browser:**
```
http://localhost:3000/api/twitter/ingest
```

**curl (PowerShell):**
```powershell
curl http://localhost:3000/api/twitter/ingest
```

**curl (CMD):**
```cmd
curl http://localhost:3000/api/twitter/ingest
```

### Method 3: Using the Test Script (TypeScript)

First, make sure your dev server is running, then:

```powershell
cd apps/web
npx tsx scripts/fetch-tweets-now.ts
```

## ✅ How to Verify It Works

### 1. Check API Response

You should see a response like:
```json
{
  "success": true,
  "results": {
    "osirion_gg": {
      "processed": 5,
      "errors": 0
    }
  },
  "summary": {
    "totalProcessed": 5,
    "totalErrors": 0,
    "users": 1
  }
}
```

### 2. Check Server Logs

In your dev server console, look for:
```
[TWITTER] Processing user: osirion_gg
[TWITTER] Completed osirion_gg: 5 processed, 0 errors
```

### 3. Verify Firestore Collections

**Option A: Firebase Console**
1. Go to: https://console.firebase.google.com/project/pathgen-v2/firestore
2. Check these collections:

   **`memories` collection:**
   - Should contain documents with:
     - `source: "twitter"`
     - `author: "osirion_gg"`
     - `content: "<tweet text>"`
     - `createdAt: <timestamp>`

   **`twitter_last_tweet` collection:**
   - Should contain document `osirion_gg` with:
     - `lastTweetId: "<tweet_id>"`
     - `updatedAt: <timestamp>`

**Option B: Add a simple API endpoint to view recent memories**

### 4. Test Multiple Runs

1. Run the worker once - it should process new tweets
2. Run it again immediately - it should process 0 tweets (already processed)
3. Wait for new tweets or manually test with a different `lastTweetId`

## 🐛 Troubleshooting

### Error: "TWEX_API_KEY not configured"
- Make sure `TWEX_API_KEY` is in your `.env.local` file
- Restart your dev server after adding it

### Error: "Failed to resolve user osirion_gg"
- Check if the TwexAPI endpoint is correct
- Verify your API key is valid
- Check TwexAPI documentation for correct username format

### No tweets processed
- User might not have recent tweets
- All tweets might already be processed (check `twitter_last_tweet` collection)
- Tweets might be filtered out (retweets, ads, etc.)

### Error: "Firebase Admin not initialized"
- Make sure `GOOGLE_APPLICATION_CREDENTIALS_JSON` is set in `.env.local`
- Restart dev server

## 🎯 Expected Behavior

1. **First Run:**
   - Fetches up to 20 most recent tweets
   - Processes all new tweets
   - Saves to `memories` collection
   - Updates `twitter_last_tweet` with newest tweet ID

2. **Subsequent Runs:**
   - Fetches recent tweets again
   - Only processes tweets newer than `lastTweetId`
   - Skips already-processed tweets

3. **Filtering:**
   - Skips retweets (starts with "RT @")
   - Skips ads (contains "promoted", "ad", "sponsored")
   - Skips very short tweets (< 10 characters)
   - Only processes meaningful content

## 📝 Notes

- The worker fetches up to 20 tweets per user
- Only new tweets (after `lastTweetId`) are processed
- Tweets are sorted by newest first
- Each tweet is sent to `/api/memory/ingest` individually

