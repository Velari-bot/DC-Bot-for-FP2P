# ⚡ Quick Test - Verify Webhooks Work

## 1-Minute Test

### Step 1: Make a Test Purchase
1. Go to your checkout page
2. Use test card: `4242 4242 4242 4242`
3. Complete purchase

### Step 2: Check Status (30 seconds later)

**Option A: Stripe Dashboard** (Fastest)
- https://dashboard.stripe.com/webhooks
- Look for ✅ **200 OK** on these events:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `invoice.paid`

**Option B: Vercel Logs**
- https://vercel.com/velari-bots-projects/pathgen
- Functions → `/api/stripe/webhook`
- Look for `[SUCCESS]` messages

**Option C: Firestore**
- https://console.firebase.google.com/project/pathgen-v2/firestore
- Check `users` and `subscriptions` collections

## ✅ Success = Webhooks Working!
## ❌ Failure = Check error messages in Stripe Dashboard

---

**Everything is deployed. Test now!** 🚀

