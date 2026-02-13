# Twitter API v2 Setup Guide

## Credentials Needed

For **read-only tweet fetching** (what we're doing), you only need:
- **Bearer Token** (REQUIRED)

The other credentials are optional but can be saved for future use:
- API Key
- API Key Secret  
- Access Token
- Access Token Secret

## Adding to .env.local

### Option 1: Interactive Script (Recommended)
```powershell
cd apps/web
.\add-twitter-v2-env.ps1
```

### Option 2: Manual Setup

Add to `apps/web/.env.local`:

```env
# Twitter API v2 Credentials
TWITTER_BEARER_TOKEN=your_complete_bearer_token_here
TWITTER_API_KEY=adYjzZWnwvpq3g5seNUiWbiPR
TWITTER_API_KEY_SECRET=1vnpwgmOAEQnhcmMTpxnJG1Rlo7NPIObxF4NLYLWDlT3gm5jxy
TWITTER_ACCESS_TOKEN=1964728828405895168-6pnsTasbdtVMdEUAH6XglC6BVxKGVi
TWITTER_ACCESS_TOKEN_SECRET=Y2xKbQlaXjnaQ68zWvL1aG8uc7ZFqEy4dpQ7alVB3Bnsr
```

## Important Notes

1. **Bearer Token**: Make sure you copy the COMPLETE token. It should be a long string starting with `AAAA...`. If you see `%2` at the end, it's URL-encoded - the script will decode it automatically.

2. **Only Bearer Token Required**: For fetching tweets (read-only), only `TWITTER_BEARER_TOKEN` is needed. The other credentials are saved for potential future use (like posting tweets, etc.).

3. **Restart Dev Server**: After adding credentials, restart your Next.js dev server for changes to take effect.

## Testing

Test the endpoint:
```powershell
.\scripts\test-twitter-v2.ps1
```

Or directly:
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/twitter/v2-ingest" -Method Get
```

## Rate Limits

**Free Tier Limits:**
- 100 tweets per month
- The endpoint fetches up to 10 tweets per user (20 total per run)
- You can run it ~5 times per month safely

## Endpoint

The endpoint is available at:
- `GET /api/twitter/v2-ingest`
- `POST /api/twitter/v2-ingest`

## Features

✅ Uses official Twitter API v2
✅ Automatically excludes retweets and replies
✅ Only fetches original posts
✅ Deduplicates using `lastTweetId`
✅ Sends to `/api/memory/ingest`
✅ Updates Firestore with latest tweet IDs

