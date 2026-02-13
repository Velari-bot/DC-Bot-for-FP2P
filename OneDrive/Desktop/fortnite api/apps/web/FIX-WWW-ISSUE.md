# 🔧 Fix www vs non-www Redirect URI Issue

## 🔴 The Problem

You're seeing:
- **Current URL**: `https://www.pathgen.dev/setup.html` (with www)
- **Redirect URI sent**: `https://pathgen.dev/setup.html` (without www)
- **Error**: `invalid_client`

Discord is rejecting the token exchange because the redirect URI doesn't match what's registered.

## ✅ Solution: Add Both Redirect URIs to Discord

Since users might visit either `www.pathgen.dev` or `pathgen.dev`, add BOTH redirect URIs to Discord.

### Step 1: Add Redirect URIs to Discord

Go to: https://discord.com/developers/applications

1. Select your app (Client ID: `1430744947732250726`)
2. Go to **OAuth2** → **Redirects**
3. Add BOTH of these URLs:

```
https://pathgen.dev/setup.html
https://www.pathgen.dev/setup.html
```

**Important:**
- Add both URLs separately
- Must be EXACT (no trailing slash, exact case)
- Save changes after adding

### Step 2: Verify Vercel Environment Variables

Check that client secret is loading properly:

```powershell
cd apps/web
vercel env ls | Select-String "DISCORD"
```

Should show:
- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `DISCORD_REDIRECT_URI`

### Step 3: Check Vercel Logs

After adding redirect URIs and redeploying, check logs:

1. Go to: https://vercel.com/dashboard
2. Your project → Deployments → Latest
3. Functions → `/api/discord/token`
4. Look for:
   - `🔐 Discord OAuth - Client Secret exists: true` ✅

If it says `false`, the client secret isn't loading!

### Step 4: Redeploy

After adding redirect URIs to Discord:

```powershell
cd "C:\Users\bende\OneDrive\Desktop\fortnite api"
vercel --prod
```

## 🎯 Why This Works

Discord requires the redirect URI in token exchange to match EXACTLY what's registered. By adding both:
- `https://pathgen.dev/setup.html` ✅
- `https://www.pathgen.dev/setup.html` ✅

It will work regardless of which domain the user visits.

## 📋 Quick Checklist

- [ ] Added `https://pathgen.dev/setup.html` to Discord redirects
- [ ] Added `https://www.pathgen.dev/setup.html` to Discord redirects
- [ ] Saved changes in Discord
- [ ] Verified environment variables in Vercel
- [ ] Checked Vercel logs for client secret
- [ ] Redeployed after changes
- [ ] Tested login flow

## 🔍 Alternative: Redirect www to non-www

If you want to force all users to use non-www, you can set up a redirect in Vercel:

1. Go to Vercel Dashboard → Your Project → Settings
2. Go to **Domains**
3. Set up redirect from `www.pathgen.dev` → `pathgen.dev`

This ensures all users land on the non-www version, so you only need one redirect URI in Discord.

