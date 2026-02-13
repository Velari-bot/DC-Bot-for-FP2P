# Google Sign-In Setup Issues - Fix Guide

## 🔍 Issues Found

Based on your Firebase and Google Cloud Console setup, here are the issues:

### Issue 1: Firebase Configuration Not Saved ⚠️

**Problem:** The Firebase console shows:
- Banner: "Update the project-level setting below to continue"
- "Save" button is **disabled**

**Fix:**
1. In Firebase Console → Authentication → Sign-in method → Google
2. Make sure all fields are filled:
   - ✅ Public-facing name: `project-64409929315` (or your preferred name)
   - ✅ Support email: `jlbender2005@gmail.com` (already set)
   - ✅ Web client ID: `64409929315-btl6nep70dnqnrg5ifif63ohkjklhkh1.apps.googleusercontent.com` (already set)
   - ✅ Web client secret: `*********************` (already set)
3. **Click "Save"** (it should be enabled after filling all fields)
4. If "Save" is still disabled, check if there are any validation errors (red text)

### Issue 2: Google Cloud Console Redirect URIs (CRITICAL) 🚨

**Problem:** You added the domain to Firebase's "Authorized domains", but your code uses a **custom OAuth flow** (not Firebase's built-in Google sign-in). This means you need to configure redirect URIs in **Google Cloud Console**, not just Firebase.

**Fix:**
1. **Go to Google Cloud Console:**
   - https://console.cloud.google.com/apis/credentials?project=64409929315

2. **Find your OAuth 2.0 Client:**
   - Look for: `64409929315-btl6nep70dnqnrg5ifif63ohkjklhkh1.apps.googleusercontent.com`
   - Click on it to edit

3. **Add Authorized Redirect URIs:**
   - In the "Authorized redirect URIs" section, click "ADD URI"
   - Add these URIs **one at a time**:
     - `https://pathgen.dev/setup.html` (production - **MUST HAVE**)
     - `http://localhost:3000/setup.html` (local development - optional)
   - **Important:** No trailing slashes, exact match required

4. **Add Authorized JavaScript origins (if needed):**
   - In "Authorized JavaScript origins", add:
     - `https://pathgen.dev`
     - `http://localhost:3000` (for local dev)

5. **Click "SAVE"** at the bottom

### Issue 3: Two Different Systems ⚠️

**Important:** Your code uses a **custom OAuth flow** (not Firebase's built-in Google sign-in). This means:
- ✅ Firebase configuration is **optional** for your current setup
- ✅ Google Cloud Console redirect URIs are **REQUIRED**
- ✅ The redirect URI must be: `https://pathgen.dev/setup.html`

## ✅ Verification Checklist

After fixing the above:

1. **Firebase:**
   - [ ] Google sign-in is enabled
   - [ ] Web client ID is set
   - [ ] Web client secret is set
   - [ ] "Save" button was clicked and saved successfully

2. **Google Cloud Console:**
   - [ ] Redirect URI `https://pathgen.dev/setup.html` is added
   - [ ] Redirect URI `http://localhost:3000/setup.html` is added (for local dev)
   - [ ] JavaScript origin `https://pathgen.dev` is added
   - [ ] Changes are saved

3. **Environment Variables (Vercel):**
   - [ ] `GOOGLE_CLIENT_ID` is set: `64409929315-btl6nep70dnqnrg5ifif63ohkjklhkh1.apps.googleusercontent.com`
   - [ ] `GOOGLE_CLIENT_SECRET` is set (your secret)
   - [ ] Both are enabled for Production, Preview, Development

4. **Code:**
   - [ ] `login.html` has the correct `GOOGLE_CLIENT_ID`
   - [ ] Redirect URI in code matches Google Cloud Console: `https://pathgen.dev/setup.html`

## 🧪 Test

1. Go to: https://pathgen.dev/login.html
2. Click "Continue with Google"
3. Should redirect to Google sign-in page
4. After authorization, should redirect back to `/setup.html`
5. Should create/login user successfully

## 🔍 Common Errors

### "OAuth client was not found"
- ✅ Check redirect URI is added in Google Cloud Console (not just Firebase)
- ✅ Verify client ID matches exactly

### "redirect_uri_mismatch"
- ✅ Redirect URI in Google Cloud Console must match EXACTLY: `https://pathgen.dev/setup.html`
- ✅ No trailing slash, exact protocol (https), exact domain

### "invalid_client"
- ✅ Check `GOOGLE_CLIENT_SECRET` is set correctly in Vercel
- ✅ Redeploy after adding environment variables

## 📝 Current Configuration

- **Client ID:** `64409929315-btl6nep70dnqnrg5ifif63ohkjklhkh1.apps.googleusercontent.com`
- **Redirect URI (Production):** `https://pathgen.dev/setup.html`
- **Redirect URI (Local):** `http://localhost:3000/setup.html`
- **Scopes:** `openid email profile`
