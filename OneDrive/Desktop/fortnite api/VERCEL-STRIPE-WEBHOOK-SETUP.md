# 🚀 Stripe Webhook Setup for Vercel

## ⚠️ Important Note

The "test secret key" you provided starts with `pk_test_`, which is actually a **public key**. Secret keys start with `sk_test_` or `sk_live_`. You'll need to get your actual secret key from the Stripe Dashboard.

---

## 📋 Step-by-Step Setup

### **Step 1: Get Your Stripe Keys**

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Copy your keys:
   - **Secret Key**: `sk_test_...` (starts with `sk_test_`)
   - **Public Key**: `pk_test_...` (you already have this)
3. Keep these secure - never commit them to git!

---

### **Step 2: Add Stripe to Your API**

First, install Stripe:

```bash
cd fortnite-core/packages/api
npm install stripe
```

---

### **Step 3: Create Webhook Endpoint in Your API**

Add this to `fortnite-core/packages/api/src/index.ts`:

```typescript
import Stripe from 'stripe';

// Initialize Stripe (add this near the top, after imports)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

// IMPORTANT: Webhook endpoint must use raw body
// Add this BEFORE express.json() middleware
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not set');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('✅ Checkout completed:', session.id);
        
        // Get metadata
        const userId = session.metadata?.userId;
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;

        if (userId && subscriptionId) {
          // TODO: Update Firebase subscription
          console.log('User ID:', userId);
          console.log('Subscription ID:', subscriptionId);
          console.log('Customer ID:', customerId);
        }
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('✅ Subscription created:', subscription.id);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('✅ Subscription updated:', subscription.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('✅ Subscription canceled:', subscription.id);
        // TODO: Downgrade user to free plan
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('✅ Payment succeeded:', invoice.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('⚠️ Payment failed:', invoice.id);
        // TODO: Notify user of failed payment
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Create Checkout Session endpoint
app.post('/api/stripe/create-checkout', express.json(), async (req, res) => {
  try {
    const { planType, userId, userEmail } = req.body;

    if (!planType || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Use your price ID
    const priceId = 'price_1RvsvqCitWuvPenEw9TefOig';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId, // Use your price ID directly
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pricing?canceled=true`,
      customer_email: userEmail,
      metadata: {
        userId: userId,
        planType: planType || 'pro',
      },
    });

    res.json({
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session', details: error.message });
  }
});
```

**Important:** The webhook endpoint must be added **BEFORE** `app.use(express.json())` because it needs the raw body for signature verification.

---

### **Step 4: Configure Vercel Environment Variables**

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add these variables:

```
STRIPE_SECRET_KEY=sk_test_... (your actual secret key)
STRIPE_WEBHOOK_SECRET=whsec_... (you'll get this after creating webhook)
STRIPE_PUBLISHABLE_KEY=pk_test_51RvMs4E1WEiMuZnC... (your public key)
FRONTEND_URL=https://yourdomain.com (your Vercel deployment URL)
```

4. Make sure to add them for **Production**, **Preview**, and **Development** environments
5. Redeploy your application after adding variables

---

### **Step 5: Deploy to Vercel**

If you haven't already, deploy your API:

1. Make sure you have a `vercel.json` in your project root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "fortnite-core/packages/api/src/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "fortnite-core/packages/api/src/index.ts"
    }
  ]
}
```

2. Or if using a monorepo structure, you might need:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "api/index.ts"
    }
  ]
}
```

3. Deploy:
   ```bash
   vercel --prod
   ```

4. Your API will be available at: `https://yourproject.vercel.app/api/...`

---

### **Step 6: Create Webhook in Stripe Dashboard**

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click **"Add endpoint"**
3. Enter your webhook URL:
   ```
   https://yourproject.vercel.app/api/stripe/webhook
   ```
4. Select events to listen for:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
5. Click **"Add endpoint"**
6. **Copy the "Signing secret"** (starts with `whsec_...`)
7. Add it to Vercel environment variables as `STRIPE_WEBHOOK_SECRET`
8. Redeploy your Vercel app

---

### **Step 7: Test Your Webhook**

