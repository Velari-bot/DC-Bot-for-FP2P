# Cloudflare Troubleshooting & Optimization Guide

If you are experiencing issues with React apps (like white screens, broken players, or JS errors) on Cloudflare, it is often due to **Rocket Loader** or **Auto Minify**.

## 1. Disable Rocket Loader (CRITICAL)
Rocket Loader attempts to defer Javascript, which breaks React's hydration process and media players.

1.  Go to your Cloudflare Dashboard.
2.  Navigate to **Speed** > **Optimization**.
3.  Scroll down to **Rocket Loader**.
4.  Switch it **OFF**.

## 2. Disable Auto Minify for JS
Vercel/Webpack already minifies your Javascript. Cloudflare double-minifying it can cause syntax errors.

1.  Go to **Speed** > **Optimization**.
2.  Find **Auto Minify**.
3.  Uncheck **JavaScript**. (HTML and CSS are usually fine to leave checked).

## 3. Clear Cache
After making these changes, you must purge the cache to see the fix.

1.  Go to **Caching** > **Configuration**.
2.  Click **Purge Everything**.
3.  Wait 30 seconds.

## 4. Verify "Development Mode" is OFF
Ensure you are not permanently in Development Mode, although for debugging you can turn it ON temporarily to bypass cache entirely.

---
## Summary of Settings
- **Rocket Loader:** OFF
- **Auto Minify (JS):** OFF
- **Brotli:** ON (Recommended)
- **Always Online:** ON
