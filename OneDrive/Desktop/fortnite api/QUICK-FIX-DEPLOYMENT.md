# ⚡ Quick Fix: Enable App Engine

## The Error
```
Could not authenticate 'service-...@gcf-admin-robot.iam.gserviceaccount.com': Not found
```

## ✅ Fix: Enable App Engine

### Step 1: Go to Google Cloud Console

Open this URL:
**https://console.cloud.google.com/appengine?project=pathgen-v2**

### Step 2: Create App Engine Application

1. Click **"Create Application"**
2. Select region: **us-central** (recommended)
3. Click **"Create"**
4. Wait 2-3 minutes

### Step 3: Deploy Functions

```powershell
.\deploy-firebase-functions.ps1
```

---

## That's It! 🎉

After App Engine is enabled, your functions will deploy successfully.

---

**Quick Link:** https://console.cloud.google.com/appengine?project=pathgen-v2

