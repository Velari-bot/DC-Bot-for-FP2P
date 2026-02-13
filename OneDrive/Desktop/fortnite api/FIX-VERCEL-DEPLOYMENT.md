# 🔧 Fix Vercel Deployment Error

## ❌ Error You're Seeing

```
Error: The provided path "~\OneDrive\Desktop\fortnite api\apps\web\apps\web" does not exist.
```

The path is duplicated (`apps/web/apps/web`) because:
- Root Directory is set in Vercel Dashboard to `apps/web`
- CLI is being run from `apps/web` directory
- Vercel combines both, causing duplication

---

## ✅ Solution: Deploy from Root Directory

**When Root Directory is set in Vercel Dashboard, always deploy from the root directory.**

### Step 1: Navigate to Root Directory

```powershell
cd "C:\Users\bende\OneDrive\Desktop\fortnite api"
```

### Step 2: Deploy from Root

```powershell
vercel --prod
```

**That's it!** Vercel will use the Root Directory setting from the dashboard.

---

## 🎯 Alternative Solutions

### Option 1: Use Vercel Dashboard (No CLI Needed)

1. **Push your code to Git:**
   ```powershell
   git add .
   git commit -m "Update webhook to Vercel"
   git push
   ```

2. **Vercel will auto-deploy:**
   - Go to: https://vercel.com/velari-bots-projects/pathgen/deployments
   - Or manually trigger: **Deployments** → **Redeploy**

### Option 2: Deploy from apps/web (Remove Root Directory Setting)

If you want to deploy from `apps/web`:

1. **Remove Root Directory in Dashboard:**
   - Go to: https://vercel.com/velari-bots-projects/pathgen/settings
   - **General** → **Root Directory**
   - Click **Edit** → Clear it → **Save**

2. **Then deploy:**
   ```powershell
   cd apps/web
   vercel --prod
   ```

**But Option 1 is recommended** (deploy from root).

---

## 📋 Quick Fix Steps

```powershell
# 1. Go to root directory
cd "C:\Users\bende\OneDrive\Desktop\fortnite api"

# 2. Deploy
vercel --prod
```

**That's all!** The Root Directory setting in Vercel Dashboard handles the rest.

---

## ✅ Summary

**Problem:** Path duplication when deploying from `apps/web` with Root Directory set  
**Solution:** Deploy from root directory instead  
**Quick Fix:** `cd` to root → `vercel --prod`

