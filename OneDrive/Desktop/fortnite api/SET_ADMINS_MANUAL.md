# How to Set Users as Admin in Firebase

Since the script requires Firebase credentials, here's how to manually set users as admin in Firebase Console:

## Method 1: Firebase Console (Easiest)

1. Go to [Firebase Console](https://console.firebase.google.com/project/pathgen-v2/firestore)
2. Navigate to **Firestore Database**
3. Go to the `users` collection
4. Find the user document by UID:
   - `saltyzfn`
   - `crl_coach`
5. Click on the document to edit it
6. Add or update these fields:
   - `role`: Set to `"owner"` (string)
   - `isAdmin`: Set to `true` (boolean)
7. Click **Update**

## Method 2: Using the API Endpoint

If you have admin access, you can use the API:

```bash
curl -X PATCH https://pathgen.dev/api/admin/users/saltyzfn \
  -H "Content-Type: application/json" \
  -H "x-user-id: YOUR_ADMIN_UID" \
  -d '{"role": "owner", "isAdmin": true}'
```

## Method 3: Fix Script Credentials First

If you want to use the script, first set up Firebase credentials:

1. Download Firebase service account JSON:
   - Go to [Firebase Console → Project Settings → Service Accounts](https://console.firebase.google.com/project/pathgen-v2/settings/serviceaccounts/adminsdk)
   - Click **Generate new private key**
   - Download the JSON file

2. Add to `apps/web/.env.local`:
   ```
   GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"pathgen-v2",...}
   ```
   (Paste the entire JSON as a single line)

3. Then run:
   ```powershell
   .\set-admins.ps1
   ```

## Quick Manual Update

**For `saltyzfn`:**
- Collection: `users`
- Document ID: `saltyzfn`
- Fields to add/update:
  - `role` = `"owner"`
  - `isAdmin` = `true`

**For `crl_coach`:**
- Collection: `users`
- Document ID: `crl_coach`
- Fields to add/update:
  - `role` = `"owner"`
  - `isAdmin` = `true`

After updating, users need to log out and log back in for changes to take effect.

