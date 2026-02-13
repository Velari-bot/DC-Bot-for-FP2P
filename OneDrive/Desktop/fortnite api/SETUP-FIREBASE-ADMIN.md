# 🔥 Setup Firebase Admin for Vercel

## The Problem

**Nothing is being saved to Firestore** because Firebase Admin needs proper credentials to write.

## ✅ Solution: Add Service Account to Vercel

### Step 1: Get Service Account Key

1. Go to: https://console.firebase.google.com/project/pathgen-v2/settings/serviceaccounts/adminsdk
2. Click **"Generate new private key"**
3. Click **"Generate key"** in the dialog
4. **Download the JSON file** (e.g., `pathgen-v2-firebase-adminsdk-xxxxx.json`)

### Step 2: Add to Vercel Environment Variables

1. Go to: https://vercel.com/velari-bots-projects/pathgen/settings/environment-variables
2. Click **"Add New"**
3. Add:
   - **Name**: `GOOGLE_APPLICATION_CREDENTIALS_JSON`
   - **Value**: Open the downloaded JSON file, **copy the entire contents**, and paste it here
   - **Environment**: Select **Production**, **Preview**, and **Development**
   - **Mark as Sensitive**: ✅ Yes
4. Click **"Save"**

### Step 3: Redeploy

```powershell
cd "C:\Users\bende\OneDrive\Desktop\fortnite api"
vercel --prod
```

### Step 4: Verify

After deploying, check Vercel logs for:
- ✅ `[INFO] Firebase Admin initialized with service account JSON`
- ✅ `[INFO] Firebase Admin Firestore initialized successfully`

If you see errors, check:
- JSON was copied correctly (no extra spaces, valid JSON)
- Environment variable is set for the correct environment

## Alternative: Use Default Credentials (Simpler but Less Secure)

If you don't want to use a service account, make sure:
1. `FIREBASE_PROJECT_ID=pathgen-v2` is set in Vercel
2. Your Vercel project has access to Google Cloud (may require additional setup)

This is less secure but easier to set up.

---

## After Setup

Once Firebase Admin is properly configured:
- ✅ Webhooks will be able to write to Firestore
- ✅ User documents will be created
- ✅ Subscription documents will be created
- ✅ All writes will work!

**This is the most important fix - without proper Firebase Admin credentials, nothing can write to Firestore!**

