# 🔍 Diagnose Webhook Failures

## ❌ CRITICAL: These Events Failed

These events **MUST work** - they're critical for subscription activation:
- ❌ `checkout.session.completed`
- ❌ `customer.subscription.created`

## 🔍 How to Diagnose

### Step 1: Check Stripe Dashboard for Error Details

1. Go to: https://dashboard.stripe.com/webhooks
2. Click on your webhook endpoint
3. Find the failed events
4. Click on each failed event
5. **Copy the exact error message** - this tells us what's wrong

### Step 2: Check Vercel Logs

1. Go to: https://vercel.com/velari-bots-projects/pathgen
2. Click "Functions" → `/api/stripe/webhook`
3. Look for errors around 17:11 PM
4. Look for:
   - `[ERROR]` messages
   - Firebase Admin errors
   - "User not found" errors
   - Stack traces

### Step 3: Common Issues

**Issue 1: Firebase Admin Not Initialized**
- Error: "Firebase Admin initialization error"
- Fix: Make sure `FIREBASE_PROJECT_ID` is set in Vercel

**Issue 2: Firestore Permissions**
- Error: "Permission denied"
- Fix: Check Firestore security rules allow server writes

**Issue 3: User Creation Failing**
- Error: "User not found" or "Failed to create user"
- Fix: Check `findOrCreateUser` function is working

**Issue 4: Missing Environment Variables**
- Error: "STRIPE_SECRET_KEY not set" or "STRIPE_WEBHOOK_SECRET not set"
- Fix: Add missing env vars in Vercel

## 🚨 Next Steps

1. **Get the exact error message** from Stripe Dashboard
2. **Check Vercel logs** for detailed error info
3. **Share the error** so we can fix it

---

**These events are critical - we need to fix them immediately!**

