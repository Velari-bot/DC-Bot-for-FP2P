# 🚨 URGENT: Fix Stripe Webhook - 400 ERR

## ❌ Current Problem

Stripe webhooks are **FAILING** with `400 ERR` because they're pointing to the old Firebase Functions endpoint:
- ❌ **Old (Broken):** `https://us-central1-pathgen-v2.cloudfunctions.net/stripeWebhook`
- ✅ **New (Vercel):** `https://pathgen.dev/api/stripe/webhook`

## ✅ Quick Fix (2 Steps)

### Step 1: Update Stripe Webhook URL

1. **Go to Stripe Dashboard:**
   - https://dashboard.stripe.com/webhooks
   - **Toggle to LIVE mode** (top right - make sure it says "Live mode")

2. **Find your webhook:**
   - Look for: `https://us-central1-pathgen-v2.cloudfunctions.net/stripeWebhook`
   - Click on it to edit

3. **Update the endpoint URL:**
   - **Change from:** `https://us-central1-pathgen-v2.cloudfunctions.net/stripeWebhook`
   - **Change to:** `https://pathgen.dev/api/stripe/webhook`
   - Click "Update endpoint"

4. **Select these events (make sure they're all checked):**
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.paid`
   - ✅ `invoice.payment_failed`

5. **Save the webhook**

### Step 2: Get New Webhook Secret

After updating the URL, Stripe will give you a new signing secret:

1. **Click on the webhook you just updated**
2. **Click "Reveal" next to "Signing secret"**
3. **Copy the secret** (starts with `whsec_...`)

4. **Update in Vercel:**
   - Go to: https://vercel.com/velari-bots-projects/pathgen/settings/environment-variables
   - Find `STRIPE_WEBHOOK_SECRET`
   - Update it with the new secret
   - Make sure it's set for **Production** environment
   - Click "Save"

5. **Redeploy:**
   ```powershell
   vercel --prod
   ```

## ✅ Verify It's Working

1. **In Stripe Dashboard:**
   - Go to the webhook you just updated
   - Click "Send test webhook"
   - Select: `customer.subscription.created`
   - Click "Send test webhook"

2. **Check the deliveries:**
   - Should see `200 OK` instead of `400 ERR`
   - If you see `200 OK`, it's working!

3. **Make a test purchase:**
   - Create a test subscription
   - Check Stripe webhook logs
   - Should see successful `200 OK` responses

## 🔍 Your Webhook Endpoint

**Your Vercel webhook URL is:**
```
https://pathgen.dev/api/stripe/webhook
```

This endpoint is already deployed and ready - you just need to point Stripe to it!

---

## 🚨 About Zapier

Zapier is showing `200 OK` because it's a connected platform (not your webhook). You can ignore it or disconnect it if you don't need it:

1. Go to: https://dashboard.stripe.com/settings/integrations
2. Find Zapier
3. Click "Disconnect" if you don't need it

---

**Do Step 1 and Step 2 above, and your webhooks will work!** ✅

