# 🚨 URGENT: Debug Webhook 500 Errors

## The Problem

Both critical events are returning **500 ERR**:
- `checkout.session.completed`
- `customer.subscription.created`

## What I've Done

✅ Added extensive logging with `[ERROR]`, `[INFO]`, `[SUCCESS]` prefixes  
✅ Added Firebase Admin initialization checks  
✅ Added stack trace logging  
✅ Improved error handling throughout

## Next Steps

### 1. Deploy the Updated Code

The code is ready with better logging. Deploy it:

```powershell
cd "C:\Users\bende\OneDrive\Desktop\fortnite api"
vercel --prod
```

### 2. Check Vercel Logs IMMEDIATELY After Next Failure

Go to: https://vercel.com/velari-bots-projects/pathgen

1. Click **"Functions"** → **`/api/stripe/webhook`**
2. Make a test purchase
3. Watch the logs in real-time
4. Look for `[ERROR]` messages

### 3. Most Likely Causes

**A. Firebase Admin Not Initialized**
- **Look for**: `[ERROR] Firebase Admin initialization error`
- **Fix**: Make sure `FIREBASE_PROJECT_ID=pathgen-v2` is set in Vercel

**B. Firestore Permission Denied**
- **Look for**: `Permission denied` or `PERMISSION_DENIED`
- **Fix**: Firestore security rules might be blocking server writes

**C. Missing Environment Variable**
- **Look for**: `STRIPE_SECRET_KEY not set` or `FIREBASE_PROJECT_ID not set`
- **Fix**: Add missing env vars in Vercel Dashboard

### 4. Quick Test

After deploying, check if Firebase is working:

1. Go to Vercel Logs
2. Look for: `[INFO] Firebase Admin Firestore initialized successfully`
3. If you DON'T see this, Firebase isn't initializing properly

## What to Share

After the next failure, share:
1. The **exact `[ERROR]` message** from Vercel logs
2. The **stack trace** (if shown)
3. Any **Firebase-related errors**

---

**Deploy now and check logs on the next purchase to see the actual error!**

