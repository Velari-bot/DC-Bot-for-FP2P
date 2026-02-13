# 🔧 Fix 307 ERR - Webhook Redirect Issue

## ❌ Problem

Your webhook is getting **307 ERR** (Temporary Redirect) because:
- Webhook URL: `https://pathgen.dev/api/stripe/webhook` (no www)
- Checkout URL: `https://www.pathgen.dev/...` (with www)
- The domain is redirecting from non-www to www

## ✅ Solution: Use www Subdomain

### Step 1: Update Stripe Webhook URL

1. Go to: https://dashboard.stripe.com/webhooks
2. **Make sure you're in LIVE mode** (top right)
3. Find your webhook endpoint
4. Click to edit it
5. **Update the endpoint URL to:**
   ```
   https://www.pathgen.dev/api/stripe/webhook
   ```
   (Add `www.` before `pathgen.dev`)
6. Make sure these events are selected:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.paid`
   - ✅ `invoice.payment_failed`
7. **Save**

### Step 2: Test the Webhook

After updating:

1. In Stripe, click on the webhook
2. Click "Send test webhook"
3. Select: `customer.subscription.created`
4. Click "Send test webhook"
5. Check deliveries - should see **200 OK** instead of **307 ERR**

## 🔍 Why This Happens

Your domain `pathgen.dev` is likely configured to redirect to `www.pathgen.dev`. When Stripe sends a webhook to `pathgen.dev`, it gets redirected (307), which Stripe sees as an error.

**Solution:** Always use `www.pathgen.dev` for webhooks to match your domain configuration.

## ✅ Verify It's Fixed

After updating the URL:

1. Make a test purchase
2. Check Stripe Dashboard → Webhooks → Deliveries
3. Should see **200 OK** instead of **307 ERR**
4. Check Firestore - subscription should be created

---

**Update the webhook URL to use `www.pathgen.dev` and it will work!** ✅

