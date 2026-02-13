# 🔧 Fix Stripe Checkout Branding

## ✅ What I Fixed

I've updated the checkout session creation to explicitly use your Stripe Dashboard branding settings.

### Changes Made:

1. **Added `appearance` parameter** to checkout session
2. **Set brand colors** to match your dashboard:
   - Primary color: `#3e2977` (your accent color)
   - Text color: `#0e0337` (your brand color)
   - Background: White

---

## 🎯 How It Works Now

The checkout session will now:
- ✅ Use your custom colors from the dashboard
- ✅ Display your logo (set in dashboard)
- ✅ Match your brand styling

---

## 📋 If Branding Still Doesn't Match

### Option 1: Update Colors in Code

If your dashboard colors are different, update them in `apps/web/app/api/stripe/create-checkout/route.ts`:

```typescript
appearance: {
  theme: 'stripe' as const,
  variables: {
    colorPrimary: '#YOUR_ACCENT_COLOR', // Your accent color from dashboard
    colorText: '#YOUR_BRAND_COLOR',      // Your brand color from dashboard
    // ... other colors
  },
},
```

### Option 2: Use Dashboard Defaults

If you want to use ONLY dashboard settings (no code overrides), you can remove the `appearance` parameter entirely. However, explicitly setting it ensures consistency.

### Option 3: Check Stripe Dashboard Settings

1. Go to: https://dashboard.stripe.com/settings/branding
2. Verify your settings:
   - Logo is uploaded
   - Brand color: `#0e0337`
   - Accent color: `#3e2977`
   - "Prefer logo over icon" is checked
3. Click **Save** again
4. Wait 1-2 minutes for changes to propagate

---

## 🚀 Deploy the Fix

After updating the code:

```powershell
cd "C:\Users\bende\OneDrive\Desktop\fortnite api"
vercel --prod
```

Or push to git (auto-deploys).

---

## ✅ Expected Result

After deployment, your checkout page should show:
- ✅ Your custom logo (crescent moon with stars)
- ✅ Dark purple header (`#0e0337`)
- ✅ Purple accent buttons (`#3e2977`)
- ✅ All your branding elements

---

## 🔍 Troubleshooting

**If branding still doesn't match:**

1. **Clear browser cache** - Old checkout pages might be cached
2. **Create a new checkout session** - Old sessions use old branding
3. **Check both Test and Live modes** - Make sure you're testing in the correct mode
4. **Verify Stripe Dashboard** - Ensure settings are saved in the correct mode (Test vs Live)

**The code now explicitly sets your branding, so it should match your dashboard!** 🎨

