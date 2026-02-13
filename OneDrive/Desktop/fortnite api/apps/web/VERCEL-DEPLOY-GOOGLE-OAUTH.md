# Vercel Deployment - Google OAuth Setup

## ✅ Pre-Deployment Checklist

### 1. Environment Variables in Vercel

**Go to:** Vercel Dashboard → Your Project → Settings → Environment Variables

**Add these variables:**

```
GOOGLE_CLIENT_ID=64409929315-btl6nep70dnqnrg5ifif63ohkjklhkh1.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=pathgenforever
```

**Settings:**
- `GOOGLE_CLIENT_ID`: Mark as **non-sensitive** (it's public)
- `GOOGLE_CLIENT_SECRET`: Mark as **sensitive** (keep it secret!)
- Enable for: **Production**, **Preview**, **Development**

### 2. Google Cloud Console - Redirect URIs

**CRITICAL:** Make sure these redirect URIs are added in Google Cloud Console:

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your OAuth client: `64409929315-btl6nep70dnqnrg5ifif63ohkjklhkh1.apps.googleusercontent.com`
3. In "Authorized redirect URIs", add:
   - `https://pathgen.dev/setup.html` (production)
   - `http://localhost:3000/setup.html` (local dev - if needed)

4. Click **SAVE**

### 3. Deploy to Vercel

```bash
vercel --prod
```

Or push to your main branch (if auto-deploy is enabled).

### 4. Verify After Deployment

1. Go to: https://pathgen.dev/login.html
2. Click "Continue with Google"
3. Should redirect to Google sign-in
4. After authorization, should redirect back to `/setup.html`
5. Should create/login user successfully

## 🔍 Troubleshooting

### Error: "OAuth client was not found"
- ✅ Check redirect URI matches EXACTLY in Google Cloud Console
- ✅ Verify `GOOGLE_CLIENT_ID` is set in Vercel environment variables
- ✅ Make sure the OAuth client is in the correct Google Cloud project

### Error: "redirect_uri_mismatch"
- ✅ The redirect URI in Google Cloud Console must match EXACTLY
- ✅ Check for trailing slashes, http vs https, www vs non-www
- ✅ Production: `https://pathgen.dev/setup.html` (no trailing slash)

### Error: "invalid_client"
- ✅ Verify `GOOGLE_CLIENT_SECRET` is set correctly in Vercel
- ✅ Make sure it's marked as "sensitive" in Vercel
- ✅ Redeploy after adding environment variables

### Google Login Not Appearing
- ✅ Check browser console for errors
- ✅ Verify `GOOGLE_CLIENT_ID` is set in `login.html` (it's hardcoded)
- ✅ Check Vercel build logs for environment variable issues

## 📝 Current Configuration

- **Client ID:** `64409929315-btl6nep70dnqnrg5ifif63ohkjklhkh1.apps.googleusercontent.com`
- **Redirect URI (Production):** `https://pathgen.dev/setup.html`
- **Redirect URI (Local):** `http://localhost:3000/setup.html`
- **Scopes:** `openid email profile`

## ✅ After Deployment

1. Test Google login on production
2. Verify user creation in Firestore
3. Check Discord webhook notifications are sent
4. Confirm user can access the app after Google login
