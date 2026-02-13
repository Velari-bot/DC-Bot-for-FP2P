# 🔧 Enable Google App Engine for Firebase Functions

## The Problem

Firebase Functions requires Google App Engine to be enabled in your project. This is a one-time setup.

## ✅ Solution: Enable App Engine

You have two options:

### Option 1: Via Google Cloud Console (Recommended)

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/appengine
   - Select project: **pathgen-v2**

2. **Create App Engine Application:**
   - Click "Create Application"
   - Select a **region** (choose `us-central` or closest to you)
   - Click "Create"
   - Wait 2-3 minutes for setup to complete

3. **Try Deployment Again:**
   ```powershell
   .\deploy-firebase-functions.ps1
   ```

---

### Option 2: Via Firebase Console

1. **Go to Firebase Console:**
   - Visit: https://console.firebase.google.com/project/pathgen-v2/overview

2. **Check Functions Page:**
   - Go to Functions section
   - If prompted to enable App Engine, click "Enable"

3. **Or via Settings:**
   - Go to Project Settings → General
   - Look for App Engine setup option

---

### Option 3: Via gcloud CLI (If Installed)

```powershell
gcloud app create --region=us-central
```

---

## 📍 Which Region?

Choose a region close to your users:
- **us-central** - Good for US users
- **us-east** - East Coast US
- **europe-west** - European users
- **asia-northeast** - Asian users

**Note:** Once set, the region cannot be changed easily.

---

## ✅ After Enabling App Engine

Once App Engine is enabled:

1. **Wait 2-3 minutes** for setup to complete
2. **Run deployment again:**
   ```powershell
   .\deploy-firebase-functions.ps1
   ```

---

## 🆘 Still Having Issues?

If you get permission errors:
1. Make sure you're the project owner
2. Check IAM permissions in Google Cloud Console
3. Contact Firebase support if issues persist

---

## 📋 Quick Checklist

- [ ] App Engine application created
- [ ] Region selected (us-central recommended)
- [ ] Setup completed (wait 2-3 minutes)
- [ ] Try deployment again
- [ ] Functions deploy successfully

---

**After App Engine is enabled, deployment will work!** 🚀

