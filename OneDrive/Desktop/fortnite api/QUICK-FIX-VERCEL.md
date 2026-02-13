# ⚡ Quick Fix: Vercel Deployment Error

## ❌ Error

```
Error: The provided path "~\OneDrive\Desktop\fortnite api\apps\web\apps\web" does not exist.
```

## ✅ Solution

**Deploy from the root directory, not from `apps/web`.**

### Quick Fix:

```powershell
# Go to root directory
cd "C:\Users\bende\OneDrive\Desktop\fortnite api"

# Deploy
vercel --prod
```

**That's it!** 

Vercel already has Root Directory set to `apps/web` in the dashboard, so deploying from root works perfectly.

---

## 🎯 Why This Happens

- Root Directory is set in Vercel Dashboard: `apps/web`
- Deploying from `apps/web` causes path duplication: `apps/web/apps/web`
- Solution: Deploy from root, let Vercel use the dashboard setting

---

## 📋 Quick Command

I've created a script for you. Just run:

```powershell
.\deploy-vercel.ps1
```

Or manually:
```powershell
cd "C:\Users\bende\OneDrive\Desktop\fortnite api"
vercel --prod
```

**Done!** ✅

