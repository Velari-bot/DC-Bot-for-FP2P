# 🔧 Discord OAuth Final Fix - "invalid_client" Error

## 🔴 Current Problem

You're getting:
```
Discord OAuth failed: 401
message: 'invalid_client'
```

This happens because:
1. **Client secret might not be loaded** in Vercel environment
2. **Redirect URI mismatch** - Discord requires EXACT match
3. **www vs non-www** - Users might visit either domain

## ✅ Complete Fix Steps

### Step 1: Verify Environment Variables in Vercel

Check what's currently set:

```powershell
cd apps/web
vercel env ls | Select-String "DISCORD"
```

You should see:
- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`  
- `DISCORD_REDIRECT_URI`

### Step 2: Remove and Re-Add Variables with Correct Values

The variables exist but might have wrong values. Update them:

```powershell
# Remove old ones
vercel env rm DISCORD_CLIENT_ID production --yes
vercel env rm DISCORD_CLIENT_SECRET production --yes
vercel env rm DISCORD_REDIRECT_URI production --yes

# Add with correct values
echo "1430744947732250726" | vercel env add DISCORD_CLIENT_ID production
# When prompted "Mark as sensitive?", type: n

echo "OjxmPipOHqCfVzZOIGqGVcHf3eUFXwWC" | vercel env add DISCORD_CLIENT_SECRET production
# When prompted "Mark as sensitive?", type: y (YES!)

echo "https://pathgen.dev/setup.html" | vercel env add DISCORD_REDIRECT_URI production
# When prompted "Mark as sensitive?", type: n
```

### Step 3: Add BOTH Redirect URIs to Discord

**CRITICAL:** Discord requires the EXACT redirect URI that was used in authorization.

Go to: https://discord.com/developers/applications

1. Select your app (Client ID: `1430744947732250726`)
2. Go to **OAuth2** → **Redirects**
3. Add **BOTH** of these URLs (exact, case-sensitive):

```
https://pathgen.dev/setup.html
https://www.pathgen.dev/setup.html
```

**Why both?** Because:
- Users might visit `pathgen.dev` or `www.pathgen.dev`
- Discord requires EXACT match
- Having both ensures it works regardless of which domain is used

**Important:**
- ✅ NO trailing slash
- ✅ Must be `https://` (not `http://`)
- ✅ Exact case and spelling

### Step 4: Redeploy

After updating environment variables:

```powershell
cd apps/web
vercel --prod
```

### Step 5: Check Vercel Logs

After redeploy, check the Vercel function logs:
1. Go to Vercel Dashboard
2. Your project → **Deployments**
3. Click the latest deployment
4. Click **Functions** tab
5. Click `/api/discord/token`
6. Check the logs - you should see:
   - `🔐 Discord OAuth - Client ID: 1430744947732250726`
   - `🔐 Discord OAuth - Client Secret exists: true`
   - `🔐 Discord OAuth - Client Secret length: 32` (or similar)

If you see `Client Secret exists: false`, the environment variable isn't loading!

## 🐛 Troubleshooting

### Still getting "invalid_client"?

1. **Check Vercel logs** (see Step 5 above)
   - If Client Secret exists: false → Environment variable not loaded
   - If Client Secret exists: true but still fails → Wrong value or redirect URI mismatch

2. **Verify Discord redirect URIs**
   - Go to Discord Developer Portal
   - Check that BOTH URIs are added exactly as shown above
   - No extra spaces, trailing slashes, or www mismatches

3. **Test with exact redirect URI**
   - Check browser console - what redirect URI is being sent?
   - Make sure that EXACT URI is in Discord

4. **Double-check client secret**
   - Value should be: `OjxmPipOHqCfVzZOIGqGVcHf3eUFXwWC`
   - No spaces before/after
   - Marked as sensitive in Vercel

## 📋 Checklist

- [ ] `DISCORD_CLIENT_ID` = `1430744947732250726` in Vercel
- [ ] `DISCORD_CLIENT_SECRET` = `OjxmPipOHqCfVzZOIGqGVcHf3eUFXwWC` in Vercel (marked sensitive)
- [ ] `DISCORD_REDIRECT_URI` = `https://pathgen.dev/setup.html` in Vercel
- [ ] `https://pathgen.dev/setup.html` added to Discord redirects
- [ ] `https://www.pathgen.dev/setup.html` added to Discord redirects
- [ ] Project redeployed after updating variables
- [ ] Checked Vercel logs - Client Secret exists: true
- [ ] Tested login flow

## 🎯 What Changed in Code

I've updated the API route to:
- ✅ Use the EXACT redirect URI from the frontend (no normalization)
- ✅ Add better error logging to diagnose issues
- ✅ Log whether client secret exists (for debugging)

The key fix: **No more normalization** - Discord requires exact match!

