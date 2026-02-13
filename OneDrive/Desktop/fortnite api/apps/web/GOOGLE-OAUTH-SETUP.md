# Google OAuth Setup Guide

## ✅ What's Been Added

- ✅ Google OAuth sign-in button on login page
- ✅ Google OAuth API endpoint (`/api/google/token`)
- ✅ Google OAuth callback handling in setup.html
- ✅ User creation and tracking (same as Discord)
- ✅ Discord webhook notifications for Google signups

## 🔧 Environment Variables Required

Add these to your Vercel environment variables:

### Google OAuth Credentials

1. **Go to Google Cloud Console:**
   - https://console.cloud.google.com/
   - Create a new project or select existing one
   - Enable Google+ API

2. **Create OAuth 2.0 Credentials:**
   - Go to: APIs & Services → Credentials
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: Web application
   - Authorized redirect URIs:
     - `https://pathgen.dev/setup.html`
     - `http://localhost:3000/setup.html` (for local dev)

3. **Add Environment Variables to Vercel:**
   ```bash
   # Google OAuth Client ID
   GOOGLE_CLIENT_ID=your_google_client_id_here
   
   # Google OAuth Client Secret
   GOOGLE_CLIENT_SECRET=your_google_client_secret_here
   ```

   **How to Set:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add `GOOGLE_CLIENT_ID` (mark as non-sensitive)
   - Add `GOOGLE_CLIENT_SECRET` (mark as sensitive)
   - Enable for: Production, Preview, Development

## 📝 Update Login Page

The login page (`apps/web/public/login.html`) has been updated with:
- Google sign-in button alongside Discord button
- Google OAuth flow initialization

**Note:** You may need to update the `GOOGLE_CLIENT_ID` in `login.html` if you want to use it client-side, or fetch it from your backend.

## 🔄 How It Works

1. **User clicks "Continue with Google"**
   - Redirects to Google OAuth consent screen
   - User authorizes access

2. **Google redirects back to `/setup.html`**
   - With authorization code in URL

3. **Setup page calls `/api/google/token`**
   - Exchanges code for access token
   - Fetches user info from Google
   - Creates user in Firestore (if new)
   - Sends Discord webhook notification

4. **User completes setup**
   - Same flow as Discord
   - User data stored in localStorage
   - Redirected to subscription page

## 📊 Tracking

Google signups are tracked exactly the same as Discord:
- ✅ User document created in Firestore
- ✅ Stripe customer created
- ✅ Subscription document created
- ✅ Discord webhook notification sent
- ✅ All usage limits initialized

## 🎯 Email Whitelist

All emails have been added to `apps/web/lib/email-whitelist.ts`.

You can check if an email is whitelisted:
```typescript
import { isEmailWhitelisted } from '@/lib/email-whitelist';

if (isEmailWhitelisted(userEmail)) {
  // User is whitelisted
}
```

## 🚀 Testing

1. **Set environment variables in Vercel**
2. **Redeploy:**
   ```bash
   cd apps/web
   vercel --prod
   ```

3. **Test Google OAuth:**
   - Go to `/login.html`
   - Click "Continue with Google"
   - Complete OAuth flow
   - Verify user created in Firestore
   - Check Discord webhook for notification

## ⚠️ Important Notes

- Google OAuth requires HTTPS in production
- Redirect URI must match exactly in Google Console
- Client secret must be kept secure (use environment variables)
- Both Discord and Google signups are tracked identically

## 📁 Files Created/Modified

- ✅ `apps/web/lib/email-whitelist.ts` - Email whitelist
- ✅ `apps/web/app/api/discord/token/route.ts` - Discord token endpoint
- ✅ `apps/web/app/api/google/token/route.ts` - Google token endpoint
- ✅ `apps/web/public/login.html` - Added Google button
- ✅ `apps/web/public/setup.html` - Added Google OAuth handling
