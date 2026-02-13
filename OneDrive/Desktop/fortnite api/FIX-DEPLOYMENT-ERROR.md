# 🔧 Fix Deployment Error

## ❌ Current Error:
```
Could not authenticate 'service-...@gcf-admin-robot.iam.gserviceaccount.com': Not found
```

## ✅ Solution: Enable Google App Engine

Firebase Functions requires Google App Engine to be enabled. This is a **one-time setup**.

---

## 🚀 Quick Fix (2 Steps)

### Step 1: Enable App Engine

**Click this link:**
https://console.cloud.google.com/appengine?project=pathgen-v2

Or manually:
1. Go to: https://console.cloud.google.com
2. Select project: **pathgen-v2**
3. Go to: **App Engine** → **Create Application**
4. Select region: **us-central** (or closest to you)
5. Click **"Create"**
6. Wait 2-3 minutes for setup

### Step 2: Deploy Functions

```powershell
.\deploy-firebase-functions.ps1
```

---

## ✅ What's Already Fixed:

- ✅ Node.js 20 configured
- ✅ TypeScript errors fixed
- ✅ Stripe secrets configured
- ✅ Placeholder webhook secret created
- ✅ All functions code ready

---

## 🎯 After App Engine is Enabled:

Everything will deploy successfully! Then:

1. Get webhook URL from deployment
2. Create Stripe webhook
3. Update webhook secret
4. Redeploy webhook function

---

**Go enable App Engine, then try deployment again!** 🚀

