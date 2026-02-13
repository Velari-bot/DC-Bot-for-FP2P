# Discord & Podia Setup Checklist

This checklist covers the setup tasks that need to be completed manually in Discord and Podia.

## ✅ Code Changes Completed

The following have been completed in the codebase:

- ✅ Removed Group Coaching component from coaching page
- ✅ Replaced Stripe checkout with Podia checkout links
- ✅ Updated all CTAs to use Podia URLs
- ✅ Added "Discord access granted automatically after purchase" text
- ✅ Created PodiaBuyButton component for direct Podia links

## 🔴 PRIORITY 2 — Discord Setup (Manual Steps Required)

### Create/Confirm Discord Roles

Verify these roles exist in your Discord server (IDs are already configured in code):

1. **Deckzee VOD Review** 
   - Role ID: `1456799809666154584`
   - ✅ Verify role exists
   - ✅ Confirm ID matches

2. **1-on-1 Coaching**
   - Role ID: `1456799859108479190`
   - ✅ Verify role exists
   - ✅ Confirm ID matches

3. **Seasonal Coaching (2 Months)**
   - Role ID: `1456799883519594680`
   - ✅ Verify role exists
   - ✅ Confirm ID matches

4. **Advanced Seasonal Coaching**
   - Role ID: `1456799919238025358`
   - ✅ Verify role exists
   - ✅ Confirm ID matches

### Move Podia's Discord Bot Role

- ✅ Go to Server Settings → Roles
- ✅ Drag Podia's Discord bot role ABOVE all managed roles
- ✅ Bot cannot assign roles that are above its own role

### Create Private Channels (Optional)

For each coaching product, create a private channel:

1. **VOD Review Channel**
   - Create private channel (e.g., `#vod-review`)
   - Set permissions: Only `Deckzee VOD Review` role can see it
   - Copy Channel ID → Add to `.env` as `DISCORD_VOD_REVIEW_CHANNEL_ID`

2. **1-on-1 Coaching Channel**
   - Create private channel (e.g., `#1on1-coaching`)
   - Set permissions: Only `1-on-1 Coaching` role can see it
   - Copy Channel ID → Add to `.env` as `DISCORD_ONE_ON_ONE_CHANNEL_ID`

3. **Seasonal Basic Channel**
   - Create private channel (e.g., `#seasonal-basic`)
   - Set permissions: Only `Seasonal Coaching (2 Months)` role can see it
   - Copy Channel ID → Add to `.env` as `DISCORD_SEASONAL_BASIC_CHANNEL_ID`

4. **Seasonal Advanced Channel**
   - Create private channel (e.g., `#seasonal-advanced`)
   - Set permissions: Only `Advanced Seasonal Coaching` role can see it
   - Copy Channel ID → Add to `.env` as `DISCORD_SEASONAL_ADVANCED_CHANNEL_ID`

## 🟡 PRIORITY 3 — Podia Product Cleanup (Manual Steps Required)

For each product in Podia, verify:

### Deckzee VOD Review Membership
- ✅ Product Type: **Subscription** ($20/month)
- ✅ Product is **Published**
- ✅ Pricing: $20/month
- ✅ Description is correct
- ✅ Get Shareable Link → Copy URL → Add to `static/js/utils/purchaceURLS.js` as `PODIA_VOD_REVIEW`

### 1-on-1 Coaching
- ✅ Product Type: **One-time**
- ✅ Product is **Published**
- ✅ Pricing: $150/hour (or per session)
- ✅ Description is correct
- ✅ Get Shareable Link → Copy URL → Add to `static/js/utils/purchaceURLS.js` as `PODIA_ONE_ON_ONE`

### Seasonal Coaching (2 Months)
- ✅ Product Type: **Fixed duration** (2 months)
- ✅ Product is **Published**
- ✅ Pricing: $500/season
- ✅ Description is correct
- ✅ Get Shareable Link → Copy URL → Add to `static/js/utils/purchaceURLS.js` as `PODIA_SEASONAL_BASIC`

### Advanced Seasonal Coaching
- ✅ Product Type: **Fixed duration** (2 months) or **Subscription**
- ✅ Product is **Published**
- ✅ Pricing: $2,500/season
- ✅ Description is correct
- ✅ Get Shareable Link → Copy URL → Add to `static/js/utils/purchaceURLS.js` as `PODIA_SEASONAL_ADVANCED`

## 🟢 PRIORITY 4 — Connect Podia to Discord (Core Step)

### Connect Discord Integration in Podia

1. **Go to Podia Settings**
   - Login to Podia → Settings → Integrations

2. **Connect Discord**
   - Find "Discord" integration
   - Click "Connect" or "Configure"
   - Authorize Podia to access your Discord server

