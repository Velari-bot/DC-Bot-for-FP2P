# 🔧 URGENT: Fix Stripe Webhook Not Updating Firebase

## The Problem
Stripe webhooks aren't updating Firebase when subscriptions are purchased.

## Quick Fix Steps

### 1. Check Stripe Dashboard - Webhook Status

Go to: https://dashboard.stripe.com/webhooks

**Check these:**
- ✅ Make sure you're viewing **LIVE mode** (not Test mode)
- ✅ Webhook URL should be: `https://www.pathgen.dev/api/stripe/webhook`
- ✅ Status should be "Enabled"
- ✅ Events should include:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`

**Click on a recent purchase → View webhook deliveries:**
- If you see **500 ERR** → Firebase/Server error
- If you see **400 ERR** → Webhook secret mismatch
- If you see **307 ERR** → Wrong URL (redirect)

### 2. Check Vercel Environment Variables

Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables

**Verify these are set:**
1. `STRIPE_SECRET_KEY` = `sk_live_...`
2. `STRIPE_WEBHOOK_SECRET` = `whsec_...` (Get this from Stripe Dashboard → Webhooks → Reveal)
3. `GOOGLE_APPLICATION_CREDENTIALS_JSON` = Full JSON content (not file path)

### 3. Test Webhook Connection

Visit this diagnostic endpoint:
```
https://www.pathgen.dev/api/stripe/webhook/test
```

**Expected response:**
```json
{
  "status": "complete",
  "results": {
    "stripeSecretKey": { "exists": true },
    "webhookSecret": { "exists": true },
    "firebaseAdmin": { "initialized": true },
    "firestore": { "accessible": true }
  }
}
```

### 4. Check Vercel Logs

1. Go to Vercel Dashboard → Your Project
2. Click **Deployments** → Latest deployment
3. Click **Functions** tab
4. Click `api/stripe/webhook`
5. Click **Logs**

**Look for:**
- `[WEBHOOK] Received Stripe webhook: checkout.session.completed`
- `[ERROR] Failed to handle...`
- `[SUCCESS] Updated subscription for user...`

### 5. Common Fixes

#### Fix 1: Webhook Secret Wrong
1. Go to Stripe Dashboard → Webhooks
2. Click on your endpoint
3. Click "Reveal" next to "Signing secret"
4. Copy the secret (starts with `whsec_`)
5. In Vercel → Settings → Environment Variables
6. Update `STRIPE_WEBHOOK_SECRET`
7. Redeploy

#### Fix 2: Firebase Admin Not Working
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Copy the entire JSON content
4. In Vercel → Settings → Environment Variables
5. Set `GOOGLE_APPLICATION_CREDENTIALS_JSON` = (paste full JSON)
6. Redeploy

#### Fix 3: Webhook URL Wrong
1. In Stripe Dashboard → Webhooks
2. Update webhook URL to: `https://www.pathgen.dev/api/stripe/webhook`
3. Make sure no trailing slash
4. Save

## Deploying the Fix

I've added:
1. ✅ Diagnostic endpoint: `/api/stripe/webhook/test`
2. ✅ Better error logging in webhook handler
3. ✅ Detailed addon detection logging

**Next steps:**
1. Deploy these changes to Vercel
2. Test the diagnostic endpoint
3. Check Vercel logs after a purchase
4. Share the error messages with me

## What Changed

1. **Added diagnostic endpoint** - Tests if webhook can connect to Firebase
2. **Improved error logging** - Now logs detailed errors with stack traces
3. **Better addon detection** - Logs when addons are detected
4. **Error details** - Shows exactly why Firebase updates fail

Run this to deploy:
```powershell
.\deploy-vercel.ps1
```

