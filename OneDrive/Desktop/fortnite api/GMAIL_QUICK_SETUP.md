# 🚀 Quick Gmail API Setup Guide

Follow these steps to set up Gmail API for email memory ingestion.

## Step 1: Enable Gmail API

1. **Open this link:**
   https://console.cloud.google.com/apis/library/gmail.googleapis.com?project=pathgen-v2-479717

2. **Click the "ENABLE" button** (if not already enabled)

## Step 2: Configure OAuth Consent Screen

1. **Open this link:**
   https://console.cloud.google.com/apis/credentials/consent?project=pathgen-v2-479717

2. **Fill in the form:**
   - User Type: **External** (click Continue)
   - App name: `PathGen Email Reader`
   - User support email: `jlbender2005@gmail.com`
   - Developer contact: `jlbender2005@gmail.com`
   - Click **Save and Continue**

3. **Add Scopes:**
   - Click **Add or Remove Scopes**
   - Search for: `https://www.googleapis.com/auth/gmail.readonly`
   - Check the box
   - Click **Update** → **Save and Continue**

4. **Add Test Users:**
   - Click **Add Users**
   - Enter: `jlbender2005@gmail.com`
   - Click **Add** → **Save and Continue**

5. **Review and go back to dashboard**

## Step 3: Create OAuth2 Credentials

1. **Open this link:**
   https://console.cloud.google.com/apis/credentials?project=pathgen-v2-479717

2. **Click "CREATE CREDENTIALS"** → **"OAuth client ID"**

3. **Fill in:**
   - Application type: **Web application**
   - Name: `PathGen Email Reader`
   - Authorized redirect URIs:
     - `http://localhost:3000/api/email/gmail-callback`
   - Click **CREATE**

4. **Copy your credentials:**
   - **Client ID** (looks like: `123456789-abc.apps.googleusercontent.com`)
   - **Client Secret** (click "Show" to reveal)

## Step 4: Run Setup Script

Run the PowerShell script to save credentials:

```powershell
.\setup-gmail-api.ps1
```

Or manually add to `apps/web/.env.local`:

```bash
GMAIL_CLIENT_ID=your_client_id_here
GMAIL_CLIENT_SECRET=your_client_secret_here
GMAIL_REDIRECT_URI=http://localhost:3000/api/email/gmail-callback
```

## Step 5: Get OAuth2 Refresh Token

### Option A: OAuth2 Playground (Easiest)

1. Go to: https://developers.google.com/oauthplayground/
2. Click the **gear icon (⚙️)** in top right
3. Check **"Use your own OAuth credentials"**
4. Enter your **Client ID** and **Client Secret**
5. In the left panel, scroll to **"Gmail API v1"**
6. Select: `https://www.googleapis.com/auth/gmail.readonly`
7. Click **"Authorize APIs"**
8. Sign in with `jlbender2005@gmail.com`
9. Click **"Allow"**
10. Click **"Exchange authorization code for tokens"**
11. **Copy the "Refresh token"** - this is what you need!

### Option B: Direct Authorization URL

1. Replace `YOUR_CLIENT_ID` in this URL:
```
https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:3000/api/email/gmail-callback&response_type=code&scope=https://www.googleapis.com/auth/gmail.readonly&access_type=offline&prompt=consent
```

2. Open the URL in your browser
3. Sign in and authorize
4. You'll be redirected to `http://localhost:3000/api/email/gmail-callback?code=...`
5. Copy the `code` parameter from the URL
6. Use it to get tokens (see API endpoint below)

## Step 6: Test the Gmail Reader

Once you have your refresh token, test the endpoint:

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

Or test with a specific sender:

```bash
curl -X POST http://localhost:3000/api/email/gmail-reader \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "YOUR_REFRESH_TOKEN",
    "query": "from:kinchanalytics@kinchanalytics.com",
    "max_results": 10
  }'
```

## ✅ You're Done!

The system will now:
- ✅ Read emails from Gmail
- ✅ Filter by allowed senders
- ✅ Process through AI memory worker
- ✅ Extract meaningful information

## 🔒 Security Notes

- **Never commit** `.env.local` to git (it's already in `.gitignore`)
- Keep your Client Secret and Refresh Token secure
- Refresh tokens don't expire unless revoked
- Access tokens expire in 1 hour (system auto-refreshes)

## 🐛 Troubleshooting

**"Invalid credentials"**
- Double-check Client ID and Secret
- Make sure redirect URI matches exactly

**"Access denied"**
- Verify your email is added as a test user
- Check OAuth consent screen is configured

**"Token expired"**
- Use refresh_token, not access_token
- System will auto-refresh

---

**Need help?** Check `GMAIL_API_SETUP.md` for detailed documentation.

