# 🚨 Quick Fix: Google Sign-In Issues

## The Main Problem

You added the domain to **Firebase's "Authorized domains"**, but your code uses a **custom OAuth flow** (not Firebase's built-in Google sign-in). This means you need to configure redirect URIs in **Google Cloud Console**, not just Firebase.

## ✅ Step-by-Step Fix

### Step 1: Fix Firebase (Optional but Recommended)

1. Go to: Firebase Console → Authentication → Sign-in method → Google
2. Make sure all fields are filled correctly
3. **Click "Save"** (if it's enabled)
4. If "Save" is disabled, check for any red error messages

### Step 2: Configure Google Cloud Console (REQUIRED) 🚨

**This is the critical step:**

1. **Go to Google Cloud Console:**
   ```
   https://console.cloud.google.com/apis/credentials?project=64409929315
   ```

2. **Find your OAuth 2.0 Client:**
   - Look for: `64409929315-btl6nep70dnqnrg5ifif63ohkjklhkh1.apps.googleusercontent.com`
   - Click on it to edit

3. **Add Authorized Redirect URIs:**
   - Scroll to "Authorized redirect URIs" section
   - Click "ADD URI"
   - Add: `https://pathgen.dev/setup.html` (production)
   - Click "ADD URI" again
   - Add: `http://localhost:3000/setup.html` (local dev)
   - **Important:** No trailing slashes, exact match required

4. **Add Authorized JavaScript origins (optional but recommended):**
   - Scroll to "Authorized JavaScript origins"
   - Click "ADD URI"
   - Add: `https://pathgen.dev`
   - Click "ADD URI" again
   - Add: `http://localhost:3000` (for local dev)

5. **Click "SAVE"** at the bottom of the page

### Step 3: Verify Environment Variables

Make sure these are set in **Vercel**:
- `GOOGLE_CLIENT_ID` = `64409929315-btl6nep70dnqnrg5ifif63ohkjklhkh1.apps.googleusercontent.com`
- `GOOGLE_CLIENT_SECRET` = (your secret)

## 🧪 Test

1. Go to: https://pathgen.dev/login.html
2. Click "Continue with Google"
3. Should redirect to Google sign-in
4. After authorization, should redirect back to `/setup.html`

## ❌ Common Errors

### "OAuth client was not found"
→ Redirect URI not added in Google Cloud Console

### "redirect_uri_mismatch"
→ Redirect URI must match EXACTLY: `https://pathgen.dev/setup.html` (no trailing slash)

### "invalid_client"
→ Check `GOOGLE_CLIENT_SECRET` is set in Vercel
