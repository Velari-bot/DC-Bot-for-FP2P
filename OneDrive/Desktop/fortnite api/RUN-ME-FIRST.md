# 🚀 Run Me First - Firebase Functions Setup

## ⚡ Quick Instructions

**IMPORTANT:** Run these scripts from the **project root directory**, NOT from `apps/web`!

```powershell
# Make sure you're in the root directory
cd "C:\Users\bende\OneDrive\Desktop\fortnite api"

# Step 1: Setup
.\setup-firebase-functions.ps1

# Step 2: Set Stripe Secrets
.\set-stripe-secrets.ps1

# Step 3: Deploy
.\deploy-firebase-functions.ps1
```

---

## ✅ Fixed Issues

- ✅ Removed emoji characters that caused PowerShell parsing errors
- ✅ All scripts now use plain text indicators ([OK], [ERROR], [WARNING])
- ✅ Scripts are ready to run from project root

---

## 📍 Current Directory

Make sure you're in:
```
C:\Users\bende\OneDrive\Desktop\fortnite api
```

**NOT in:**
- ❌ `apps/web`
- ❌ Any subdirectory

---

## 🎯 What Each Script Does

### 1. setup-firebase-functions.ps1
- Checks/installs Firebase CLI
- Logs into Firebase
- Sets project to pathgen-v2
- Installs function dependencies
- Builds functions

### 2. set-stripe-secrets.ps1
- Sets STRIPE_SECRET_KEY in Firebase
- Prompts for webhook secret (set after deployment)

### 3. deploy-firebase-functions.ps1
- Builds functions
- Deploys to Firebase
- Shows webhook URL

---

## 🆘 If Scripts Still Don't Work

### Check Current Directory
```powershell
pwd
# Should show: C:\Users\bende\OneDrive\Desktop\fortnite api
```

### If Not in Root, Navigate There:
```powershell
cd "C:\Users\bende\OneDrive\Desktop\fortnite api"
```

### Run Scripts with Full Path (if needed):
```powershell
& "C:\Users\bende\OneDrive\Desktop\fortnite api\setup-firebase-functions.ps1"
```

---

## ✅ Ready to Run!

All scripts are fixed and ready. Start with step 1!

