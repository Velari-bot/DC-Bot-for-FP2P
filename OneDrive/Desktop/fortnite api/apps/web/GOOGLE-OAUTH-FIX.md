# Google OAuth Setup - Fix "OAuth client was not found" Error

## ✅ What I've Fixed

1. ✅ Updated `login.html` with your Google Client ID
2. ✅ Environment variables need to be set (see below)

## 🔧 Required Setup Steps

### Step 1: Add Environment Variables

Add these to your `.env.local` file (local development) and Vercel environment variables (production):

```bash
GOOGLE_CLIENT_ID=64409929315-btl6nep70dnqnrg5ifif63ohkjklhkh1.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=pathgenforever
```

**For Vercel:**
1. Go to: Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add `GOOGLE_CLIENT_ID` (mark as non-sensitive - it's public)
3. Add `GOOGLE_CLIENT_SECRET` (mark as sensitive - keep it secret!)
4. Enable for: Production, Preview, Development
5. Redeploy your app

### Step 2: Configure Redirect URIs in Google Cloud Console

**CRITICAL:** The "OAuth client was not found" error usually means the redirect URI isn't configured.

1. **Go to Google Cloud Console:**
   - https://console.cloud.google.com/apis/credentials

2. **Find your OAuth 2.0 Client:**
   - Look for client ID: `64409929315-btl6nep70dnqnrg5ifif63ohkjklhkh1.apps.googleusercontent.com`
   - Click on it to edit

3. **Add Authorized Redirect URIs:**
   - Click "ADD URI" in the "Authorized redirect URIs" section
   - Add these URIs (one at a time):
     - `https://pathgen.dev/setup.html` (production)
     - `http://localhost:3000/setup.html` (local development)
     - `http://localhost:3000/api/google/token` (if needed)

4. **Click "SAVE"**

### Step 3: Verify OAuth Consent Screen

1. **Go to:** APIs & Services → OAuth consent screen
2. **Make sure:**
   - App is published (or you're added as a test user)
   - Scopes include: `openid`, `email`, `profile`
   - Support email is set

### Step 4: Test

1. **Restart your Next.js server** (if running locally)
2. **Go to:** `http://localhost:3000/login.html` (or `https://pathgen.dev/login`)
3. **Click "Continue with Google"**
4. **Should redirect to Google sign-in**

## 🔍 Troubleshooting

### Error: "OAuth client was not found"
- ✅ Check that redirect URI is EXACTLY `https://pathgen.dev/setup.html` (no trailing slash, exact match)
- ✅ Make sure the client ID matches in Google Cloud Console
- ✅ Verify the OAuth client is in the correct Google Cloud project

### Error: "redirect_uri_mismatch"
- ✅ The redirect URI in Google Cloud Console must match EXACTLY what's in the code
- ✅ Check for trailing slashes, http vs https, www vs non-www

### Error: "invalid_client"
- ✅ Verify `GOOGLE_CLIENT_SECRET` is set correctly in environment variables
- ✅ Make sure you're using the correct client secret (not the client ID)

## 📝 Current Configuration

- **Client ID:** `64409929315-btl6nep70dnqnrg5ifif63ohkjklhkh1.apps.googleusercontent.com`
- **Redirect URI:** `https://pathgen.dev/setup.html` (production) or `http://localhost:3000/setup.html` (local)
- **Scopes:** `openid email profile`

## ✅ Next Steps

1. Add environment variables to `.env.local` and Vercel
2. Configure redirect URIs in Google Cloud Console
3. Test the login flow
4. If it works locally, deploy to Vercel and test production
