# 📧 How to Send Launch Announcement Email

## Quick Start

### 🎯 Easiest Method: Use PowerShell Script

1. Get your Firebase Auth token (see below)
2. Run the script:
```powershell
cd apps/web
.\send-launch-email.ps1 -Token "YOUR_FIREBASE_TOKEN"
```

### Option 1: Send to All Users (Production)

**PowerShell:**
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

**Bash/Linux/Mac:**
```bash
curl -X POST https://pathgen.dev/api/email/send-launch-announcement \
  -H "Authorization: Bearer YOUR_FIREBASE_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Option 2: Send to Specific Emails (Testing)

**PowerShell:**
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

**Bash/Linux/Mac:**
```bash
curl -X POST https://pathgen.dev/api/email/send-launch-announcement \
  -H "Authorization: Bearer YOUR_FIREBASE_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to": ["email1@example.com", "email2@example.com"]}'
```

### Option 3: Test Mode (Single Test Email)

**PowerShell:**
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

**Bash/Linux/Mac:**
```bash
curl -X POST https://pathgen.dev/api/email/send-launch-announcement \
  -H "Authorization: Bearer YOUR_FIREBASE_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"testMode": true}'
```

## Getting Your Firebase Auth Token

### Method 1: From Browser Console (Easiest)

1. Go to https://pathgen.dev
2. Log in with Discord/Google
3. Open browser console (F12)
4. Run:
```javascript
firebase.auth().currentUser.getIdToken().then(token => {
  console.log('Token:', token);
  navigator.clipboard.writeText(token);
  console.log('Token copied to clipboard!');
});
```

### Method 2: From Firebase Admin SDK

If you have admin access, you can generate a token programmatically.

## Email Template

The email template is located at:
- `apps/web/public/launch-email.html`

You can edit this file to customize the email content.

## Features

- ✅ Sends to all users with email addresses (if no `to` specified)
- ✅ Can send to specific email addresses
- ✅ Test mode for safe testing
- ✅ Batch processing to avoid rate limits
- ✅ Error handling and reporting
- ✅ Admin authentication required

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
    "invalid@email.com: Invalid email address",
    "bounced@email.com: Email bounced"
  ]
}
```

## Important Notes

1. **Admin Access Required**: Only users with `isAdmin: true` or `admin: true` in Firestore can send emails
2. **Rate Limiting**: Emails are sent in batches of 10 with delays to avoid overwhelming the server
3. **Test First**: Always test with `testMode: true` or specific emails before sending to all users
4. **Environment Variables**: Make sure `EMAIL_SMTP_USER` and `EMAIL_SMTP_PASS` are set in Vercel

## Troubleshooting

### "Unauthorized" Error
- Make sure you're logged in and have admin access
- Verify your Firebase Auth token is valid

### "Failed to load email template"
- Check that `apps/web/public/launch-email.html` exists
- Verify file permissions

### "No recipients found"
- Check that users have email addresses in Firestore
- Verify the query is working correctly

### Emails Not Sending
- Check AWS SES credentials in environment variables
- Verify SES is out of sandbox mode (if needed)
- Check Vercel logs for detailed error messages

