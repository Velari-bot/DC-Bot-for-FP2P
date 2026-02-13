# 🔍 Check Webhook Errors

## What to Check

The user said "everything failed now" but we need to see the actual error messages.

### Step 1: Check Stripe Dashboard

1. Go to: https://dashboard.stripe.com/webhooks
2. Click on your webhook: `https://www.pathgen.dev/api/stripe/webhook`
3. Click on a failed event (should show red ❌)
4. Click "View details" or expand the event
5. **Copy the error message** - this will tell us what's failing

### Step 2: Check Vercel Logs

1. Go to: https://vercel.com/velari-bots-projects/pathgen
2. Click on "Functions" tab
3. Click on `/api/stripe/webhook`
4. View the logs for recent errors

### Step 3: Check Specific Events

From your list, these events need to be handled:
- ✅ `checkout.session.completed` - Handled
- ✅ `customer.subscription.created` - Handled  
- ✅ `invoice.paid` - Handled
- ✅ `invoice.payment_succeeded` - Now handled (just added)

Events that are OK to ignore (not critical):
- `customer.discount.created` - Just logging
- `invoice.finalized` - Internal Stripe event
- `invoice.created` - Internal Stripe event
- `setup_intent.*` - Not needed for subscriptions
- `payment_method.*` - Not needed for subscriptions
- `promotion_code.*` - Just logging
- `customer.created` - Handled by checkout
- `customer.updated` - Not critical

## Common Errors

### 1. "User not found"
- **Fix**: Already handled with `findOrCreateUser`
- **If still failing**: Check Firebase credentials in Vercel

### 2. "Webhook signature verification failed"
- **Fix**: Update `STRIPE_WEBHOOK_SECRET` in Vercel
- **Get new secret**: Stripe Dashboard → Webhooks → Click webhook → Reveal secret

### 3. "Firebase Admin initialization error"
- **Fix**: Set `FIREBASE_PROJECT_ID` in Vercel environment variables

### 4. "Missing stripe-signature header"
- **Cause**: Request not coming from Stripe
- **Action**: Usually can be ignored for test requests

## Next Steps

1. **Share the actual error message** from Stripe Dashboard
2. **Check Vercel logs** for server-side errors
3. **Test with a new purchase** and see which events fail

The code is deployed and should handle the critical events. If specific events are failing, we need to see the error messages to fix them.

