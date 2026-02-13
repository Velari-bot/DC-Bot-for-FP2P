# 🔧 Fix Vercel Deploy Error

## ❌ Error You're Seeing

```
Error: The provided path "~\OneDrive\Desktop\fortnite api\apps\web\apps\web" does not exist.
```

The path is duplicated (`apps/web/apps/web`) because:
- Root directory is set in Vercel Dashboard
- AND/OR there's a conflict with vercel.json configuration

## ✅ Solution: Deploy from Root Directory

When using the Vercel CLI, you should deploy from the **root directory** of your project, not from `apps/web`.

### Option 1: Deploy from Root (Recommended)

```powershell
# Go to root directory
cd "C:\Users\bende\OneDrive\Desktop\fortnite api"

# Deploy
vercel --prod
```

The root `vercel.json` is now minimal, and the Root Directory should be set in Vercel Dashboard to `apps/web`.

### Option 2: Deploy from apps/web (Alternative)

If you want to deploy from `apps/web`, you need to:

1. **Remove the rootDirectory from Vercel Dashboard:**
   - Go to: https://vercel.com/velari-bots-projects/pathgen/settings
   - Go to **General** → **Root Directory**
   - Click **Edit** → Clear it → **Save**

2. **Then deploy from apps/web:**
   ```powershell
   cd apps/web
   vercel --prod
   ```

### Option 3: Use Vercel Dashboard (Easiest)

Instead of using CLI, just:
1. Push your code to Git
2. Go to Vercel Dashboard
3. Your project will auto-deploy
4. Or manually trigger: Deployments → ... → Redeploy

## 🔧 What I Fixed

I removed `rootDirectory` from the root `vercel.json` because:
- Root Directory should be set in Vercel Dashboard (via Settings)
- Having it in both places causes path duplication

## 📋 Quick Steps

1. **Set Root Directory in Dashboard:**
   - Go to: https://vercel.com/velari-bots-projects/pathgen/settings
   - **General** → **Root Directory** = `apps/web`
   - Save

2. **Deploy from root:**
   ```powershell
   cd "C:\Users\bende\OneDrive\Desktop\fortnite api"
   vercel --prod
   ```

OR use the Vercel Dashboard to redeploy (no CLI needed).

