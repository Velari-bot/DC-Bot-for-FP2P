# 🔍 Diagnose Discord OAuth Error

## Current Status

Environment variables ARE set ✅:
- `DISCORD_CLIENT_ID` ✅
- `DISCORD_CLIENT_SECRET` ✅  
- `DISCORD_REDIRECT_URI` ✅

But you're still getting `invalid_client` error.

## Step 1: Check Vercel Logs (CRITICAL!)

The server logs will tell us what's wrong:

1. Go to: https://vercel.com/dashboard
2. Click: **velari-bots-projects/pathgen**
3. Go to **Deployments** tab
4. Click the **latest deployment** (the top one)
5. Click **Functions** tab
6. Find and click: `/api/discord/token`

Look for these log messages in the latest request:

### What to Look For:

**If you see:**
```
❌ Client Secret exists: false
```
→ **The environment variable isn't loading!** This is the problem.

**If you see:**
```
🔐 Discord OAuth - Client Secret exists: true
🔐 Discord OAuth - Using redirect URI (EXACT): https://pathgen.dev/setup.html
❌ Discord API error: 401
```
→ Client secret is loading, but Discord is rejecting it. This means:
- Wrong client secret value
- OR redirect URI not in Discord

## Step 2: Verify Redirect URI in Discord

Go to: https://discord.com/developers/applications

1. Select your app (Client ID: `1430744947732250726`)
2. Go to **OAuth2** → **Redirects**
3. Check if this EXACT URL is in the list:

```
https://pathgen.dev/setup.html
```

**If it's NOT there:**
1. Click **Add Redirect**
2. Paste: `https://pathgen.dev/setup.html`
3. Click **Save Changes**

**Important:** It must be EXACT:
- ✅ `https://pathgen.dev/setup.html`
- ❌ NOT `www.pathgen.dev`
- ❌ NO trailing slash
- ❌ NO http://

## Step 3: Verify Client Secret Value

The client secret should be exactly: `OjxmPipOHqCfVzZOIGqGVcHf3eUFXwWC`

To re-set it (if it might be wrong):

```powershell
cd apps/web
vercel env rm DISCORD_CLIENT_SECRET production --yes
echo "OjxmPipOHqCfVzZOIGqGVcHf3eUFXwWC" | vercel env add DISCORD_CLIENT_SECRET production
# When asked "Mark as sensitive?", type: y
```

Then redeploy:
```powershell
cd "C:\Users\bende\OneDrive\Desktop\fortnite api"
vercel --prod
```

## Step 4: Test Again

After checking logs and verifying:
1. Make sure redirect URI is in Discord
2. Re-set client secret if needed
3. Redeploy
4. Test login flow
5. Check logs again immediately

## Most Likely Issues

### Issue 1: Redirect URI Not in Discord
**Fix:** Add `https://pathgen.dev/setup.html` to Discord redirects

### Issue 2: Client Secret Wrong Value
**Fix:** Re-set it with the exact value: `OjxmPipOHqCfVzZOIGqGVcHf3eUFXwWC`

### Issue 3: Client Secret Not Loading
**Fix:** Check logs to confirm, then re-add the environment variable

## Quick Action Items

1. ✅ Check Vercel logs (most important!)
2. ✅ Verify redirect URI is in Discord
3. ✅ Re-set client secret if needed
4. ✅ Redeploy
5. ✅ Test again

