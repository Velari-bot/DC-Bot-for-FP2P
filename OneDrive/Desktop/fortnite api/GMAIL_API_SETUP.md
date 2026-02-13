# Gmail API Setup Guide for Email Memory Ingestion

This guide will help you set up Gmail API access so the system can automatically read and process emails for AI memory ingestion.

## 📋 Prerequisites

- Google Cloud Project with Gmail API enabled
- OAuth2 credentials (Client ID and Client Secret)
- Email account to read from (e.g., jlbender2005@gmail.com)

## 🚀 Step-by-Step Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Create Project** or select an existing project
3. Name it (e.g., "PathGen Email Reader")
4. Click **Create**

### Step 2: Enable Gmail API

1. In your Google Cloud project, go to **APIs & Services** → **Library**
2. Search for "Gmail API"
3. Click on **Gmail API**
4. Click **Enable**

### Step 3: Create OAuth2 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. If prompted, configure the OAuth consent screen:
   - Choose **External** (unless you have a Google Workspace)
   - Fill in app name: "PathGen Email Reader"
   - Add your email as support email
   - Add scopes: `https://www.googleapis.com/auth/gmail.readonly`
   - Add test users (your email address)
   - Save
4. Back to credentials:
   - Application type: **Web application**
   - Name: "PathGen Email Reader"
   - Authorized redirect URIs:
     - `http://localhost:3000/api/email/gmail-callback` (for local dev)
     - `https://your-domain.vercel.app/api/email/gmail-callback` (for production)
   - Click **Create**
5. **Save the Client ID and Client Secret** - you'll need these!

### Step 4: Set Environment Variables

Add these to your `.env.local` (local) or Vercel environment variables:

```bash
# Gmail API OAuth2 Credentials
GMAIL_CLIENT_ID=your_client_id_here
GMAIL_CLIENT_SECRET=your_client_secret_here
GMAIL_REDIRECT_URI=http://localhost:3000/api/email/gmail-callback
```

For production on Vercel:
```bash
GMAIL_REDIRECT_URI=https://your-domain.vercel.app/api/email/gmail-callback
```

### Step 5: Get OAuth2 Access Token

#### Option A: Using OAuth2 Playground (Easiest)

1. Go to [OAuth2 Playground](https://developers.google.com/oauthplayground/)
2. Click the gear icon (⚙️) in top right
3. Check "Use your own OAuth credentials"
4. Enter your **Client ID** and **Client Secret**
5. In the left panel, find **Gmail API v1**
6. Select: `https://www.googleapis.com/auth/gmail.readonly`
7. Click **Authorize APIs**
8. Sign in with your Gmail account (jlbender2005@gmail.com)
9. Click **Allow**
10. Click **Exchange authorization code for tokens**
11. **Copy the Refresh Token** - this is what you'll use!

#### Option B: Using the API Endpoint

1. Build the authorization URL:
```
https://accounts.google.com/o/oauth2/v2/auth?
  client_id=YOUR_CLIENT_ID
  &redirect_uri=http://localhost:3000/api/email/gmail-callback
  &response_type=code
  &scope=https://www.googleapis.com/auth/gmail.readonly
  &access_type=offline
  &prompt=consent
```

2. Open this URL in your browser
3. Sign in and authorize
4. You'll be redirected to `/api/email/gmail-callback?code=...`
5. The endpoint will return your `access_token` and `refresh_token`

### Step 6: Install Required Dependencies

```bash
cd apps/web
npm install googleapis
```

### Step 7: Test the Gmail Reader

You can now test the endpoint:

```bash
curl -X POST http://localhost:3000/api/email/gmail-reader \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "YOUR_REFRESH_TOKEN",
    "query": "is:unread",
    "max_results": 5,
    "process_memory": true
  }'
```

Or with access token:
```bash
curl -X POST http://localhost:3000/api/email/gmail-reader \
  -H "Content-Type: application/json" \
  -d '{
    "access_token": "YOUR_ACCESS_TOKEN",
    "query": "from:kinchanalytics@kinchanalytics.com",
    "max_results": 10
  }'
```

## 📧 Query Examples

The `query` parameter uses Gmail search syntax:

- `is:unread` - All unread emails
- `from:kinchanalytics@kinchanalytics.com` - Emails from specific sender
- `subject:"New Limits"` - Emails with specific subject
- `newer_than:7d` - Emails from last 7 days
- `is:unread from:updates@pathgen.gg` - Unread emails from PathGen

## 🔄 Automatic Email Processing

To automatically process emails, you can:

1. **Set up a cron job** (Vercel Cron, Cloud Functions, etc.)
2. **Use a webhook** from Gmail (requires Pub/Sub setup)
3. **Manual trigger** via API call

Example cron job (Vercel):
```json
{
  "crons": [{
    "path": "/api/email/gmail-reader",
    "schedule": "0 */6 * * *"
  }]
}
```

## 🔒 Security Notes

- **Never commit** your Client Secret or tokens to git
- Store tokens securely (environment variables, secrets manager)
- Refresh tokens don't expire (unless revoked), but access tokens expire in 1 hour
- The system automatically refreshes access tokens using refresh tokens

## 🐛 Troubleshooting

**"Invalid credentials" error:**
- Check that Client ID and Secret are correct
- Verify redirect URI matches exactly

**"Access denied" error:**
- Make sure your email is added as a test user in OAuth consent screen
- Check that Gmail API is enabled in your project

**"Token expired" error:**
- Use refresh_token instead of access_token
- The system will automatically refresh it

**No emails found:**
- Check your query syntax
- Verify you're using the correct Gmail account
- Try a simpler query like `is:unread`

## 📚 API Reference

### POST /api/email/gmail-reader

**Request Body:**
```json
{
  "access_token": "string (optional if refresh_token provided)",
  "refresh_token": "string (optional if access_token provided)",
  "query": "string (default: 'is:unread')",
  "max_results": "number (default: 10)",
  "process_memory": "boolean (default: true)"
}
```

**Response:**
```json
{
  "success": true,
  "totalMessages": 5,
  "processed": 5,
  "results": [
    {
      "messageId": "abc123",
      "sender": "kinchanalytics@kinchanalytics.com",
      "subject": "New Limits System",
      "status": "processed",
      "memory": "Pathgen now uses daily chat token limits..."
    }
  ]
}
```

---

**Ready to process emails automatically!** 🎉

