# Quick Guide: Podia API Token & Product IDs

## 🎯 Get Podia API Token

1. Login to Podia → https://podia.com
2. Click your profile (top right) → **Settings**
3. Left sidebar → **Integrations** → **API**
4. Click **"Generate API Token"** or **"Show Token"**
5. **Copy the token** (long string of characters)
6. Paste in `.env` as `PODIA_API_TOKEN=your_token_here`

---

## 🎯 Get Product IDs

### Quick Method:

1. Login to Podia → Go to **Products** (left sidebar)
2. Click on each product to open it
3. **Check the URL** in your browser:
   - URL might be: `https://podia.com/products/123456/product-name`
   - The number `123456` is your Product ID

### Products to Find:

- **Deckzee VOD Review Membership** → Copy ID → `PODIA_VOD_REVIEW_PRODUCT_ID`
- **1-on-1 Coaching** → Copy ID → `PODIA_ONE_ON_ONE_PRODUCT_ID`
- **Seasonal Coaching (2 Months)** → Copy ID → `PODIA_SEASONAL_BASIC_PRODUCT_ID`
- **Advanced Seasonal Coaching** → Copy ID → `PODIA_SEASONAL_ADVANCED_PRODUCT_ID`

### Alternative: Check Product Settings

- Open product → Click **"Settings"** or **"Edit"**
- Product ID might be visible in the settings page
- Or check the page URL

---

## ✅ Update .env File

Open `server/.env` and add:

```env
PODIA_API_TOKEN=your_actual_token_here
PODIA_VOD_REVIEW_PRODUCT_ID=123456
PODIA_ONE_ON_ONE_PRODUCT_ID=123457
PODIA_SEASONAL_BASIC_PRODUCT_ID=123458
PODIA_SEASONAL_ADVANCED_PRODUCT_ID=123459
```

**Replace with your actual values!**

---

## 💡 Tips

- Product IDs are usually **numbers** (like `123456`)
- API tokens are **long strings** (like `podia_live_abc123...`)
- If you can't find IDs in URL, try product settings page
- Contact Podia support if you're stuck - they can help!

---

## ⚠️ Note

You can start the server without Product IDs - they're only needed when processing actual purchases. But you DO need the API Token to start.

