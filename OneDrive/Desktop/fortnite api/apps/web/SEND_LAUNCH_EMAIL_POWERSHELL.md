# 📧 Send Launch Email - PowerShell Guide

## Quick Start

### Step 1: Get Your Firebase Auth Token

**Option A: From Browser Console (Easiest)**

1. Go to https://pathgen.dev
2. Log in with Discord/Google
3. Open browser console (F12)
4. Run this code:
```javascript
firebase.auth().currentUser.getIdToken().then(token => {
  console.log('Token:', token);
  navigator.clipboard.writeText(token);
  console.log('✅ Token copied to clipboard!');
});
```

**Option B: From Firebase Admin SDK**

If you have admin access, generate a token programmatically.

### Step 2: Run the PowerShell Script

Navigate to the `apps/web` directory and run:

```powershell
cd apps/web
.\send-launch-email.ps1 -Token "YOUR_FIREBASE_TOKEN_HERE"
```

## Usage Examples

### Send to All Users (Production)
```powershell
.\send-launch-email.ps1 -Token "YOUR_TOKEN"
```

### Test Mode (Single Test Email)
```powershell
.\send-launch-email.ps1 -Token "YOUR_TOKEN" -TestMode
```

### Send to Specific Emails
```powershell
.\send-launch-email.ps1 -Token "YOUR_TOKEN" -To "email1@example.com", "email2@example.com"
```

## Alternative: Using Invoke-RestMethod Directly

If you prefer to use PowerShell commands directly:

### Send to All Users
```powershell
$token = "YOUR_FIREBASE_TOKEN"
$url = "https://pathgen.dev/api/email/send-launch-announcement"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}
$body = @{} | ConvertTo-Json

Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $body
```

### Test Mode
```powershell
$token = "YOUR_FIREBASE_TOKEN"
$url = "https://pathgen.dev/api/email/send-launch-announcement"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}
$body = @{ testMode = $true } | ConvertTo-Json

Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $body
```

### Send to Specific Emails
```powershell
$token = "YOUR_FIREBASE_TOKEN"
$url = "https://pathgen.dev/api/email/send-launch-announcement"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}
$body = @{
    to = @("email1@example.com", "email2@example.com")
} | ConvertTo-Json

Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $body
```

## Response Format

```json
{
  "success": true,
  "message": "Launch announcement sent to 150 recipients",
  "stats": {
    "total": 150,
    "sent": 148,
    "failed": 2
  },
  "errors": [
    "invalid@email.com: Invalid email address"
  ]
}
```

## Requirements

1. **Admin Access**: Your user must have `isAdmin: true` or `admin: true` in Firestore
2. **Valid Token**: Firebase Auth token must be valid and not expired
3. **Environment Variables**: `EMAIL_SMTP_USER` and `EMAIL_SMTP_PASS` must be set in Vercel

## Troubleshooting

### "Unauthorized" Error
- Make sure you're logged in and have admin access
- Verify your Firebase Auth token is valid (tokens expire after 1 hour)
- Get a fresh token from browser console

### "Forbidden - Admin access required"
- Check your user document in Firestore
- Set `isAdmin: true` or `admin: true` in your user document

### "Failed to load email template"
- Check that `apps/web/public/launch-email.html` exists
- Verify the file was deployed to Vercel

### Emails Not Sending
- Check AWS SES credentials in Vercel environment variables
- Verify SES is out of sandbox mode (if needed)
- Check Vercel function logs for detailed errors

## Important Notes

⚠️ **Always test first!** Use `-TestMode` before sending to all users.

⚠️ **Token Expiration**: Firebase Auth tokens expire after 1 hour. Get a fresh token if you get authentication errors.

⚠️ **Rate Limiting**: The script sends emails in batches to avoid overwhelming the server. Large lists may take several minutes.

