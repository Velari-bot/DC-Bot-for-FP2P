# Fix Gmail OAuth Setup

## Current Status
- ✅ OAuth Client Created: `PathGen Email Reader`
- ✅ Client ID: `113289613392-1dcak30a8s610evbgr1hf8jnu1tm10vk.apps.googleusercontent.com`
- ❌ Need to: Add redirect URI, get Client Secret, get refresh token

## Step 1: Add Redirect URI to OAuth Client

1. **Go to your OAuth client:**
   https://console.cloud.google.com/apis/credentials?project=pathgen-v2-479717

2. **Click on "PathGen Email Reader"** (the client name)

3. **In "Authorized redirect URIs" section, click "+ ADD URI"**

4. **Add this URI:**
   ```
   https://developers.google.com/oauthplayground
   ```
   (This is needed for OAuth Playground to work)

5. **Also add:**
   ```
   http://localhost:3000/api/email/gmail-callback
   ```
   (For your app)

6. **Click "SAVE"**

## Step 2: Get Client Secret

1. **In the same OAuth client page**, you should see:
   - Client ID (you already have this)
   - Client secret (click "SHOW" to reveal it)

2. **Copy the full Client Secret**

## Step 3: Get Refresh Token via OAuth Playground

1. **Go to:** https://developers.google.com/oauthplayground/

2. **Click the gear icon (⚙️)** in top right

3. **Check "Use your own OAuth credentials"**

4. **Enter:**
   - OAuth Client ID: `113289613392-1dcak30a8s610evbgr1hf8jnu1tm10vk.apps.googleusercontent.com`
   - OAuth Client secret: [paste your secret here]

5. **In the left panel**, scroll to **"Gmail API v1"**

6. **Select:** `https://www.googleapis.com/auth/gmail.readonly`

7. **Click "Authorize APIs"**

8. **Sign in with:** `jlbender2005@gmail.com`

9. **Click "Allow"**

10. **Click "Exchange authorization code for tokens"**

11. **Copy the "Refresh token"** - you'll need this!

## Step 4: Save Credentials

Add to `apps/web/.env.local`:

```bash
GMAIL_CLIENT_ID=113289613392-1dcak30a8s610evbgr1hf8jnu1tm10vk.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your_client_secret_here
GMAIL_REDIRECT_URI=http://localhost:3000/api/email/gmail-callback
```

## Step 5: Test

```bash
curl -X POST http://localhost:3000/api/email/gmail-reader \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "YOUR_REFRESH_TOKEN",
    "query": "is:unread",
    "max_results": 5
  }'
```