1. **Test locally with Stripe CLI** (optional):
   ```bash
   # Install Stripe CLI
   # https://stripe.com/docs/stripe-cli
   
   # Login
   stripe login
   
   # Forward webhooks to local server
   stripe listen --forward-to localhost:4000/api/stripe/webhook
   
   # Trigger test event
   stripe trigger checkout.session.completed
   ```

2. **Test in Stripe Dashboard**:
   - Go to your webhook endpoint in Stripe Dashboard
   - Click **"Send test webhook"**
   - Select an event type (e.g., `checkout.session.completed`)
   - Click **"Send test webhook"**
   - Check your Vercel logs to see if it was received

3. **Test full flow**:
   - Create a checkout session via your API
   - Complete payment with test card: `4242 4242 4242 4242`
   - Verify webhook is received in Vercel logs

---

### **Step 8: Update Frontend**

Update your `pricing.html` to use the new checkout endpoint:

```javascript
async function startSubscription() {
  try {
    // Get user info
    const userDataStr = localStorage.getItem('pathgen_user');
    const userData = userDataStr ? JSON.parse(userDataStr) : null;
    const userId = userData?.id || userData?.email || 'anonymous';
    const userEmail = userData?.email;

    // Call backend to create checkout session
    const API_BASE = 'https://yourproject.vercel.app'; // Your Vercel URL
    const response = await fetch(`${API_BASE}/api/stripe/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planType: 'pro',
        userId: userId,
        userEmail: userEmail,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create checkout session');
    }

    const data = await response.json();

    // Redirect to Stripe Checkout
    window.location.href = data.checkoutUrl;
  } catch (error) {
    console.error('Checkout error:', error);
    alert('Failed to start checkout. Please try again.');
  }
}
```

---

## 🔍 Troubleshooting

### **Webhook not receiving events?**

1. Check Vercel logs: `vercel logs`
2. Verify webhook URL is correct in Stripe Dashboard
3. Make sure `STRIPE_WEBHOOK_SECRET` is set correctly
4. Check that webhook endpoint is deployed (not just local)

### **Signature verification failing?**

1. Make sure webhook endpoint uses `express.raw({ type: 'application/json' })`
2. Verify webhook secret matches the one in Stripe Dashboard
3. Check that the endpoint is added BEFORE `express.json()` middleware

### **CORS errors?**

- Your API already has CORS enabled, but make sure your frontend URL is allowed
- Check `FRONTEND_URL` environment variable

### **Checkout session not creating?**

1. Verify `STRIPE_SECRET_KEY` is set (starts with `sk_test_`)
2. Check that price ID is correct: `price_1RvsvqCitWuvPenEw9TefOig`
3. Look at Vercel function logs for errors

---

## 📊 Monitoring

### **View Webhook Events:**

1. Stripe Dashboard → Developers → Webhooks → Your endpoint
2. See all events, retries, and responses
3. View event payloads and responses

### **View Vercel Logs:**

```bash
vercel logs
```

Or in Vercel Dashboard → Your Project → Functions → View logs

---

## ✅ Checklist

- [ ] Stripe SDK installed (`npm install stripe`)
- [ ] Webhook endpoint added to API (before `express.json()`)
- [ ] Checkout endpoint added to API
- [ ] Environment variables added to Vercel
- [ ] API deployed to Vercel
- [ ] Webhook endpoint created in Stripe Dashboard
- [ ] Webhook secret added to Vercel environment variables
- [ ] Tested webhook with test event
- [ ] Tested full checkout flow
- [ ] Frontend updated to use new checkout endpoint

---

## 🎯 Your Specific Configuration

Based on what you provided:

- **Price ID**: `price_1RvsvqCitWuvPenEw9TefOig` ✅
- **Product ID**: `prod_SrcAFcHh8M9qfx` (not needed for checkout, but good to know)
- **Public Key**: `pk_test_51RvMs4E1WEiMuZnC...` ✅
- **Secret Key**: You need to get `sk_test_...` from Stripe Dashboard

Once you have your secret key and webhook secret, you're all set! 🚀

