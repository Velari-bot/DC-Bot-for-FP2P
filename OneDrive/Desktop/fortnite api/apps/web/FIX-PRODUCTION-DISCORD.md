# 🔧 Fix Discord OAuth on Production Website

## ✅ Good News

It works on dev server! This means:
- ✅ Code is correct
- ✅ Local setup is correct
- ❌ Production configuration needs fixing

## 🔴 Common Production Issues

### Issue 1: Redirect URI Not in Discord

The production redirect URI must be registered in Discord Developer Portal.

**Fix:**
1. Go to: https://discord.com/developers/applications
2. Select your app (Client ID: `1430744947732250726`)
3. Go to **OAuth2** → **Redirects**
4. Make sure this EXACT URL is added:

```
https://pathgen.dev/setup.html
```

**Also add (for www):**
```
https://www.pathgen.dev/setup.html
```

Both must be added because users might visit either domain.

### Issue 2: Environment Variables Not Loading

Even though variables are set in Vercel, they might not be loading properly.

**Check:**
1. Go to: https://vercel.com/dashboard
2. Click: **velari-bots-projects/pathgen**
3. Go to **Deployments** → **Latest**
4. Click **Functions** → `/api/discord/token`
5. Look at the logs

**Look for:**
- `🔐 Discord OAuth - Client Secret exists: true` or `false`
- If it says `false`, the environment variable isn't loading!

### Issue 3: Wrong Redirect URI Being Sent

Production uses `https://pathgen.dev/setup.html`, but the code might be sending something else.

**Check browser console:**
- Look for: `📍 Using redirect URI for token exchange: ...`
- Make sure it says: `https://pathgen.dev/setup.html` (not www)

## ✅ Step-by-Step Fix

### Step 1: Verify Discord Redirect URIs

Go to Discord Developer Portal → OAuth2 → Redirects and ensure BOTH are added:

```
https://pathgen.dev/setup.html
https://www.pathgen.dev/setup.html
```

If missing, add them and save.

### Step 2: Check Vercel Environment Variables

```powershell
cd apps/web
vercel env ls | Select-String "DISCORD"
```

Should show:
- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `DISCORD_REDIRECT_URI`

### Step 3: Verify Environment Variable Values

Make sure they're set correctly:

```powershell
# Check what's set (values will be encrypted, but you can see names)
vercel env ls
```

If you need to update them, see `UPDATE-DISCORD-VARS.md`

### Step 4: Check Vercel Logs After Error

After trying to log in and getting the error:

1. Go to Vercel Dashboard
2. Your project → Deployments → Latest
3. Functions → `/api/discord/token`
4. Check the error logs

The logs will show:
- Whether client secret is loading
- What redirect URI is being used
- What Discord error message is returned

### Step 5: Redeploy After Changes

After adding redirect URIs to Discord or updating env vars:

```powershell
cd "C:\Users\bende\OneDrive\Desktop\fortnite api"
vercel --prod
```

Or redeploy from Vercel Dashboard.

## 🐛 Debugging Production

### Check What's Happening:

1. **Browser Console:**
   - Open: https://pathgen.dev/login.html
   - Open DevTools (F12)
   - Try logging in
   - Check console for error messages
   - Look for: `📍 Using redirect URI for token exchange: ...`

2. **Vercel Logs:**
   - Check function logs (see Step 4 above)
   - Look for detailed error messages
   - Check if client secret exists

3. **Network Tab:**
   - In DevTools → Network tab
   - Look for the request to `/api/discord/token`
   - Check the response - what error does it show?

## 📋 Quick Checklist

- [ ] `https://pathgen.dev/setup.html` added to Discord redirects
- [ ] `https://www.pathgen.dev/setup.html` added to Discord redirects (optional but recommended)
- [ ] Environment variables verified in Vercel
- [ ] Checked Vercel logs for errors
- [ ] Redeployed after making changes
- [ ] Tested login flow again

## 🔍 Most Likely Issue

Since it works locally, the most common production issues are:

1. **Redirect URI not in Discord** (90% of the time)
   - Fix: Add `https://pathgen.dev/setup.html` to Discord

2. **Environment variables not loading in Vercel**
   - Fix: Check logs, re-add variables if needed

3. **www vs non-www mismatch**
   - Fix: Add both redirect URIs to Discord

## Next Steps

1. First, verify the redirect URI is in Discord
2. Then check Vercel logs to see what error is happening
3. Share the error from Vercel logs so we can fix it!

