# ✅ Deployment Complete!

## 🎉 Success!

All your Firebase Functions have been deployed successfully!

### ✅ Functions Deployed:
- ✅ `onUserSignup` - User signup handler
- ✅ `sendMessage` - Message sending with usage limits
- ✅ `createConversation` - Conversation creation
- ✅ `stripeWebhook` - **Stripe webhook handler**
- ✅ `trackVoiceUsage` - Voice usage tracking
- ✅ `resetUsageOnRenewal` - Usage reset
- ✅ `pruneOldMessages` - Message cleanup (scheduled)
- ✅ `detectAbuse` - Abuse detection

---

## 🔗 Your Webhook URL

**Stripe Webhook URL:**
```
https://us-central1-pathgen-v2.cloudfunctions.net/stripeWebhook
```

**Copy this URL!** You'll need it to set up the Stripe webhook.

---

## 📋 Next Steps

### 1. Answer the Cleanup Policy Question

When prompted:
```
? How many days do you want to keep container images before they're deleted? (1)
```

**Answer:** Type `7` and press Enter
- This keeps images for 7 days (good for debugging)
- Or press Enter for 1 day (lowest cost)

### 2. Set Up Stripe Webhook

After deployment completes:

1. **Go to Stripe Dashboard:**
   - https://dashboard.stripe.com/webhooks
   - **Toggle to LIVE mode** (top right)

2. **Create Webhook:**
   - Click "Add endpoint"
   - URL: `https://us-central1-pathgen-v2.cloudfunctions.net/stripeWebhook`
   - Select events:
     - ✅ `customer.subscription.created`
     - ✅ `customer.subscription.updated`
     - ✅ `customer.subscription.deleted`
     - ✅ `invoice.paid`
     - ✅ `invoice.payment_failed`
     - ✅ `checkout.session.completed`
   - Click "Add endpoint"

3. **Copy the Signing Secret:**
   - Copy the `whsec_...` value

4. **Update Secret in Firebase:**
   ```powershell
   firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
   # Paste the whsec_... value
   # Mark as sensitive: y
   ```

5. **Redeploy Webhook:**
   ```powershell
   firebase deploy --only functions:stripeWebhook
   ```

---

## ✅ Your Functions Are Live!

All functions are deployed and ready to use. Just finish the webhook setup and you're done! 🚀

