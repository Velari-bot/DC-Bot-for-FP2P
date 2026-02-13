# 🔧 Fix: STRIPE_WEBHOOK_SECRET Not Found

## The Problem

Firebase requires all secrets to exist before deployment. Since you haven't created the Stripe webhook yet, `STRIPE_WEBHOOK_SECRET` doesn't exist, causing deployment to fail.

## ✅ Solution: Create Placeholder Secret

Run this command to create a placeholder secret:

```powershell
.\create-placeholder-secrets.ps1
```

This creates a temporary placeholder secret that allows deployment.

## 📋 Steps to Fix:

### Step 1: Create Placeholder Secret
```powershell
.\create-placeholder-secrets.ps1
```

Or manually:
```powershell
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
# When prompted, paste: placeholder_update_after_webhook_creation
# Mark as sensitive: y
```

### Step 2: Deploy Functions
```powershell
.\deploy-firebase-functions.ps1
```

### Step 3: Create Stripe Webhook
1. Go to Stripe Dashboard → Webhooks (LIVE mode)
2. Create webhook with URL from deployment
3. Copy the signing secret (`whsec_...`)

### Step 4: Update Secret with Real Value
```powershell
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
# Paste the real whsec_... value
```

### Step 5: Redeploy Webhook
```powershell
firebase deploy --only functions:stripeWebhook
```

---

## Quick Fix (All in One)

```powershell
# 1. Create placeholder
echo "placeholder_update_after_webhook_creation" | firebase functions:secrets:set STRIPE_WEBHOOK_SECRET

# 2. Deploy
.\deploy-firebase-functions.ps1

# 3. After webhook is created, update the secret with real value
```

---

That's it! After creating the placeholder, deployment will work.

