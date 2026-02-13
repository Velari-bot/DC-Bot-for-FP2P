# 🔍 Check Vercel Logs for Discord OAuth

## The Error

You're getting `invalid_client` error from Discord, but:
- ✅ Works locally (env variables are correct)
- ✅ Client ID is correct: `1430744947732250726`
- ✅ Redirect URI is being sent: `https://pathgen.dev/setup.html`
- ❌ But Discord is rejecting it

## Check Vercel Server Logs

The Vercel logs you showed only show the error, but we need to see what the server sees BEFORE the error.

### Step 1: View Full Function Logs

1. Go to: https://vercel.com/dashboard
2. Click: **velari-bots-projects/pathgen**
3. Go to **Deployments** → **Latest deployment**
4. Click **Functions** tab
5. Click **`/api/discord/token`**
6. Click on one of the failed requests (the POST requests with 401)
7. Look at the **full log output**

### What to Look For:

You should see logs like:
```
🔐 Discord OAuth - Received redirect URI from request: https://pathgen.dev/setup.html
🔐 Discord OAuth - Using redirect URI (EXACT): https://pathgen.dev/setup.html
🔐 Discord OAuth - Client ID: 1430744947732250726
🔐 Discord OAuth - Client Secret exists: true/false  ← THIS IS KEY!
🔐 Discord OAuth - Client Secret length: XX
```

**If you see:**
- `Client Secret exists: false` → The environment variable isn't loading!

**If you see:**
- `Client Secret exists: true` → The secret is loading, so the issue is likely the redirect URI not being in Discord

## Most Likely Issue: Redirect URI Not in Discord

Even though the redirect URI is being sent correctly, Discord rejects it if it's not registered.

### Fix: Add Redirect URI to Discord

1. Go to: https://discord.com/developers/applications
2. Select your app (Client ID: `1430744947732250726`)
3. Go to **OAuth2** → **Redirects**
4. **Check if this URL is in the list:**

```
https://pathgen.dev/setup.html
```

**If it's NOT there:**
1. Click **Add Redirect**
2. Paste: `https://pathgen.dev/setup.html`
3. Click **Save Changes**

## Verify Environment Variables Are Loading

Check if the client secret is actually being loaded in Vercel:

```powershell
cd apps/web
vercel env ls | Select-String "DISCORD_CLIENT_SECRET"
```

It should show the variable exists. But to verify it's loading in the function, check the logs (see Step 1 above).

## Quick Checklist

- [ ] Checked full Vercel function logs for "Client Secret exists" message
- [ ] Verified `https://pathgen.dev/setup.html` is in Discord redirects
- [ ] Verified environment variables exist in Vercel
- [ ] Redeployed after making changes

## If Client Secret Shows "exists: false"

If the logs show the client secret isn't loading:

1. Remove and re-add it:
```powershell
cd apps/web
vercel env rm DISCORD_CLIENT_SECRET production --yes
echo "OjxmPipOHqCfVzZOIGqGVcHf3eUFXwWC" | vercel env add DISCORD_CLIENT_SECRET production
# When asked "Mark as sensitive?", type: y
```

2. Redeploy:
```powershell
cd "C:\Users\bende\OneDrive\Desktop\fortnite api"
vercel --prod
```

3. Test again and check logs

