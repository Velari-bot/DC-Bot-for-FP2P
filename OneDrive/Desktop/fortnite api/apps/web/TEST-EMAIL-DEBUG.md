# Email Debugging Guide

## Issue: Emails showing as "sent" but not arriving

### Possible Causes:

1. **AWS SES Sandbox Mode** (Most Likely)
   - In sandbox mode, AWS SES only allows sending to verified email addresses
   - Check: Go to AWS SES Console → Account dashboard
   - If it says "Sandbox", you need to request production access OR verify each recipient email

2. **From Address Not Verified**
   - The `support@pathgen.dev` address must be verified in AWS SES
   - Check: AWS SES → Verified identities → Should see `pathgen.dev` or `support@pathgen.dev`

3. **Emails Going to Spam**
   - Check spam/junk folders
   - Check if SPF/DKIM/DMARC are properly configured

## Test Email Endpoint

Test sending to a single email to debug:

```powershell
# Replace YOUR_EMAIL with your actual email
Invoke-WebRequest -Uri "http://localhost:3000/api/email/test-send" -Method POST -ContentType "application/json" -Body '{"email":"YOUR_EMAIL@example.com"}'
```

This will show:
- Whether the email was accepted by AWS SES
- Any rejection reasons
- Message ID for tracking

## Check AWS SES Status

1. Go to: https://console.aws.amazon.com/ses/
2. Check **Account dashboard**:
   - If it says "Sandbox", that's the problem
   - Request production access (takes 24-48 hours)
   - OR verify each recipient email individually

3. Check **Verified identities**:
   - `pathgen.dev` should be verified
   - `support@pathgen.dev` should be verified (if using that)

## Check Email Logs

The updated code now logs:
- `accepted` array - emails AWS SES accepted
- `rejected` array - emails AWS SES rejected
- Rejection reasons

Check your server logs for `[EMAIL] Send result:` to see what AWS SES is actually doing.

## Quick Fix: Verify Test Emails

If in sandbox mode, verify your test emails:
1. AWS SES Console → Verified identities
2. Create identity → Email address
3. Enter your test email
4. Click the verification link in the email
5. Then try sending again
