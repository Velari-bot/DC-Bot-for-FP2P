# Admin Whitelist Guide

## How to Whitelist Users as Admin

There are **two ways** to whitelist users as admin:

### Method 1: Using the API Endpoint (Recommended)

Use the `/api/admin/setup/set-admin` endpoint to set a user as admin:

```bash
curl -X POST https://pathgen.dev/api/admin/setup/set-admin \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "YOUR_ADMIN_SETUP_SECRET",
    "username": "username_to_whitelist"
  }'
```

**Note:** Set `ADMIN_SETUP_SECRET` in your Vercel environment variables for security.

This will:
- Set `role: 'owner'` in the user's Firestore document
- Set `isAdmin: true` in the user's Firestore document
- Allow them to access all pages before launch

### Method 2: Manual Firestore Update

1. Go to Firebase Console → Firestore Database
2. Navigate to `users/{userId}`
3. Update the document:
   ```json
   {
     "role": "admin",  // or "owner"
     "isAdmin": true
   }
   ```

### Method 3: Add to Frontend Whitelist (Temporary)

Edit `apps/web/public/js/auth-guard.js`:

```javascript
const ADMIN_WHITELIST = ['crl_coach', 'username1', 'username2'];
```

**Note:** This is a fallback method. The API/Firestore method is preferred.

## How Admin Access Works

1. **Backend Check**: The API checks Firestore for `role === 'admin'` or `role === 'owner'` or `isAdmin === true`
2. **Frontend Check**: The auth guard checks:
   - `isAdmin` flag in localStorage (set by backend)
   - `role` field in localStorage
   - Username against `ADMIN_WHITELIST` array (fallback)
   - API call to `/api/admin/auth` (background refresh)

## Testing Admin Access

1. Set a user as admin using Method 1 or 2
2. Have them log in
3. They should be able to access all pages before launch
4. Check browser console for admin status logs

## Current Admin Whitelist

- `crl_coach` (default)

Add more usernames to the `ADMIN_WHITELIST` array in `auth-guard.js` or use the API endpoint.

