# 🔍 Check Discord OAuth Errors - Step by Step

## Current Error

```
Discord OAuth failed: 401
message: 'invalid_client'
redirect_uri_used: 'https://pathgen.dev/setup.html'
```

## What This Means

The "invalid_client" error means Discord is rejecting the token exchange. This could be:

1. **Client secret is wrong or not loaded** ❌
2. **Redirect URI doesn't match what's in Discord** ❌

## Step 1: Check Vercel Server Logs

The code now has detailed logging. Check what the server sees:

1. Go to: https://vercel.com/dashboard
2. Click your project: **velari-bots-projects/pathgen**
3. Go to **Deployments** tab
4. Click on the **latest deployment**
5. Click **Functions** tab (or **Runtime Logs**)
6. Find `/api/discord/token` function
7. Click on it to see logs

Look for these log messages:
- `🔐 Discord OAuth - Client Secret exists: true` or `false`
- `🔐 Discord OAuth - Using redirect URI (EXACT): ...`
- `❌ Discord API error: ...`

**If you see `Client Secret exists: false`**, that's the problem! The environment variable isn't loading.

## Step 2: Verify Environment Variables

Check what's actually set in Vercel:

```powershell
cd apps/web
vercel env ls | Select-String "DISCORD"
```

You should see:
- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `DISCORD_REDIRECT_URI`

## Step 3: Verify Discord Redirect URI

Go to: https://discord.com/developers/applications

1. Select your app (Client ID: `1430744947732250726`)
2. Go to **OAuth2** → **Redirects**
3. **MUST have this EXACT URL:**

```
https://pathgen.dev/setup.html
```

**If it's not there, add it!**

## Step 4: Test the Client Secret

The client secret should be: `OjxmPipOHqCfVzZOIGqGVcHf3eUFXwWC`

To verify it's set correctly:

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

## Step 5: Check After Redeploy

After redeploy:
1. Test the login again
2. Check Vercel logs immediately
3. Look for the detailed log messages

## Common Issues

### Issue 1: Client Secret Not Loading

**Symptoms:**
- Logs show: `Client Secret exists: false`
- Error: `invalid_client`

**Fix:**
- Remove and re-add `DISCORD_CLIENT_SECRET` in Vercel
- Make sure it's set for **Production** environment
- Redeploy

### Issue 2: Redirect URI Not in Discord

**Symptoms:**
- Redirect URI is correct in logs
- But Discord rejects it

**Fix:**
- Go to Discord Developer Portal
- Add `https://pathgen.dev/setup.html` to redirects
- Save changes

### Issue 3: Wrong Client Secret Value

**Symptoms:**
- Client Secret exists: true
- But still gets invalid_client

**Fix:**
- Verify the value is exactly: `OjxmPipOHqCfVzZOIGqGVcHf3eUFXwWC`
- No spaces before/after
- Re-add it if needed

## Quick Checklist

- [ ] Check Vercel logs for `Client Secret exists: true`
- [ ] Verify `DISCORD_CLIENT_SECRET` is set in Vercel
- [ ] Verify `https://pathgen.dev/setup.html` is in Discord redirects
- [ ] Redeploy after any changes
- [ ] Test again

