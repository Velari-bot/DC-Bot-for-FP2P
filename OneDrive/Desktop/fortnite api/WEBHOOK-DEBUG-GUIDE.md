# 🔧 Stripe Webhook Debugging Guide

## Problem: Stripe isn't updating Firebase when you buy a subscription

This guide helps diagnose and fix webhook issues.

## Step 1: Check Webhook Configuration in Stripe Dashboard

1. Go to: https://dashboard.stripe.com/webhooks
2. Make sure you're viewing **LIVE mode** (not Test mode)
3. Check if there's a webhook endpoint pointing to:
   - `https://www.pathgen.dev/api/stripe/webhook` ✅ CORRECT
   - `https://pathgen.dev/api/stripe/webhook` (might redirect)
   - `https://us-central1-pathgen-v2.cloudfunctions.net/stripeWebhook` ❌ OLD (Firebase Functions)

4. Click on your webhook endpoint to view details
5. Check:
   - ✅ **Status**: Should be "Enabled"
   - ✅ **Events**: Should include:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `invoice.paid`
     - `invoice.payment_failed`
     - `customer.subscription.deleted`

## Step 2: Check Recent Webhook Deliveries

1. In Stripe Dashboard → Webhooks → Click on your endpoint
2. Scroll down to "Recent deliveries"
3. Look for recent purchases
4. Check the status:
   - ✅ **200 OK** = Webhook received and processed successfully
   - ❌ **400 ERR** = Bad request (signature verification failed)
   - ❌ **500 ERR** = Server error (Firebase/processing error)
   - ❌ **307 ERR** = Redirect (wrong URL)

5. Click on a failed delivery to see:
   - **Request**: What Stripe sent
   - **Response**: What your server returned
   - **Error message**: Why it failed

## Step 3: Check Vercel Logs

1. Go to: https://vercel.com/dashboard
2. Select your project: `pathgen-v2` (or similar)
3. Go to **Deployments** tab
4. Click on the latest deployment
5. Click **Functions** tab
6. Click on `api/stripe/webhook`
7. View **Logs** - Look for:
   - `[WEBHOOK] Received Stripe webhook: ...`
   - `[ERROR] Failed to handle ...`
   - `[SUCCESS] Updated subscription for user ...`

## Step 4: Test Webhook Connection

Visit this diagnostic endpoint:
```
https://www.pathgen.dev/api/stripe/webhook/test
```

This will show:
- ✅ Stripe Secret Key configured
- ✅ Webhook Secret configured
- ✅ Firebase Admin initialized
- ✅ Firestore accessible

**Expected response:**
```json
{
  "status": "complete",
  "results": {
    "stripeSecretKey": { "exists": true, "prefix": "sk_live" },
    "webhookSecret": { "exists": true, "prefix": "whsec_" },
    "firebaseAdmin": { "initialized": true },
    "firestore": { "accessible": true, "writable": true }
  }
}
```

## Step 5: Check Environment Variables in Vercel

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Verify these are set:

| Variable | Expected Value | Required |
|----------|---------------|----------|
| `STRIPE_SECRET_KEY` | `sk_live_...` | ✅ Yes |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | ✅ Yes |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | `{...}` (JSON) | ✅ Yes |

## Step 6: Get Webhook Secret from Stripe

1. Go to: https://dashboard.stripe.com/webhooks
2. Click on your webhook endpoint
3. Click **Reveal** next to "Signing secret"
4. Copy the secret (starts with `whsec_`)
5. Update in Vercel:
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Update `STRIPE_WEBHOOK_SECRET` with the new secret
   - Redeploy

## Step 7: Test with Stripe CLI (Local Testing)

```bash
# Install Stripe CLI
# Windows: Download from https://github.com/stripe/stripe-cli/releases

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to http://localhost:3000/api/stripe/webhook

# Trigger test webhook
stripe trigger checkout.session.completed
```

## Common Issues and Fixes

### Issue 1: Webhook Secret Mismatch
**Symptoms:**
- 400 ERR in Stripe Dashboard
- "Webhook signature verification failed" in logs

**Fix:**
1. Get the correct webhook secret from Stripe Dashboard
2. Update `STRIPE_WEBHOOK_SECRET` in Vercel
3. Redeploy

### Issue 2: Firebase Admin Not Initialized
**Symptoms:**
- 500 ERR in Stripe Dashboard
- "Could not load the default credentials" in logs

**Fix:**
1. Download Firebase Service Account JSON from:
   - Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
2. Copy the entire JSON content
3. In Vercel, set `GOOGLE_APPLICATION_CREDENTIALS_JSON` to the JSON string
4. Redeploy

### Issue 3: User Not Found
**Symptoms:**
- Webhook processes but user document doesn't update
- "User not found" in logs

**Fix:**
1. Check if user document exists in Firestore: `/users/{userId}`
2. Webhook should create user if not found (check logs)
3. Verify `userId` in checkout session metadata matches Firestore document ID

### Issue 4: Webhook URL Wrong
**Symptoms:**
- 307 ERR (redirect)
- Webhook never received

**Fix:**
1. Update webhook URL in Stripe Dashboard to: `https://www.pathgen.dev/api/stripe/webhook`
2. Make sure it's the **exact** URL (no trailing slash)

## Step 8: Manually Trigger Webhook (If Needed)

If webhooks aren't being sent:

1. Go to Stripe Dashboard → Webhooks → Your endpoint
2. Click "Send test webhook"
3. Select event type: `checkout.session.completed`
4. Click "Send test webhook"
5. Check Vercel logs to see if it was received

## Step 9: Check Firestore Rules

Make sure Firestore rules allow writes from Firebase Admin:

```javascript
// Firestore Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow server-side writes (Firebase Admin)
    match /users/{userId} {
      allow write: if request.auth == null; // Server-side writes
    }
    match /subscriptions/{userId} {
      allow write: if request.auth == null; // Server-side writes
    }
    match /usage/{userId} {
      allow write: if request.auth == null; // Server-side writes
    }
  }
}
```

## Still Not Working?

1. Check Vercel logs for specific errors
2. Check Stripe Dashboard webhook delivery details
3. Visit diagnostic endpoint: `https://www.pathgen.dev/api/stripe/webhook/test`
4. Verify all environment variables are set correctly
5. Make sure you're checking **LIVE mode** webhooks (not test mode)

## Need Help?

Share these details:
1. Stripe webhook delivery status (200/400/500?)
2. Error message from Stripe Dashboard
3. Vercel logs (from Functions tab)
4. Diagnostic endpoint response (`/api/stripe/webhook/test`)

