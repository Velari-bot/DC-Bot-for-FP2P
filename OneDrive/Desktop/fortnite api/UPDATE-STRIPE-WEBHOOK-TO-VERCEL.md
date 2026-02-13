# 🔄 Update Stripe Webhook to Vercel

## ✅ What's Been Updated

The Stripe webhook route has been updated to work with Vercel and includes full Firestore integration matching the Firebase Functions implementation.

---

## 📋 Files Created/Updated

### ✅ New Files:
1. **`apps/web/lib/firebase-admin.ts`** - Firebase Admin SDK initialization
2. **`apps/web/lib/constants.ts`** - Constants (collections, limits)
3. **`apps/web/lib/types/firestore.ts`** - TypeScript types for Firestore

### ✅ Updated Files:
1. **`apps/web/app/api/stripe/webhook/route.ts`** - Complete webhook handler with Firestore updates
2. **`apps/web/tsconfig.json`** - Added path aliases

---

## 🔧 Setup Steps

### Step 1: Install Firebase Admin SDK

```powershell
cd apps/web
npm install firebase-admin
```

### Step 2: Set Environment Variables in Vercel

Go to your Vercel project → Settings → Environment Variables:

**Required Variables:**
- `STRIPE_SECRET_KEY` - Your Stripe secret key (already set)
- `STRIPE_WEBHOOK_SECRET` - Your webhook signing secret (already set)
- `FIREBASE_PROJECT_ID` - `pathgen-v2` (or your project ID)
- `GOOGLE_APPLICATION_CREDENTIALS` - Optional (for local dev with service account)

**For Vercel deployment, Firebase Admin will use default credentials automatically if:**
- Project is connected to Firebase
- Vercel has access to Google Cloud (via service account)

---

### Step 3: Update Stripe Webhook URL

1. **Go to Stripe Dashboard:**
   - https://dashboard.stripe.com/webhooks
   - **Toggle to LIVE mode** (top right)

2. **Find your webhook endpoint:**
   - Look for: `we_1SYsOPCitWuvPenEOZUevioU`
   - Or create a new endpoint

3. **Update the URL:**
   - **Old (Firebase Functions):** `https://us-central1-pathgen-v2.cloudfunctions.net/stripeWebhook`
   - **New (Vercel):** `https://your-domain.vercel.app/api/stripe/webhook`
   
   Replace `your-domain.vercel.app` with your actual Vercel deployment URL.

4. **Or add a second webhook endpoint:**
   - You can keep both Firebase Functions and Vercel webhooks
   - Both will receive events (redundancy)

5. **Save the webhook secret:**
   - If creating a new endpoint, copy the new `whsec_...` secret
   - Update `STRIPE_WEBHOOK_SECRET` in Vercel environment variables
   - Redeploy your Vercel app

---

### Step 4: Deploy to Vercel

```powershell
cd apps/web
vercel --prod
```

Or push to your git repository (Vercel auto-deploys on push).

---

## 🎯 What the Webhook Does

The updated webhook handler:

✅ **Receives Stripe events** - Verifies signatures  
✅ **Updates Firestore** - Syncs subscription data  
✅ **Handles events:**
- `customer.subscription.created` - Activates premium
- `customer.subscription.updated` - Updates subscription
- `customer.subscription.deleted` - Downgrades to free
- `invoice.paid` - Resets usage limits

✅ **Updates documents:**
- `/users/{uid}` - Sets `isPremium` and `activePlanId`
- `/subscriptions/{uid}` - Updates subscription status
- `/usage/{uid}` - Resets usage on billing cycle

---

## 🔄 Using Both Webhooks (Recommended)

You can use **both** Firebase Functions and Vercel webhooks:

**Firebase Functions:**
- Primary webhook handler
- Serverless, auto-scaling
- Already configured

**Vercel:**
- Backup/secondary webhook
- Same domain as your app
- Easier to debug

**Benefits:**
- Redundancy (if one fails, other handles it)
- Faster updates (webhooks process in parallel)
- Better monitoring (can compare both)

---

## 🧪 Testing

### Test the Webhook:

1. **Send a test event from Stripe:**
   - Go to Stripe Dashboard → Webhooks
   - Click on your webhook endpoint
   - Click "Send test webhook"
   - Select event: `customer.subscription.created`

2. **Check Vercel logs:**
   ```powershell
   vercel logs your-project-name
   ```

3. **Check Firestore:**
   - Go to Firebase Console → Firestore
   - Verify documents updated correctly

---

## 📝 Environment Variables Checklist

Make sure these are set in Vercel:

- [ ] `STRIPE_SECRET_KEY` - `sk_live_...`
- [ ] `STRIPE_WEBHOOK_SECRET` - `whsec_...`
- [ ] `FIREBASE_PROJECT_ID` - `pathgen-v2`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - `pathgen-v2` (optional)

---

## ✅ Summary

**What Changed:**
- ✅ Webhook route updated with full Firestore integration
- ✅ Firebase Admin SDK support added
- ✅ TypeScript types created
- ✅ Constants defined

**What You Need to Do:**
1. Install `firebase-admin`: `npm install firebase-admin`
2. Update Stripe webhook URL to point to Vercel
3. Deploy to Vercel
4. Test the webhook

**After Setup:**
- ✅ Webhooks will update Firestore automatically
- ✅ Subscriptions will sync in real-time
- ✅ Usage limits will reset on billing cycles

---

## 🚀 Next Steps

1. Install dependencies
2. Update Stripe webhook URL
3. Deploy to Vercel
4. Test with a real subscription

**Everything is ready to go!** 🎉

