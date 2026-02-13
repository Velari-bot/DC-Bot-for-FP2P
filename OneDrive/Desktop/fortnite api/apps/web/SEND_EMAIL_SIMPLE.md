# 📧 Send Launch Email - Simple Method (Direct SES)

This script sends emails directly using AWS SES SMTP credentials - no API authentication needed!

## Quick Start

### Step 1: Set Environment Variables

In PowerShell, set your SES credentials:

```powershell
$env:EMAIL_SMTP_USER = "your_aws_ses_smtp_username"
$env:EMAIL_SMTP_PASS = "your_aws_ses_smtp_password"
$env:EMAIL_FROM = "no-reply@pathgen.dev"
$env:EMAIL_FROM_NAME = "PathGen"
```

### Step 2: Run the Script

**Test with a single email:**
```powershell
cd apps/web
.\send-launch-email-simple.ps1 -TestEmail "your-email@example.com"
```

**Send to multiple emails:**
```powershell
.\send-launch-email-simple.ps1 -To "email1@example.com", "email2@example.com", "email3@example.com"
```

## Getting SES Credentials

1. Go to AWS SES Console: https://console.aws.amazon.com/ses/
2. Navigate to **SMTP Settings**
3. Click **Create SMTP credentials**
4. Copy the **SMTP username** and **SMTP password**
5. Use these in the environment variables above

## Sending to All Users

If you want to send to all users from Firestore, you can combine this with a simple query:

```powershell
# First, get all user emails (you'd need to export from Firestore or use Firebase CLI)
$allEmails = @("user1@example.com", "user2@example.com", ...) # Your list

# Then send
.\send-launch-email-simple.ps1 -To $allEmails
```

Or create a CSV file with emails and read it:

```powershell
$emails = Import-Csv "emails.csv" | Select-Object -ExpandProperty Email
.\send-launch-email-simple.ps1 -To $emails
```

## Advantages of This Method

✅ **No authentication needed** - Just SES credentials  
✅ **Works offline** - Doesn't need API endpoint  
✅ **Simple** - Direct SMTP sending  
✅ **Fast** - No API overhead  

## Notes

- Emails are sent in sequence with small delays to avoid rate limits
- The script uses AWS SES SMTP endpoint: `email-smtp.us-east-2.amazonaws.com:587`
- Make sure your SES account is out of sandbox mode to send to any email address
- The script automatically creates both HTML and plain text versions

