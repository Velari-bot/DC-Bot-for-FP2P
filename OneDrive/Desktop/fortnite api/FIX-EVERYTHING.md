# 🔧 Fix Everything - Quick Guide

## ✅ What I Fixed

1. **PowerShell Script** - Fixed syntax errors in `apps/web/fix-discord-oauth.ps1`
2. **Vercel Configuration** - Created proper `apps/web/vercel.json` and updated root `vercel.json`
3. **Documentation** - Created deployment fix guides

## 🚀 Quick Fix Steps

### Step 1: Fix Vercel Build Error

**The Problem:** Vercel can't detect Next.js because it's building from the root directory.

**The Solution:** Set the Root Directory in Vercel Dashboard.

1. Go to: https://vercel.com/dashboard
2. Click your project
3. **Settings** → **General** → **Root Directory**
4. Click **Edit**
5. Type: `apps/web`
6. Click **Save**
7. **Redeploy** (Deployments → ... → Redeploy)

### Step 2: Set Discord OAuth Environment Variables

**The Problem:** Discord OAuth fails with "invalid_client" error.

**The Solution:** Add environment variables in Vercel.

#### Option A: Vercel Dashboard (Easiest)

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add these 3 variables:

| Variable | Value | Sensitive? |
|----------|-------|------------|
| `DISCORD_CLIENT_ID` | `1430744947732250726` | No |
| `DISCORD_CLIENT_SECRET` | `OjxmPipOHqCfVzZOIGqGVcHf3eUFXwWC` | **Yes** |
| `DISCORD_REDIRECT_URI` | `https://pathgen.dev/setup.html` | No |

3. Make sure to select **Production** environment for each

#### Option B: Use the Script

```powershell
cd apps/web
.\fix-discord-oauth.ps1
```

### Step 3: Verify Discord Developer Portal

1. Go to: https://discord.com/developers/applications
2. Select your app (Client ID: `1430744947732250726`)
3. Go to **OAuth2** → **Redirects**
4. Make sure this EXACT URL is added:

```
https://pathgen.dev/setup.html
```

**Critical Requirements:**
- ✅ NO trailing slash
- ✅ Must be `https://` (not `http://`)
- ✅ Must be `pathgen.dev` (NOT `www.pathgen.dev`)

### Step 4: Redeploy Everything

After making changes, redeploy:

**Via Dashboard:**
- Deployments → ... → Redeploy

**Via CLI:**
```powershell
cd apps/web
vercel --prod
```

### Step 5: Test

1. Go to: https://pathgen.dev/login.html
2. Click **"Continue with Discord"**
3. Should redirect to Discord, then back to setup.html
4. Check browser console for any errors

## 📋 Files Changed

- ✅ `apps/web/fix-discord-oauth.ps1` - Fixed syntax errors
- ✅ `apps/web/vercel.json` - Created proper Vercel config
- ✅ `vercel.json` - Updated to point to root directory
- ✅ `apps/web/DISCORD-OAUTH-SETUP.md` - Complete Discord setup guide
- ✅ `apps/web/VERCEL-DEPLOY-FIX.md` - Vercel deployment fix guide

## 🐛 Troubleshooting

### Build Still Failing?

1. Check that Root Directory is set to `apps/web` in Vercel Dashboard
2. Verify `apps/web/package.json` has `"next": "^14.0.4"` (it does ✅)
3. Try redeploying again

### Discord OAuth Still Not Working?

1. Check environment variables are set in Vercel (Settings → Environment Variables)
2. Verify the redirect URI in Discord matches exactly: `https://pathgen.dev/setup.html`
3. Make sure you redeployed after setting environment variables

### Need More Help?

- See `apps/web/DISCORD-OAUTH-SETUP.md` for detailed Discord setup
- See `apps/web/VERCEL-DEPLOY-FIX.md` for detailed Vercel fix

## ✅ Checklist

- [ ] Root Directory set to `apps/web` in Vercel Dashboard
- [ ] Project redeployed after setting root directory
- [ ] Build succeeds (check deployment logs)
- [ ] `DISCORD_CLIENT_ID` environment variable set
- [ ] `DISCORD_CLIENT_SECRET` environment variable set
- [ ] `DISCORD_REDIRECT_URI` environment variable set
- [ ] Redirect URI added in Discord Developer Portal
- [ ] Project redeployed after setting environment variables
- [ ] Tested login flow

## 🎯 Expected Result

After completing all steps:
1. ✅ Vercel build succeeds
2. ✅ Next.js is detected and built properly
3. ✅ Discord OAuth works
4. ✅ Users can log in with Discord
5. ✅ Redirect flow works correctly

