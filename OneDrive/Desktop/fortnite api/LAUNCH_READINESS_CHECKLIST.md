# 🚀 Launch Readiness Checklist - PathGen v2

## ⚠️ CRITICAL: Date Check Required

**IMPORTANT:** The launch date in the code is hardcoded as **December 12, 2025**. 

If you're launching on a different date, you need to update:
- `apps/web/app/api/stripe/webhook/route.ts` line 97: `LAUNCH_DATE = new Date('2025-12-12T00:01:00Z')`

The promotion logic:
- **"1 month free before February"** - Works until Feb 1, 2026 ✅
- **"Extra month for first 2 months"** - Works if launch date is Dec 12, 2025 ✅

---

## ✅ Core Functionality Status

### 1. Payment Processing (Stripe)
- ✅ Checkout creation endpoint: `/api/stripe/create-checkout`
- ✅ Webhook handler: `/api/stripe/webhook`
- ✅ Promotion logic: 1 month free before February
- ✅ Early bird bonus: Extra month for first 2 months
- ⚠️ **REQUIRED:** Stripe webhook must be configured in Stripe Dashboard
- ⚠️ **REQUIRED:** Environment variables must be set

**Required Environment Variables:**
```
STRIPE_SECRET_KEY=sk_live_... (or sk_test_... for testing)
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=https://pathgen.dev
```

### 2. User Authentication
- ✅ Discord OAuth login
- ✅ Google OAuth login
- ✅ Profile picture display
- ⚠️ **REQUIRED:** OAuth credentials in environment variables

**Required Environment Variables:**
```
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
DISCORD_REDIRECT_URI=https://pathgen.dev/api/discord/callback

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://pathgen.dev/api/google/callback
```

### 3. AI Chat System
- ✅ Text chat with comprehensive knowledge base
- ✅ Voice mode (with add-on)
- ✅ Image upload support (3/day for paid, 0 for free)
- ✅ Video recommendations in every response
- ✅ Usage limits enforced
- ⚠️ **REQUIRED:** OpenAI API key

**Required Environment Variables:**
```
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini (or gpt-4o for images)
OPENAI_VISION_MODEL=gpt-4o (for image analysis)
```

### 4. Usage Tracking
- ✅ Free tier: 5 messages/day
- ✅ Pro tier: 200 messages/month
- ✅ Image uploads: 3/day (paid), 0 (free)
- ✅ Voice limits: 60 min/month (with add-on)
- ✅ Daily/monthly reset logic

### 5. Database (Firestore)
- ✅ User collection
- ✅ Subscriptions collection
- ✅ Usage collection
- ⚠️ **REQUIRED:** Firebase Admin SDK credentials

**Required Environment Variables:**
```
GOOGLE_APPLICATION_CREDENTIALS_JSON={...} (Firebase Admin JSON as string)
```

---

## 🔍 Pre-Launch Verification Steps

### Step 1: Verify Environment Variables
Run this check in Vercel Dashboard:
1. Go to: Settings → Environment Variables
2. Verify all required variables are set for **Production**
3. Check that sensitive variables are marked as "Sensitive"

### Step 2: Test Stripe Webhook
1. Go to: https://dashboard.stripe.com/webhooks
2. Verify webhook endpoint: `https://pathgen.dev/api/stripe/webhook`
3. Test with a test payment
4. Check Firestore to verify subscription was created

### Step 3: Test Payment Flow
1. Go to: `/subscribe.html`
2. Select plan and add-ons
3. Complete checkout with test card: `4242 4242 4242 4242`
4. Verify:
   - ✅ Redirects to success page
   - ✅ User gets Pro access
   - ✅ Subscription appears in Firestore
   - ✅ Usage limits reset

### Step 4: Test Authentication
1. Test Discord login
2. Test Google login
3. Verify profile pictures display
4. Check user data in Firestore

### Step 5: Test AI Chat
1. Send a test message
2. Verify response includes video
3. Test image upload (if paid user)
4. Check usage limits are enforced

---

## 🐛 Known Issues to Check

### Issue 1: Launch Date Mismatch
**Problem:** Launch date is hardcoded as Dec 12, 2025
**Fix:** Update `LAUNCH_DATE` in webhook route if launching on different date

### Issue 2: Stripe Webhook Not Configured
**Problem:** Payments won't activate subscriptions
**Fix:** Create webhook in Stripe Dashboard pointing to `/api/stripe/webhook`

### Issue 3: Missing Environment Variables
**Problem:** Features won't work
**Fix:** Add all required variables to Vercel

---

## ✅ Launch Day Checklist

### Morning of Launch:
- [ ] Verify all environment variables are set
- [ ] Test a complete payment flow (test mode)
- [ ] Test Discord login
- [ ] Test Google login
- [ ] Test AI chat with a question
- [ ] Verify promotion banner shows on subscribe page
- [ ] Check Stripe webhook is active
- [ ] Verify Firebase connection

### During Launch:
- [ ] Monitor Vercel logs for errors
- [ ] Monitor Stripe dashboard for payments
- [ ] Monitor Firestore for new users/subscriptions
- [ ] Have Stripe dashboard open to verify payments

### Post-Launch:
- [ ] Verify first real payment activates subscription
- [ ] Check that early bird promotion applies correctly
- [ ] Monitor for any error reports

---

## 🚨 Emergency Contacts/Resources

- **Stripe Dashboard:** https://dashboard.stripe.com
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Firebase Console:** https://console.firebase.google.com
- **Vercel Logs:** Available in Vercel Dashboard → Your Project → Logs

---

## 📝 Quick Fixes if Issues Arise

### Payment Not Activating?
1. Check Stripe webhook logs
2. Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
3. Check Firestore for error logs

### AI Not Responding?
1. Verify `OPENAI_API_KEY` is set
2. Check OpenAI API usage/limits
3. Check Vercel function logs

### Authentication Not Working?
1. Verify OAuth redirect URIs match
2. Check OAuth credentials in environment variables
3. Verify callback URLs are correct

---

## ✅ Final Status

**Ready for Launch:** ⚠️ **CONDITIONAL**

**Blockers:**
1. ⚠️ Launch date may need updating if not Dec 12, 2025
2. ⚠️ All environment variables must be verified
3. ⚠️ Stripe webhook must be configured and tested

**Once these are verified, the app is ready to launch!** 🚀

