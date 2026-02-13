# 🧪 Testing Twitter Ingestion Worker

## Quick Test

### Method 1: PowerShell Script (Recommended)

```powershell
.\scripts\test-twitter-ingest.ps1
```

This will:
- Start the Apify actor to fetch tweets
- Wait for completion (~30-60 seconds)
- Show how many tweets were processed
- Display per-user breakdown

### Method 2: Browser/curl

**Browser:**
```
http://localhost:3000/api/twitter/ingest
```

**PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/twitter/ingest" -Method GET
```

## ✅ What to Expect

### Success Response:
```json
{
  "success": true,
  "results": {
    "osirion_gg": {
      "processed": 5,
      "errors": 0
    },
    "KinchAnalytics": {
      "processed": 3,
      "errors": 0
    }
  },
  "summary": {
    "totalProcessed": 8,
    "totalErrors": 0,
    "users": 2,
    "tweetsFetched": 50
  }
}
```

## 📍 Where to Find Ingested Tweets

### 1. View via API Endpoint

**All Twitter memories:**
```
http://localhost:3000/api/memory/list?source=twitter&limit=20
```

**By specific user:**
```
http://localhost:3000/api/memory/list?source=twitter&author=osirion_gg&limit=10
http://localhost:3000/api/memory/list?source=twitter&author=KinchAnalytics&limit=10
```

**Response format:**
```json
{
  "success": true,
  "count": 10,
  "memories": [
    {
      "id": "...",
      "source": "twitter",
      "author": "osirion_gg",
      "content": "Tweet text here...",
      "createdAt": "2025-12-06T...",
      "timestamp": 1234567890
    }
  ]
}
```

### 2. Check Firestore Database

1. Go to: https://console.firebase.google.com/project/pathgen-v2/firestore

2. **`memories` collection:**
   - Contains all ingested tweets
   - Fields:
     - `source`: "twitter"
     - `author`: username (e.g., "osirion_gg")
     - `content`: tweet text
     - `createdAt`: timestamp
     - `timestamp`: Unix timestamp

3. **`twitter_last_tweet` collection:**
   - Tracks last processed tweet per user
   - Document IDs: usernames (lowercase)
   - Fields:
     - `lastTweetId`: last tweet ID processed
     - `updatedAt`: when it was last updated

### 3. Check Server Logs

In your dev server terminal, look for:
```
[TWITTER] Starting ingestion for users: KinchAnalytics, osirion_gg
[TWITTER] Apify actor run started: WlwPcD90RXWZAgshQ
[TWITTER] Apify run completed successfully
[TWITTER] Dataset retrieved: EHEeJdCrlh194Xbjw
[TWITTER] Fetched 45 tweets from dataset
[TWITTER] Completed osirion_gg: 5 processed, 0 errors
[TWITTER] Completed KinchAnalytics: 3 processed, 0 errors
```

## 🔍 Verification Checklist

- [ ] ✅ API returns success response
- [ ] ✅ Summary shows `tweetsFetched > 0`
- [ ] ✅ `totalProcessed` shows new tweets ingested
- [ ] ✅ Per-user breakdown shows processed counts
- [ ] ✅ `/api/memory/list?source=twitter` returns tweets
- [ ] ✅ Firestore `memories` collection has new documents
- [ ] ✅ Firestore `twitter_last_tweet` collection updated
- [ ] ✅ Server logs show completion messages

## 🐛 Troubleshooting

### Error: "APIFY_API_TOKEN not configured"
- Add `APIFY_API_TOKEN=your_token` to `apps/web/.env.local`
- Restart dev server

### Error: "Failed to start Apify run"
- Check if Apify API token is valid
- Verify you have Apify credits/usage available
- Check Apify dashboard for actor status

### Error: "Apify run timeout"
- Apify actor might be taking longer than 60 seconds
- Check Apify dashboard for run status
- Increase `maxAttempts` in code if needed

### No tweets processed (0 processed)
- All tweets might already be processed (check `twitter_last_tweet` collection)
- Users might not have recent tweets
- Tweets might be filtered out (retweets, replies, etc.)

### Tweets not appearing in `/api/memory/list`
- Check if ingestion was successful (`totalProcessed > 0`)
- Verify Firestore `memories` collection has documents
- Check if `source=twitter` filter is correct
- Verify Firestore permissions

## 📊 Expected Workflow

1. **First Run:**
   - Fetches up to 100 tweets per user from Apify
   - Processes all new tweets
   - Saves to `memories` collection
   - Updates `twitter_last_tweet` with newest tweet ID

2. **Subsequent Runs:**
   - Fetches recent tweets again
   - Only processes tweets newer than `lastTweetId`
   - Skips already-processed tweets

3. **Filtering:**
   - Skips retweets
   - Skips replies
   - Skips empty or very short tweets (< 10 chars)
   - Only processes meaningful content

## 🎯 Test Commands

**Full test:**
```powershell
.\scripts\test-twitter-ingest.ps1
```

**View ingested tweets:**
```powershell
# All Twitter memories
Invoke-RestMethod -Uri "http://localhost:3000/api/memory/list?source=twitter&limit=10"

# Specific user
Invoke-RestMethod -Uri "http://localhost:3000/api/memory/list?source=twitter&author=osirion_gg&limit=5"
```

**Check in browser:**
- Test endpoint: http://localhost:3000/api/twitter/ingest
- View memories: http://localhost:3000/api/memory/list?source=twitter&limit=20

