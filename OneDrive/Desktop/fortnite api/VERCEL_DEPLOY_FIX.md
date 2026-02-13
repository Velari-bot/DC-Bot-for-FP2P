# Vercel Deployment Fix

## The Issue

Vercel is trying to use `apps/web/apps/web` which means the root directory is set incorrectly in the Vercel dashboard.

## Solution

### Option 1: Set Root Directory in Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/velari-bots-projects/pathgen/settings)
2. Go to **Settings** → **General**
3. Find **Root Directory**
4. Set it to: `apps/web`
5. Click **Save**
6. Redeploy

### Option 2: Deploy from Root Directory

If you want to deploy from the root:

```powershell
cd "C:\Users\bende\OneDrive\Desktop\fortnite api"
vercel --prod --cwd apps/web
```

### Option 3: Deploy from apps/web (Current Setup)

The `apps/web/vercel.json` is already configured correctly. Just make sure:

1. Root Directory in Vercel Dashboard is set to `apps/web`
2. Or deploy using:
   ```powershell
   cd apps/web
   vercel --prod
   ```

## Current Configuration

- ✅ `apps/web/vercel.json` - Configured for Next.js
- ✅ Removed root `vercel.json` to avoid conflicts
- ✅ Fixed duplicate `unsubscribeUrl` variable in `apps/web/lib/email.ts`

## After Fixing

Once you set the root directory in the dashboard, run:

```powershell
cd apps/web
vercel --prod
```

Or just push to your Git repository and Vercel will auto-deploy.

