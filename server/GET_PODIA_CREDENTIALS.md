# How to Get Podia API Token and Product IDs

## Part 1: Get Podia API Token

### Step-by-Step:

1. **Log into Podia**
   - Go to https://podia.com and log in to your account

2. **Navigate to Settings**
   - Click on your profile/account icon (usually top right)
   - Click **"Settings"** from the dropdown menu

3. **Go to Integrations**
   - In the left sidebar, look for **"Integrations"** or **"API"**
   - Click on it

4. **Access API Section**
   - Look for **"API"** or **"API Access"** section
   - You may see options like "Generate API Token" or "Create API Token"

5. **Generate/Copy Token**
   - If you don't have a token: Click **"Generate API Token"** or **"Create Token"**
   - If you already have one: Click **"Show"** or **"Copy"** to reveal it
   - **Copy the token** - it will look like a long string of characters
   - ⚠️ **Save this securely** - you won't be able to see it again after closing

6. **Add to .env file**
   - Open `server/.env`
   - Find `PODIA_API_TOKEN=`
   - Paste your token after the `=`

---

## Part 2: Get Podia Product IDs

### Method 1: From Podia Dashboard (Easiest)

1. **Log into Podia**
   - Go to https://podia.com

2. **Go to Products**
   - In the left sidebar, click **"Products"** or **"Store"**
   - You'll see a list of all your products

3. **For Each Product:**

   **Option A: From URL**
   - Click on the product name to open it
   - Look at the URL in your browser
   - The URL might look like: `https://podia.com/products/123456/deckzee-vod-review`
   - The number `123456` is your Product ID
   - OR it might be: `https://podia.com/products/deckzee-vod-review?product_id=123456`

   **Option B: From Product Settings**
   - Click on the product
   - Go to **"Settings"** or **"Edit Product"**
   - Look for **"Product ID"** or check the URL
   - The ID is usually a number (like `123456`) or sometimes an alphanumeric string

4. **Find These Products:**
   - **Deckzee VOD Review Membership** → `PODIA_VOD_REVIEW_PRODUCT_ID`
   - **1-on-1 Coaching** → `PODIA_ONE_ON_ONE_PRODUCT_ID`
   - **Seasonal Coaching (2 Months)** or **Seasonal Coaching — Basic** → `PODIA_SEASONAL_BASIC_PRODUCT_ID`
   - **Advanced Seasonal Coaching** → `PODIA_SEASONAL_ADVANCED_PRODUCT_ID`

### Method 2: Using Podia API (If you have API access)

If you've set up the API token, you can also get product IDs programmatically:

```bash
curl -H "Authorization: Bearer YOUR_PODIA_API_TOKEN" \
  https://api.podia.com/v1/products
```

This will list all products with their IDs.

### Method 3: From Purchase/Checkout Links

1. Go to your product in Podia
2. Click "Get Shareable Link" or view the checkout link
3. The product ID might be in the URL or checkout link

---

## Part 3: Update Your .env File

Once you have all the IDs, update your `server/.env` file:

```env
# Podia Configuration
PODIA_API_TOKEN=paste_your_api_token_here

# Podia Product IDs - Coaching
PODIA_VOD_REVIEW_PRODUCT_ID=123456
PODIA_ONE_ON_ONE_PRODUCT_ID=123457
PODIA_SEASONAL_BASIC_PRODUCT_ID=123458
PODIA_SEASONAL_ADVANCED_PRODUCT_ID=123459
```

**Replace the numbers with your actual product IDs.**

---

## Troubleshooting

### Can't find API section in Podia?

- Some Podia accounts may have API access under different names:
  - Look for **"Developer"** or **"Developer Settings"**
  - Check **"Integrations"** → **"API"**
  - Try **"Settings"** → **"Advanced"** → **"API"**

### Can't find Product IDs?

- Product IDs are usually:
  - Numbers: `123456`, `789012`
  - Or alphanumeric: `abc123def456`
  
- Check:
  - Product edit page URL
  - Product settings page
  - Checkout link URL
  - Email receipts (sometimes include product IDs)

### API Token not working?

- Make sure you copied the entire token (they're usually long)
- Check for extra spaces before/after
- Regenerate token if needed
- Verify you have API access enabled on your Podia account

### Still stuck?

If you can't find the product IDs:
1. Contact Podia support - they can provide your product IDs
2. Use the API to list all products (if you have API access)
3. Check Podia documentation for your account type

---

## Quick Checklist

- [ ] Logged into Podia
- [ ] Found API section in Settings
- [ ] Generated/Copied API Token
- [ ] Added API Token to `.env` file
- [ ] Found all 4 coaching products in Products section
- [ ] Got Product ID for each (from URL or settings)
- [ ] Added all Product IDs to `.env` file
- [ ] Saved `.env` file

---

## Example .env Section

Here's what it should look like (with fake IDs as examples):

```env
# Podia Configuration
PODIA_API_TOKEN=podia_live_abc123xyz789def456ghi012jkl345mno678pqr901stu234

# Podia Product IDs - Coaching
PODIA_VOD_REVIEW_PRODUCT_ID=145678
PODIA_ONE_ON_ONE_PRODUCT_ID=145679
PODIA_SEASONAL_BASIC_PRODUCT_ID=145680
PODIA_SEASONAL_ADVANCED_PRODUCT_ID=145681
```

**Remember:** Your actual IDs will be different - these are just examples!