3. **Map Products to Roles**
   For each product, map to Discord role:
   
   - **Deckzee VOD Review** → `Deckzee VOD Review` role
   - **1-on-1 Coaching** → `1-on-1 Coaching` role
   - **Seasonal Coaching** → `Seasonal Coaching` role
   - **Advanced Seasonal Coaching** → `Advanced Seasonal Coaching` role

4. **Enable Automatic Role Removal**
   - ✅ Enable "Remove role on cancellation"
   - ✅ Enable "Remove role on expiration"

### Configure Webhook (If Using Custom Backend)

If you're using the custom backend server (not Podia's built-in integration):

1. **Get Webhook URL**
   - Your webhook endpoint: `https://your-domain.com/api/discord/webhook/podia`

2. **Configure in Podia**
   - Settings → Integrations → Webhooks
   - Add webhook URL
   - Select events:
     - `subscription.created`
     - `subscription.updated`
     - `subscription.canceled`
     - `subscription.expired`
     - `user.updated`

3. **Get Webhook Secret**
   - Copy webhook secret
   - Add to `server/.env` as `PODIA_WEBHOOK_SECRET`

## 🔵 PRIORITY 5 — Channel Access Verification (Testing)

### Test Purchase Flow

1. **Buy a Test Product** (or comp yourself access)
   - Purchase one coaching product through Podia
   - Use a test Discord account

2. **Verify Role Assignment**
   - ✅ Check Discord server
   - ✅ Confirm role is auto-assigned
   - ✅ Confirm private channel becomes visible (if configured)

3. **Test Cancellation/Expiration**
   - Cancel or expire the test product
   - ✅ Confirm role is removed
   - ✅ Confirm channel access is revoked

## 🔧 Configuration Files to Update

### 1. Update Podia URLs

Edit `static/js/utils/purchaceURLS.js`:

```javascript
export const PODIA_VOD_REVIEW = "https://yourstore.podia.com/products/vod-review";
export const PODIA_ONE_ON_ONE = "https://yourstore.podia.com/products/1on1-coaching";
export const PODIA_SEASONAL_BASIC = "https://yourstore.podia.com/products/seasonal-basic";
export const PODIA_SEASONAL_ADVANCED = "https://yourstore.podia.com/products/seasonal-advanced";
```

### 2. Update Environment Variables (If Using Custom Backend)

Edit `server/.env`:

```env
# Podia Product IDs (for backend webhook processing)
PODIA_VOD_REVIEW_PRODUCT_ID=your_product_id_here
PODIA_ONE_ON_ONE_PRODUCT_ID=your_product_id_here
PODIA_SEASONAL_BASIC_PRODUCT_ID=your_product_id_here
PODIA_SEASONAL_ADVANCED_PRODUCT_ID=your_product_id_here

# Discord Channel IDs (optional)
DISCORD_VOD_REVIEW_CHANNEL_ID=channel_id_if_created
DISCORD_ONE_ON_ONE_CHANNEL_ID=channel_id_if_created
DISCORD_SEASONAL_BASIC_CHANNEL_ID=channel_id_if_created
DISCORD_SEASONAL_ADVANCED_CHANNEL_ID=channel_id_if_created
```

## 📋 Quick Reference: How to Get Podia Checkout URLs

1. Login to Podia → Go to Products
2. Click on the product
3. Click "Get Shareable Link" or "Copy Link"
4. Copy the full URL (e.g., `https://yourstore.podia.com/products/product-name`)
5. Paste into `static/js/utils/purchaceURLS.js`

## 📋 Quick Reference: How to Get Discord Channel IDs

1. Enable Developer Mode in Discord (User Settings → Advanced → Developer Mode)
2. Right-click the channel → Copy Channel ID
3. Paste into `server/.env` file

## ✅ Completion Checklist

- [ ] All Discord roles created and verified
- [ ] Podia bot role moved above managed roles
- [ ] Private channels created (optional)
- [ ] All Podia products verified and published
- [ ] Podia checkout URLs added to `purchaceURLS.js`
- [ ] Podia Discord integration connected
- [ ] Products mapped to Discord roles in Podia
- [ ] Automatic role removal enabled
- [ ] Test purchase completed and verified
- [ ] Role assignment working
- [ ] Channel access working (if configured)
- [ ] Cancellation/expiration tested

## 🆘 Need Help?

- **Discord Setup**: See `DISCORD_INTEGRATION_SETUP.md`
- **Podia Setup**: See `server/GET_PODIA_CREDENTIALS.md`
- **Backend Setup**: See `server/README.md`
- **Zapier Integration**: See `ZAPIER_INTEGRATION_GUIDE.md`
