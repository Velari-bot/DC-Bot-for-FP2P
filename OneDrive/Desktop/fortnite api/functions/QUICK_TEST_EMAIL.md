# 🧪 Quick Email Test Guide

## Test Your AWS SES Setup

### Option 1: Quick Test (PowerShell)

```powershell
cd functions
.\test-email-quick.ps1
```

This script will:
1. Set your SMTP credentials
2. Ask for your test email address
3. Send a test email

### Option 2: Manual Test

1. **Set environment variables:**
   ```powershell
   $env:EMAIL_SMTP_USER = "AKIA3TD2SDYDYSEBUZB4"
   $env:EMAIL_SMTP_PASS = "BDQAfaz8PgjAHwDsdUUWXmTCDiaeX45WOyuzW9yUPuOa"
   $env:EMAIL_FROM = "support@pathgen.dev"
   $env:TEST_EMAIL = "your-email@example.com"
   ```

2. **Run the test:**
   ```powershell
   node test-email.js
   ```

### Option 3: Using .env File

1. **Create `.env` file in `functions/` directory:**
   ```bash
   EMAIL_SMTP_USER=AKIA3TD2SDYDYSEBUZB4
   EMAIL_SMTP_PASS=BDQAfaz8PgjAHwDsdUUWXmTCDiaeX45WOyuzW9yUPuOa
   EMAIL_FROM=support@pathgen.dev
   TEST_EMAIL=your-email@example.com
   ```

2. **Install dotenv (if not already installed):**
   ```bash
   npm install dotenv
   ```

3. **Run the test:**
   ```bash
   node test-email.js
   ```

## Expected Output

### ✅ Success:
```
📧 Testing PathGen Email System...
   From: support@pathgen.dev
   To: your-email@example.com
   SMTP Host: email-smtp.us-east-2.amazonaws.com
   SMTP Port: 587

✅ SUCCESS! Email sent successfully!
   Message ID: 0100018a-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   Response: 250 Ok 0100018a-xxxx-xxxx-xxxx-xxxxxxxxxxxx

📬 Check your inbox at: your-email@example.com
```

### ❌ Error:
If you see errors, check:
1. ✅ SMTP credentials are correct
2. ✅ AWS SES domain is verified
3. ✅ If in sandbox mode, recipient email must be verified
4. ✅ SMTP credentials are active in AWS SES

## Next Steps

Once the test succeeds:

1. **Set credentials in production:**
   - Firebase Functions: `firebase functions:secrets:set EMAIL_SMTP_USER`
   - Vercel: Add to environment variables

2. **Test the API route:**
   ```bash
   curl -X POST http://localhost:3000/api/email/send \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "to": "test@example.com",
       "subject": "Test",
       "html": "<h1>Test</h1>"
     }'
   ```

3. **Send the announcement email:**
   Use the `/api/email/admin/broadcast` endpoint with the `v2-announcement` template.

---

**Your SMTP Credentials:**
- Username: `AKIA3TD2SDYDYSEBUZB4`
- Password: `BDQAfaz8PgjAHwDsdUUWXmTCDiaeX45WOyuzW9yUPuOa`
- Host: `email-smtp.us-east-2.amazonaws.com`
- Port: `587`

