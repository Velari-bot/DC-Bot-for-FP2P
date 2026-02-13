# Server-Side Video Compression Setup

## Vercel Environment Variables

Add these to your Ver Vercel project settings (Settings → Environment Variables):

### Required Variables

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```

### How to Get These Values

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Download the JSON file
4. Extract the values:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the \n characters)
   - Storage bucket from Storage tab → `FIREBASE_STORAGE_BUCKET`

## How It Works

1. **Upload Original**: User uploads video to Firebase Storage (`temp/uploads/...`)
2. **Trigger Compression**: Frontend calls `/api/compress-video`
3. **Server Processing**: Vercel function downloads, compresses with FFmpeg, re-uploads
4. **Cleanup**: Original temp file is deleted, compressed version remains
5. **Return URL**: Compressed video URL returned to frontend

## Benefits

- ✅ No 32MB browser download
- ✅ Works with YouTube embeds (no security header conflicts)
- ✅ Real FFmpeg (faster, more reliable than WASM)
- ✅ No timeouts on slow connections
- ✅ Better user experience

## Deploying

After adding environment variables:

```bash
vercel --prod
```

That's it! Compression now happens server-side automatically.
