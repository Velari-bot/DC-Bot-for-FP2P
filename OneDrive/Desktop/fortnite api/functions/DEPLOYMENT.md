# PathGen Firebase Functions - Deployment Guide

## Prerequisites

1. **Firebase CLI** installed globally:
   ```bash
   npm install -g firebase-tools
   ```

2. **Node.js 20+** installed

3. **Firebase project** created at https://console.firebase.google.com
   - Project ID: `pathgen-v2`

4. **Stripe account** with API keys

## Initial Setup

### 1. Install Dependencies

```bash
cd functions
npm install
```

### 2. Login to Firebase

```bash
firebase login
```

### 3. Select Firebase Project

```bash
firebase use pathgen-v2
```

### 4. Set Stripe Configuration

#### Option A: Using Firebase Config (Legacy)

```bash
firebase functions:config:set stripe.secret_key="sk_test_..."
```

#### Option B: Using Environment Secrets (Recommended for v2 Functions)

```bash
firebase functions:secrets:set STRIPE_SECRET_KEY
# Paste your secret key when prompted

firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
# Paste your webhook secret when prompted
```

### 5. Initialize Global Config

Run the initialization script to create the global config document:

```bash
# First, download your Firebase Admin SDK key:
# 1. Go to Firebase Console → Project Settings → Service Accounts
# 2. Click "Generate New Private Key"
# 3. Save as functions/pathgen-v2-firebase-adminsdk.json

cd functions
npm run build
node lib/scripts/initGlobalConfig.js
```

Or manually create via Firebase Console:
1. Go to Firestore Database
2. Create collection: `config`
3. Create document: `global`
4. Add fields:
   - `freeMessageLimit`: 50 (number)
   - `freeVoiceLimit`: 300 (number)
   - `price_pro_monthly`: 9.99 (number)
   - `price_pro_yearly`: 99.99 (number)
   - `currentFortnitePatch`: "v30.00" (string)
   - `lastUpdated`: (timestamp)

### 6. Deploy Firestore Security Rules

```bash
firebase deploy --only firestore:rules
```

### 7. Deploy Firestore Indexes (if needed)

```bash
firebase deploy --only firestore:indexes
```

### 8. Build Functions

```bash
cd functions
npm run build
```

### 9. Deploy All Functions

```bash
firebase deploy --only functions
```

## Deploy Specific Functions

```bash
# Deploy single function
firebase deploy --only functions:onUserSignup

# Deploy multiple functions
firebase deploy --only functions:onUserSignup,functions:sendMessage
```

## Stripe Webhook Setup

After deploying functions, set up Stripe webhook:

1. **Get Webhook URL:**
   - After deployment, you'll get a URL like:
   - `https://us-central1-pathgen-v2.cloudfunctions.net/stripeWebhook`

2. **Create Webhook in Stripe Dashboard:**
   - Go to: https://dashboard.stripe.com/test/webhooks
   - Click "Add endpoint"
   - URL: Your function URL
   - Events to listen for:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.paid`
     - `invoice.payment_failed`

3. **Copy Webhook Signing Secret:**
   - Copy the `whsec_...` value
   - Set it as secret:
     ```bash
     firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
     ```

4. **Redeploy Webhook Function:**
   ```bash
   firebase deploy --only functions:stripeWebhook
   ```

## Testing Locally

### Start Emulators

```bash
firebase emulators:start
```

This starts:
- Functions emulator on port 5001
- Firestore emulator on port 8080
- Emulator UI on port 4000

### Test Functions

Functions will be available at:
- Local: `http://localhost:5001/pathgen-v2/us-central1/{functionName}`
- Webhook local: `http://localhost:5001/pathgen-v2/us-central1/stripeWebhook`

### Forward Stripe Webhooks to Local

```bash
stripe listen --forward-to localhost:5001/pathgen-v2/us-central1/stripeWebhook
```

## Monitoring

### View Logs

```bash
# All functions
firebase functions:log

# Specific function
firebase functions:log --only onUserSignup

# Tail logs
firebase functions:log --tail
```

### Firebase Console

- Functions Dashboard: https://console.firebase.google.com/project/pathgen-v2/functions
- Logs: Click on function → Logs tab

## Environment Variables Reference

| Variable | Description | Set Method |
|----------|-------------|------------|
| `STRIPE_SECRET_KEY` | Stripe secret API key | `firebase functions:secrets:set` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `firebase functions:secrets:set` |

## Troubleshooting

### "STRIPE_SECRET_KEY not configured"

Make sure you've set the secret:
```bash
firebase functions:secrets:set STRIPE_SECRET_KEY
```

### "Permission denied" errors

Check that:
1. Firestore security rules are deployed
2. User has proper authentication
3. Admin custom claims are set correctly

### Functions timeout

Increase timeout in function definition:
```typescript
export const myFunction = onCall(
  {
    timeoutSeconds: 540, // 9 minutes max
  },
  async (request) => {
    // ...
  }
);
```

### Build errors

Clear and rebuild:
```bash
cd functions
rm -rf lib node_modules
npm install
npm run build
```

## Production Checklist

- [ ] All functions deployed successfully
- [ ] Firestore security rules deployed
- [ ] Stripe secrets configured
- [ ] Stripe webhook created and tested
- [ ] Global config document initialized
- [ ] Functions logs monitored
- [ ] Test user signup flow
- [ ] Test message sending with usage limits
- [ ] Test Stripe subscription webhooks
- [ ] Test abuse detection

## Additional Resources

- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
