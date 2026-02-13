# 🔥 Add Firebase Config to Vercel

## Quick Method: Use the Script

From the project root:
```powershell
cd apps/web
.\add-firebase-env.ps1
```

## Manual Method: Vercel Dashboard

1. Go to: https://vercel.com/velari-bots-projects/pathgen/settings/environment-variables

2. Click **"Add New"** for each variable:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyCi0E0E0rK1awSUTsoqI5p6g_6Ug_EBxKs` | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `pathgen-v2.firebaseapp.com` | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `pathgen-v2` | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `pathgen-v2.firebasestorage.app` | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `64409929315` | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:64409929315:web:a8fefd3bcb7749ef6b1a56` | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | `G-JWC8N4H6FL` | Production, Preview, Development |
| `FIREBASE_PROJECT_ID` | `pathgen-v2` | Production, Preview, Development |

3. For each variable:
   - ✅ Select **Production**, **Preview**, and **Development**
   - ❌ **DO NOT** mark as "Sensitive" (these are public config values)
   - Click **"Save"**

## Why NEXT_PUBLIC_*?

In Next.js, environment variables prefixed with `NEXT_PUBLIC_` are:
- ✅ Exposed to the browser
- ✅ Safe for frontend Firebase config
- ✅ Available in client-side code

These Firebase config values are **meant to be public** - they're safe to expose.

## After Adding Variables

1. **Redeploy** to apply changes:
   ```powershell
   vercel --prod
   ```

2. **Verify** they're working:
   - Check your app loads without errors
   - Firebase should initialize correctly

## Using in Code

These will be available as:
```javascript
process.env.NEXT_PUBLIC_FIREBASE_API_KEY
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
// etc.
```

## Quick Add via CLI (Alternative)

If you prefer manual CLI commands:

```powershell
cd apps/web

# API Key
echo "AIzaSyCi0E0E0rK1awSUTsoqI5p6g_6Ug_EBxKs" | vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production

# Auth Domain
echo "pathgen-v2.firebaseapp.com" | vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production

# Project ID
echo "pathgen-v2" | vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production

# Storage Bucket
echo "pathgen-v2.firebasestorage.app" | vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production

# Messaging Sender ID
echo "64409929315" | vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production

# App ID
echo "1:64409929315:web:a8fefd3bcb7749ef6b1a56" | vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production

# Measurement ID
echo "G-JWC8N4H6FL" | vercel env add NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID production

# Firebase Project ID (for server-side)
echo "pathgen-v2" | vercel env add FIREBASE_PROJECT_ID production
```

Repeat for `preview` and `development` environments if needed.

---

**After adding, redeploy with `vercel --prod`!** 🚀

