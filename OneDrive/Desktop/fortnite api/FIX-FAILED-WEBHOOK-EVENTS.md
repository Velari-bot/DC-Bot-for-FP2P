# 🚨 Fix Failed Webhook Events

## ❌ Events That Are Failing

These critical events are NOT being delivered to your webhook:

1. ❌ `checkout.session.completed` - **CRITICAL** - Needed to activate subscription
2. ❌ `customer.subscription.created` - **CRITICAL** - Creates subscription in Firestore
3. ❌ `invoice.paid` - **CRITICAL** - Resets usage limits

**These must work for subscriptions to activate!**

## ✅ Solution: Update Stripe Webhook Configuration

### Step 1: Check Current Webhook Settings

1. Go to: https://dashboard.stripe.com/webhooks
2. **Make sure you're in LIVE mode** (top right toggle)
3. Find your webhook endpoint
4. Check which events are selected

### Step 2: Update Webhook Endpoint URL

**Your current webhook is probably pointing to Firebase Functions, which is failing.**

1. **Click on your webhook** to edit it
2. **Update the endpoint URL to:**
   ```
   https://pathgen.dev/api/stripe/webhook
   ```
3. **Make sure these events are SELECTED:**
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.paid`
   - ✅ `invoice.payment_failed`

4. **Click "Update endpoint"**

### Step 3: Get New Webhook Secret

After updating the URL:

1. **Click on the webhook** you just updated
2. **Click "Reveal" next to "Signing secret"**
3. **Copy the secret** (starts with `whsec_...`)

### Step 4: Update Secret in Vercel

1. Go to: https://vercel.com/velari-bots-projects/pathgen/settings/environment-variables
2. Find `STRIPE_WEBHOOK_SECRET`
3. **Update it** with the new secret from Step 3
4. Make sure it's set for **Production**
5. **Save**

### Step 5: Redeploy Vercel

```powershell
vercel --prod
```

### Step 6: Test the Webhook

1. In Stripe Dashboard, go to your webhook
2. Click "Send test webhook"
3. Select: `customer.subscription.created`
4. Click "Send test webhook"
5. Check the deliveries tab - should see `200 OK`

## 🔍 Verify Events Are Being Received

After updating, make a test purchase and check:

1. **Stripe Dashboard → Webhooks → Your Webhook → Deliveries**
   - Should see `200 OK` for all events
   - If you see `400 ERR` or `500 ERR`, check Vercel logs

2. **Vercel Logs:**
   - Go to: https://vercel.com/velari-bots-projects/pathgen/logs
   - Look for webhook requests
   - Should see successful processing

3. **Firestore:**
   - Check `/users/{uid}` - should have `isPremium: true`
   - Check `/subscriptions/{uid}` - should exist with subscription data
   - Check `/usage/{uid}` - should have updated period dates

## 🚨 Why These Events Are Critical

- **`checkout.session.completed`**: Creates the subscription when checkout finishes
- **`customer.subscription.created`**: Activates premium access in Firestore
- **`invoice.paid`**: Resets usage limits on billing cycle renewal

**Without these, users pay but don't get premium access!**

---

## ⚡ Quick Checklist

- [ ] Webhook URL updated to `https://pathgen.dev/api/stripe/webhook`
- [ ] All 6 events are selected in Stripe
- [ ] New webhook secret copied from Stripe
- [ ] Webhook secret updated in Vercel environment variables
- [ ] Vercel redeployed
- [ ] Test webhook sent and shows `200 OK`
- [ ] Made test purchase and verified Firestore is updated

---

**After completing these steps, your subscriptions will activate correctly!** ✅

