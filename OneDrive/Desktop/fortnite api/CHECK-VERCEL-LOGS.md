# 🔍 Check Vercel Logs for Webhook Errors

## Critical: These Events Are Failing

- ❌ `checkout.session.completed` → 500 ERR
- ❌ `customer.subscription.created` → 500 ERR

## How to Find the Actual Error

### Step 1: Check Vercel Function Logs

1. Go to: https://vercel.com/velari-bots-projects/pathgen
2. Click **"Functions"** tab
3. Click on **`/api/stripe/webhook`**
4. Look for logs around **7:18 PM** (when the failures happened)
5. Look for:
   - `[ERROR]` messages
   - `[WEBHOOK]` messages
   - Stack traces
   - Firebase errors

### Step 2: Common Errors to Look For

**Error 1: Firebase Admin Not Initialized**
```
[ERROR] Firebase Admin initialization error
[ERROR] Firebase Admin db not initialized
```
**Fix**: Make sure `FIREBASE_PROJECT_ID` is set in Vercel environment variables

**Error 2: Firestore Permission Denied**
```
Permission denied
PERMISSION_DENIED
```
**Fix**: Check Firestore security rules allow server-side writes

**Error 3: Missing Environment Variable**
```
STRIPE_SECRET_KEY not set
STRIPE_WEBHOOK_SECRET not set
```
**Fix**: Add missing env vars in Vercel

**Error 4: Stripe API Error**
```
Failed to retrieve customer
Failed to retrieve subscription
```
**Fix**: Check Stripe API key is correct

**Error 5: User Creation Failed**
```
Error finding/creating user
Failed to create user document
```
**Fix**: Check Firestore permissions for `/users` collection

## Step 3: Share the Error

After checking logs, **copy and share**:
1. The exact `[ERROR]` message
2. The stack trace (if any)
3. Any Firebase-related errors

This will help us fix the exact issue!

---

**I've added extensive logging - the next deployment will show detailed error messages in Vercel logs.**

