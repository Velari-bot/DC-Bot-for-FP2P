# 🚀 Quick Start: Update Stripe Webhook to Vercel

## ✅ What's Done

The Stripe webhook has been updated to work with Vercel! Here's what was created:

### Files Created:
- ✅ `apps/web/lib/firebase-admin.ts` - Firebase Admin initialization
- ✅ `apps/web/lib/constants.ts` - Constants and collections
- ✅ `apps/web/lib/types/firestore.ts` - TypeScript types
- ✅ `apps/web/app/api/stripe/webhook/route.ts` - Complete webhook handler

---

## 🔧 Quick Setup (3 Steps)

### Step 1: Install Firebase Admin

```powershell
cd apps/web
npm install firebase-admin
```

### Step 2: Update Stripe Webhook URL

1. Go to: https://dashboard.stripe.com/webhooks
2. **Toggle to LIVE mode** (top right)
3. Find webhook: `we_1SYsOPCitWuvPenEOZUevioU`
4. Update URL to: `https://your-domain.vercel.app/api/stripe/webhook`
   - Replace `your-domain.vercel.app` with your actual Vercel URL
5. Save

### Step 3: Deploy to Vercel

```powershell
vercel --prod
```

Or push to git (auto-deploys).

---

## ✅ What the Webhook Does

- ✅ Receives Stripe events
- ✅ Updates Firestore automatically
- ✅ Activates premium on subscription
- ✅ Resets usage on billing cycles
- ✅ Downgrades to free on cancellation

**Matches Firebase Functions functionality exactly!**

---

## 🎯 Next Steps

1. Install `firebase-admin`
2. Update Stripe webhook URL
3. Deploy to Vercel
4. Test with a subscription

**That's it!** 🎉

See `UPDATE-STRIPE-WEBHOOK-TO-VERCEL.md` for detailed instructions.

