# 🔧 Quick Discord OAuth Fix - Redirect Error

## The Problem

Discord authorization works ✅, but token exchange fails ❌ with "invalid_client" error.

This means:
- Client ID is correct ✅
- Authorization flow works ✅  
- But token exchange fails ❌

## The Fix - 3 Simple Steps

### Step 1: Add Redirect URI to Discord (CRITICAL!)

Go to: https://discord.com/developers/applications

1. Select your app (Client ID: `1430744947732250726`)
2. Go to **OAuth2** → **Redirects**
3. Click **Add Redirect**
4. Add this EXACT URL:

```
https://pathgen.dev/setup.html
```

**IMPORTANT:**
- ✅ Must be EXACTLY: `https://pathgen.dev/setup.html`
- ✅ NO `www` (not `www.pathgen.dev`)
- ✅ NO trailing slash
- ✅ Must be `https://` (not `http://`)

5. Click **Save Changes**

### Step 2: Verify Environment Variables in Vercel

Make sure these are set correctly:

```powershell
cd apps/web
vercel env ls | Select-String "DISCORD"
```

You should see:
- `DISCORD_CLIENT_ID` = `1430744947732250726`
- `DISCORD_CLIENT_SECRET` = `OjxmPipOHqCfVzZOIGqGVcHf3eUFXwWC`
- `DISCORD_REDIRECT_URI` = `https://pathgen.dev/setup.html`

If they're wrong, update them:

```powershell
# Remove old ones
vercel env rm DISCORD_CLIENT_ID production --yes
vercel env rm DISCORD_CLIENT_SECRET production --yes
vercel env rm DISCORD_REDIRECT_URI production --yes

# Add correct values
echo "1430744947732250726" | vercel env add DISCORD_CLIENT_ID production
# When asked "Mark as sensitive?", type: n

echo "OjxmPipOHqCfVzZOIGqGVcHf3eUFXwWC" | vercel env add DISCORD_CLIENT_SECRET production
# When asked "Mark as sensitive?", type: y (YES!)

echo "https://pathgen.dev/setup.html" | vercel env add DISCORD_REDIRECT_URI production
# When asked "Mark as sensitive?", type: n
```

### Step 3: Redeploy

After updating Discord and/or environment variables:

```powershell
cd apps/web
vercel --prod
```

## Why This Fixes It

The "invalid_client" error during token exchange happens when:
1. ❌ Redirect URI in token exchange doesn't match what's registered in Discord
2. ❌ Client secret is wrong or not loaded

**The fix:**
- ✅ Add `https://pathgen.dev/setup.html` to Discord (exact match)
- ✅ Ensure client secret is set correctly in Vercel
- ✅ Redeploy so changes take effect

## Test It

1. Go to: https://pathgen.dev/login.html
2. Click "Continue with Discord"
3. Authorize
4. Should redirect back and work ✅

## Still Not Working?

Check Vercel logs after redeploy:
1. Vercel Dashboard → Your Project → Deployments
2. Click latest deployment → Functions
3. Click `/api/discord/token`
4. Look for these log messages:
   - `🔐 Discord OAuth - Client Secret exists: true` ← Should be true!
   - `🔐 Discord OAuth - Using redirect URI (EXACT): https://pathgen.dev/setup.html`

If Client Secret exists: false, the environment variable isn't loading!

