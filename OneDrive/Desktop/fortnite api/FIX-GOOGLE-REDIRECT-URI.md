# Fix Google OAuth Redirect URI Mismatch Error

## 🚨 Error
```
Error 400: redirect_uri_mismatch
redirect_uri=https://pathgen.dev/setup.html
```

## ✅ Solution

The redirect URI `https://pathgen.dev/setup.html` needs to be added to your Google Cloud Console OAuth client configuration.

### Step 1: Go to Google Cloud Console

1. **Open:** https://console.cloud.google.com/apis/credentials?project=64409929315
2. **Or navigate manually:**
   - Go to: https://console.cloud.google.com/
   - Select project: `64409929315` (or your project)
   - Go to: APIs & Services → Credentials

### Step 2: Find Your OAuth Client

1. **Look for:** `64409929315-btl6nep70dnqnrg5ifif63ohkjklhkh1.apps.googleusercontent.com`
2. **Click on it** to edit

### Step 3: Add Authorized Redirect URIs

1. **Scroll down** to "Authorized redirect URIs" section
2. **Click "ADD URI"**
3. **Add this URI exactly** (no trailing slash, exact match):
   ```
   https://pathgen.dev/setup.html
   ```
4. **Click "ADD URI" again** (for local development):
   ```
   http://localhost:3000/setup.html
   ```

### Step 4: Add Authorized JavaScript Origins (Optional but Recommended)

1. **Scroll to "Authorized JavaScript origins"** section
2. **Click "ADD URI"**
3. **Add:**
   ```
   https://pathgen.dev
   ```
4. **Click "ADD URI" again** (for local development):
   ```
   http://localhost:3000
   ```

### Step 5: Save

1. **Click "SAVE"** at the bottom of the page
2. **Wait 1-2 minutes** for changes to propagate

### Step 6: Test

1. **Go to:** https://pathgen.dev/login.html
2. **Click "Continue with Google"**
3. **Should now work!** ✅

## ⚠️ Important Notes

- **Exact match required:** The redirect URI must match EXACTLY (no trailing slashes, correct protocol)
- **Case sensitive:** `https://pathgen.dev/setup.html` (not `https://PathGen.dev/setup.html`)
- **No www:** Use `pathgen.dev` not `www.pathgen.dev` (unless you also add that)
- **Propagation:** Changes can take 1-2 minutes to take effect

## 🔍 Verify Your Setup

After adding, verify:
- ✅ `https://pathgen.dev/setup.html` is in "Authorized redirect URIs"
- ✅ `https://pathgen.dev` is in "Authorized JavaScript origins" (optional)
- ✅ Changes are saved (clicked "SAVE")

## 📋 Complete List of Redirect URIs to Add

**Production:**
- `https://pathgen.dev/setup.html` ✅ **REQUIRED**

**Development (optional):**
- `http://localhost:3000/setup.html`

**If you use www subdomain:**
- `https://www.pathgen.dev/setup.html`

## 🎯 Quick Checklist

- [ ] Opened Google Cloud Console
- [ ] Found OAuth client: `64409929315-btl6nep70dnqnrg5ifif63ohkjklhkh1.apps.googleusercontent.com`
- [ ] Added `https://pathgen.dev/setup.html` to Authorized redirect URIs
- [ ] Added `https://pathgen.dev` to Authorized JavaScript origins
- [ ] Clicked "SAVE"
- [ ] Waited 1-2 minutes
- [ ] Tested login at https://pathgen.dev/login.html

## 🆘 Still Not Working?

1. **Check the exact error message** - Make sure the redirect URI in the error matches what you added
2. **Clear browser cache** - Sometimes old redirect URIs are cached
3. **Check environment variables** - Make sure `GOOGLE_CLIENT_ID` is set correctly in Vercel
4. **Verify OAuth client ID** - Make sure you're editing the correct OAuth client

## 📞 Need Help?

If it's still not working:
1. Check the exact redirect URI in the error message
2. Verify it matches EXACTLY in Google Cloud Console (copy-paste to avoid typos)
3. Make sure you're editing the OAuth client that matches your `GOOGLE_CLIENT_ID`

