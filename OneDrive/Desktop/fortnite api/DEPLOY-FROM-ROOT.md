# 🚀 Deploy to Vercel - Correct Method

## ⚠️ Important: Always Deploy from Root Directory

When the **Root Directory** is set to `apps/web` in Vercel Dashboard, you **must** deploy from the root directory, not from `apps/web`.

## ✅ Correct Deployment Method

```powershell
# 1. Navigate to root directory
cd "C:\Users\bende\OneDrive\Desktop\fortnite api"

# 2. Deploy
vercel --prod
```

## ❌ Wrong Method (Causes Errors)

```powershell
# DON'T do this when Root Directory is set in dashboard
cd apps/web
vercel --prod  # ❌ This will fail!
```

## 📋 Why This Happens

- **Root Directory in Dashboard:** Set to `apps/web`
- **Vercel expects:** Files relative to root, then applies Root Directory setting
- **When deploying from `apps/web`:** Vercel looks for `apps/web/apps/web/package.json` ❌
- **When deploying from root:** Vercel finds `apps/web/package.json` ✅

## 🔧 Alternative: Use Vercel Dashboard (Easiest)

Instead of using CLI:

1. **Push to Git:**
   ```powershell
   git add .
   git commit -m "Deploy updates"
   git push
   ```

2. **Vercel auto-deploys** or manually trigger:
   - Go to: https://vercel.com/velari-bots-projects/pathgen/deployments
   - Click **Redeploy** on latest deployment

## ✅ Summary

**Always deploy from root when Root Directory is set in dashboard!**

