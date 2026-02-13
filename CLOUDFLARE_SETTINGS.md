# Cloudflare Configuration Details for Vercel + Caching

Here are the exact settings you need to copy-paste into your Cloudflare Dashboard.

## 1. DNS Records (Go to `DNS` > `Records`)

You need exactly **two** records to point your domain to Vercel while keeping Cloudflare features active.

| Type | Name | Content / Target | Proxy Status | TTL | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **A** | `@` | `76.76.21.21` | 🟠 **Proxied** | Auto | Points root domain to Vercel |
| **CNAME** | `www` | `cname.vercel-dns.com` | 🟠 **Proxied** | Auto | Points www to Vercel |

*Ensure any *old* A records pointing to Firebase IPs are deleted.*

## 2. Page Rule (Go to `Rules` > `Page Rules`)
This rule forces Cloudflare to ignore Vercel's default behavior and cache your video files aggressively.

*   **URL Pattern:** `*fortnitepathtopro.com/videos/*`
    *   *Note: The asterisks `*` are wildcards. This covers `https://`, `www`, and any file inside the videos folder.*

*   **Setting 1**: `Cache Level` = `Cache Everything`
*   **Setting 2**: `Edge Cache TTL` = `1 Month`

**Click "Save and Deploy".**

## 3. Verify Setup
Once you have deployed your files to Vercel (inside `/public/videos/`):

1.  Open Chrome DevTools (`F12`).
2.  Go to the **Network** tab.
3.  Load a video file directly, e.g., `https://fortnitepathtopro.com/videos/lesson-1/segment0.ts`.
4.  Click the request and look at the **Headers** > **Response Headers**.
5.  Look for `cf-cache-status`.
    *   First load: `MISS` (Normal)
    *   Refresh page: **`HIT`** (Success! You are saving money)
