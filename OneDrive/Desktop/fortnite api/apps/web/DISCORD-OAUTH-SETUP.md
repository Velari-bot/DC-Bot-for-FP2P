# Discord OAuth Setup Guide - Fixing "invalid_client" Error

## 🔴 Current Error
```
Discord OAuth failed: 401
message: 'invalid_client'
```

This error occurs when:
1. The Discord client secret is missing or incorrect in Vercel
2. The redirect URI doesn't match what's configured in Discord

## ✅ Solution

### Step 1: Set Environment Variables in Vercel

You need to set these 3 environment variables in your Vercel project:

#### Option A: Using Vercel Dashboard (Recommended)

1. Go to your Vercel project: https://vercel.com/dashboard
2. Click on your project → **Settings** → **Environment Variables**
3. Add these variables:

| Variable Name | Value | Sensitive? | Environments |
|--------------|-------|------------|--------------|
| `DISCORD_CLIENT_ID` | `1430744947732250726` | No | Production |
| `DISCORD_CLIENT_SECRET` | `OjxmPipOHqCfVzZOIGqGVcHf3eUFXwWC` | **Yes** | Production |
| `DISCORD_REDIRECT_URI` | `https://pathgen.dev/setup.html` | No | Production |

#### Option B: Using Vercel CLI

Run these commands from the `apps/web` directory:

```powershell
# Set Client ID
vercel env add DISCORD_CLIENT_ID production
# When prompted:
#   Value: 1430744947732250726
#   Mark as sensitive? No
#   Environments: Production

# Set Client Secret
vercel env add DISCORD_CLIENT_SECRET production
# When prompted:
#   Value: OjxmPipOHqCfVzZOIGqGVcHf3eUFXwWC
#   Mark as sensitive? Yes
#   Environments: Production

# Set Redirect URI
vercel env add DISCORD_REDIRECT_URI production
# When prompted:
#   Value: https://pathgen.dev/setup.html
#   Mark as sensitive? No
#   Environments: Production
```

### Step 2: Verify Discord Developer Portal Configuration

1. Go to: https://discord.com/developers/applications
2. Select your application (Client ID: `1430744947732250726`)
3. Go to **OAuth2** → **Redirects**
4. Make sure this EXACT URL is in the list:

```
https://pathgen.dev/setup.html
```

**Critical Requirements:**
- ✅ Must be EXACTLY: `https://pathgen.dev/setup.html`
- ✅ NO trailing slash (`/setup.html/` is wrong)
- ✅ Must be `https://` (not `http://`)
- ✅ Must be `pathgen.dev` (NOT `www.pathgen.dev`)
- ✅ Case-sensitive

5. If it's not there, click **Add Redirect** and paste the URL
6. Click **Save Changes**

### Step 3: Redeploy Your Vercel Project

After setting the environment variables, you need to redeploy:

#### Option A: Via Dashboard
1. Go to your Vercel project
2. Click **Deployments**
3. Click the **...** menu on the latest deployment
4. Click **Redeploy**

#### Option B: Via CLI
```powershell
cd apps/web
vercel --prod
```

### Step 4: Test the Login Flow

1. Go to https://pathgen.dev/login.html
2. Click **"Continue with Discord"**
3. You should be redirected to Discord
4. After authorizing, you should be redirected back to https://pathgen.dev/setup.html
5. Check the browser console for any errors

## 🔍 Verify Current Environment Variables

To check what's currently set in Vercel:

```powershell
cd apps/web
vercel env ls | Select-String "DISCORD"
```

## 🐛 Troubleshooting

### Still getting "invalid_client" error?

1. **Verify the redirect URI matches EXACTLY**
   - Check browser console - what redirect URI is being used?
   - It must match EXACTLY what's in Discord Developer Portal
   - Common issues:
     - `www.pathgen.dev` vs `pathgen.dev`
     - Trailing slash
     - `http://` instead of `https://`

2. **Check Vercel environment variables**
   ```powershell
   vercel env ls
   ```
   - Make sure all 3 Discord variables are set
   - Make sure they're set for the correct environment (Production)

3. **Verify client secret**
   - The client secret must be exactly: `OjxmPipOHqCfVzZOIGqGVcHf3eUFXwWC`
   - No extra spaces or quotes
   - Marked as sensitive in Vercel

4. **Wait for redeploy**
   - Environment variable changes require a redeploy
   - Wait 1-2 minutes after redeploy before testing

### Error: "Invalid OAuth2 redirect_uri"

This means the redirect URI in your code doesn't match what's in Discord:
- Check what redirect URI is being sent (see browser console)
- Add that EXACT URI to Discord Developer Portal
- Make sure there's no trailing slash

## 📋 Quick Checklist

- [ ] `DISCORD_CLIENT_ID` set in Vercel = `1430744947732250726`
- [ ] `DISCORD_CLIENT_SECRET` set in Vercel = `OjxmPipOHqCfVzZOIGqGVcHf3eUFXwWC`
- [ ] `DISCORD_REDIRECT_URI` set in Vercel = `https://pathgen.dev/setup.html`
- [ ] Redirect URI added in Discord Developer Portal = `https://pathgen.dev/setup.html`
- [ ] Project redeployed after setting variables
- [ ] Tested login flow

## 🎯 Expected Behavior

After fixing:
1. Click "Continue with Discord" → Redirects to Discord
2. Authorize → Redirects back to `https://pathgen.dev/setup.html`
3. Console shows: `✅ Discord OAuth successful`
4. User data stored in localStorage

