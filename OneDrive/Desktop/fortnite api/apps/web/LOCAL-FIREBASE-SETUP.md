# 🔥 Local Firebase Admin Setup Guide

## Problem
You're seeing this error:
```
Could not load the default credentials. Browse to .../authentication/getting-started for more information.
```

This happens because Firebase Admin SDK needs credentials to access Firestore in local development.

## ✅ Quick Fix (Recommended)

### Step 1: Download Firebase Service Account JSON

1. Go to [Firebase Console](https://console.firebase.google.com/project/pathgen-v2/settings/serviceaccounts/adminsdk)
2. Click **"Generate new private key"**
3. Download the JSON file (e.g., `pathgen-v2-firebase-adminsdk-xxxxx.json`)

### Step 2: Add to `.env.local`

Create or edit `apps/web/.env.local` and add:

```bash
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"pathgen-v2","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

**Important:** Paste the ENTIRE JSON content as a single line, or escape it properly.

### Step 3: Restart Dev Server

```bash
# Stop the current dev server (Ctrl+C)
# Then restart:
npm run dev
```

## 🔄 Alternative Method: Service Account File

If you prefer using a file instead:

1. Place the downloaded JSON file in `apps/web/` directory
2. Name it `firebase-service-account.json`
3. Add to `.env.local`:
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json
   ```

**Note:** Make sure to add `firebase-service-account.json` to `.gitignore` to avoid committing credentials!

## ✅ Verify It Works

After setting up, you should see in the console:
```
[INFO] Firebase Admin initialized with GOOGLE_APPLICATION_CREDENTIALS_JSON
[INFO] Firebase Admin Firestore initialized successfully
```

And the `/api/voice/usage` endpoint should work without errors.

## 🚨 Security Notes

- **NEVER commit** `.env.local` or service account JSON files to git
- The service account has admin access to your Firestore database
- Keep it secure and only use it for local development
- In production (Vercel), credentials are set via environment variables in the Vercel Dashboard

## 📝 Troubleshooting

### Still getting errors?

1. **Check file path**: Make sure the path in `GOOGLE_APPLICATION_CREDENTIALS` is correct
2. **Check JSON format**: Ensure the JSON is valid (no trailing commas, proper escaping)
3. **Restart dev server**: Environment variables are only loaded on server start
4. **Check console logs**: Look for `[INFO]` or `[ERROR]` messages about Firebase Admin initialization

### Need help?

Check the Firebase Admin SDK documentation:
https://firebase.google.com/docs/admin/setup

