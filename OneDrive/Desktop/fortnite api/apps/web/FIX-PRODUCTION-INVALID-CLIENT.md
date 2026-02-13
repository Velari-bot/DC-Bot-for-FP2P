# 🔧 Fix "invalid_client" Error in Production

## The Problem

- ✅ Works on local dev server
- ✅ Environment variables are set in Vercel
- ❌ Getting `invalid_client` error from Discord in production

## Root Cause Analysis

The `invalid_client` error from Discord means ONE of these:
1. **Client secret is wrong or not loading** in Vercel
2. **Redirect URI is not registered** in Discord Developer Portal

## Step 1: Check Vercel Function Logs (CRITICAL!)

We need to see if the client secret is actually loading. The logs you showed don't include the debug logs.

1. Go to: https://vercel.com/dashboard
2. Click: **velari-bots-projects/pathgen**
3. Go to **Deployments** → **Latest deployment**
4. Click **Functions** tab
5. Click **`/api/discord/token`**
6. Click on one of the **failed POST requests** (the 401 errors)
7. Scroll through the **full log output**

**Look for these log lines:**

```
🔐 Discord OAuth - Client Secret exists: true/false
🔐 Discord OAuth - Client Secret length: XX
```

**If you see:**
- `Client Secret exists: false` → **THIS IS THE PROBLEM!** The env var isn't loading.
- `Client Secret length: 0` → Also means it's not loading.

**If you see:**
- `Client Secret exists: true` → Secret is loading, so issue is likely the redirect URI not in Discord.

## Step 2: Verify Redirect URI in Discord (MOST COMMON FIX)

The redirect URI **MUST** be registered in Discord, even if env vars are correct.

1. Go to: https://discord.com/developers/applications
2. Select your app (Client ID: `1430744947732250726`)
3. Go to **OAuth2** → **Redirects**
4. **Check if this EXACT URL is listed:**

```
https://pathgen.dev/setup.html
```

**If it's NOT there:**
1. Click **Add Redirect**
2. Paste: `https://pathgen.dev/setup.html`
3. Click **Save Changes**

**Also add (to handle www):**
```
https://www.pathgen.dev/setup.html
```

## Step 3: Verify Environment Variables

Check what's actually set in Vercel:

```powershell
cd apps/web
vercel env ls | Select-String "DISCORD"
```

You should see:
- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `DISCORD_REDIRECT_URI`

## Step 4: Re-Add Client Secret (If Logs Show It's Not Loading)

If the logs show `Client Secret exists: false`, remove and re-add it:

```powershell
cd apps/web

# Remove old one
vercel env rm DISCORD_CLIENT_SECRET production --yes

# Add with correct value
echo "OjxmPipOHqCfVzZOIGqGVcHf3eUFXwWC" | vercel env add DISCORD_CLIENT_SECRET production
# When prompted "Mark as sensitive?", type: y

# Verify it was added
vercel env ls | Select-String "DISCORD_CLIENT_SECRET"
```

## Step 5: Redeploy After Any Changes

After adding redirect URI to Discord or updating env vars:

```powershell
cd "C:\Users\bende\OneDrive\Desktop\fortnite api"
vercel --prod
```

## Why It Works Locally But Not in Production

1. **Local**: Uses `.env.local` file (you added the variables ✅)
2. **Production**: Uses Vercel environment variables (might not be loading)

## Quick Checklist

- [ ] Checked Vercel function logs for "Client Secret exists" message
- [ ] Verified `https://pathgen.dev/setup.html` is in Discord redirects
- [ ] Verified environment variables exist in Vercel
- [ ] Re-added client secret if logs show it's not loading
- [ ] Redeployed after making changes
- [ ] Tested login flow again

## Most Likely Fix

**90% of the time**, the issue is:
- The redirect URI `https://pathgen.dev/setup.html` is NOT in Discord Developer Portal

**Fix:** Add it to Discord → OAuth2 → Redirects

## If Still Not Working

After checking logs and adding redirect URI:
1. Share what the logs show for "Client Secret exists"
2. Confirm the redirect URI is in Discord
3. Check if you redeployed after making changes

