# 🚀 Deploy to Vercel - Quick Guide

## Step 1: Set Environment Variables in Vercel

**Go to:** https://vercel.com/dashboard → Your Project → Settings → Environment Variables

**Add these:**

1. **GOOGLE_CLIENT_ID**
   - Value: `64409929315-btl6nep70dnqnrg5ifif63ohkjklhkh1.apps.googleusercontent.com`
   - Mark as: **Non-sensitive**
   - Environments: Production, Preview, Development

2. **GOOGLE_CLIENT_SECRET**
   - Value: `pathgenforever`
   - Mark as: **Sensitive**
   - Environments: Production, Preview, Development

## Step 2: Configure Google Cloud Console

**Go to:** https://console.cloud.google.com/apis/credentials

1. Click on OAuth client: `64409929315-btl6nep70dnqnrg5ifif63ohkjklhkh1.apps.googleusercontent.com`
2. In "Authorized redirect URIs", add:
   - `https://pathgen.dev/setup.html`
3. Click **SAVE**

## Step 3: Deploy

**Option A: Via Vercel CLI**
```bash
vercel --prod
```

**Option B: Via Git Push** (if auto-deploy enabled)
```bash
git push origin main
```

**Option C: Via Vercel Dashboard**
- Go to your project
- Click "Deployments"
- Click "Redeploy" on latest deployment

## Step 4: Test Google Login

1. Go to: https://pathgen.dev/login.html
2. Click "Continue with Google"
3. Should work! ✅

## ⚠️ Important Notes

- **Environment variables must be set BEFORE deploying** (or redeploy after adding them)
- **Redirect URI must match EXACTLY** in Google Cloud Console
- **Redeploy after adding environment variables** if they weren't set before
