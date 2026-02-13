# 🔧 Fix Stripe Webhook - Update to Vercel Endpoint

## ❌ Current Problem

Your Stripe webhooks are **failing with 400 ERR** because they're still pointing to the old Firebase Functions endpoint:
- **Old (Failing):** `https://us-central1-pathgen-v2.cloudfunctions.net/stripeWebhook`
- **New (Vercel):** `https://yourdomain.com/api/stripe/webhook`

## ✅ Solution: Update Stripe Webhook Endpoint

### Step 1: Get Your Vercel Webhook URL

Your Vercel webhook endpoint should be:
```
https://your-production-domain.com/api/stripe/webhook
```

**Find your production domain:**
1. Go to: https://vercel.com/velari-bots-projects/pathgen/settings/domains
2. Look for your production domain (e.g., `pathgen.vercel.app` or custom domain)
3. Your webhook URL will be: `https://yourdomain.com/api/stripe/webhook`

### Step 2: Update Webhook in Stripe Dashboard

1. **Go to Stripe Dashboard:**
   - https://dashboard.stripe.com/webhooks
   - Make sure you're in **Live mode** (top right toggle)

2. **Find your existing webhook:**
   - Look for: `https://us-central1-pathgen-v2.cloudfunctions.net/stripeWebhook`
   - Click on it to edit

3. **Update the endpoint URL:**
   - Change from: `https://us-central1-pathgen-v2.cloudfunctions.net/stripeWebhook`
   - Change to: `https://your-vercel-domain.com/api/stripe/webhook`
   - Example: `https://pathgen-7by4j8le1-velari-bots-projects.vercel.app/api/stripe/webhook`

4. **Select events to listen for:**
   Make sure these events are selected:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.paid`
   - ✅ `invoice.payment_failed`

5. **Click "Add endpoint" or "Update endpoint"**

6. **Copy the Signing Secret:**
   - After creating/updating, click on the webhook
   - Click "Reveal" next to "Signing secret"
   - Copy the secret (starts with `whsec_...`)

### Step 3: Update Webhook Secret in Vercel

1. **Go to Vercel Dashboard:**
   - https://vercel.com/velari-bots-projects/pathgen/settings/environment-variables

2. **Update `STRIPE_WEBHOOK_SECRET`:**
   - Find `STRIPE_WEBHOOK_SECRET` environment variable
   - Update it with the new secret from Stripe
   - Make sure it's set for **Production** environment

3. **Redeploy:**
   - After updating, redeploy your Vercel project
   - Or Vercel will auto-redeploy if you have auto-deploy enabled

### Step 4: Test the Webhook

1. **In Stripe Dashboard:**
   - Go to the webhook you just updated
   - Click "Send test webhook"
   - Select: `customer.subscription.created`
   - Click "Send test webhook"

2. **Check Vercel Logs:**
   - Go to: https://vercel.com/velari-bots-projects/pathgen/logs
   - Look for the webhook request
   - Should see `200 OK` response

3. **Check Stripe Dashboard:**
   - In the webhook events list, you should see successful deliveries

## 🔍 Verify Webhook is Working

After updating:

1. **Make a test purchase** (or use Stripe test mode)
2. **Check Stripe Dashboard → Webhooks:**
   - Should see `200 OK` instead of `400 ERR`
3. **Check Vercel Function Logs:**
   - Should see successful webhook processing
4. **Check Firestore:**
   - User subscription should be updated
   - `/subscriptions/{uid}` document should exist
   - `/users/{uid}` should have `isPremium: true`

## ⚠️ Important Notes

- **Remove old Firebase webhook** after confirming Vercel webhook works
- **Keep both temporarily** if you want to test both
- **Webhook secret must match** - if it doesn't, you'll get 400 errors

## 🚨 Quick Fix Commands

If you have the Vercel CLI and know your domain:

```powershell
# 1. Update webhook secret (replace with your actual secret)
vercel env add STRIPE_WEBHOOK_SECRET production
# Paste: whsec_...

# 2. Redeploy
vercel --prod
```

Then update the webhook URL in Stripe Dashboard.

---

**Your Vercel webhook endpoint is already set up and ready - you just need to point Stripe to it!**

