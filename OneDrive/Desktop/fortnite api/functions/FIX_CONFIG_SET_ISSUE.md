# Fix AWS SES Configuration Set Error

## Problem

One email failed with:
```
554 Configuration Set does not exist: Configuration set <my-first-configuration-set> does not exist.
```

## Solution

Your AWS SES account has a **default configuration set** set to `my-first-configuration-set` which doesn't exist.

### Fix Option 1: Remove Default Configuration Set (Recommended)

1. Go to **AWS SES Console**: https://console.aws.amazon.com/ses/
2. Click **Configuration sets** in the left sidebar
3. Look for **Account-level default configuration set** setting
4. **Remove** or **clear** the default configuration set
5. Save changes

### Fix Option 2: Create the Missing Configuration Set

1. Go to **AWS SES Console** → **Configuration sets**
2. Click **Create configuration set**
3. Name it: `my-first-configuration-set`
4. Set up event destinations if needed (optional)
5. Save

### Fix Option 3: Change Default to Your Existing Set

1. Go to **AWS SES Console** → **Configuration sets**
2. Find **Account-level default configuration set**
3. Change it to: `PathGen-Email-Events` (your existing set)
4. Save

## Resend Failed Email

After fixing the configuration set issue, resend to the failed email:

```powershell
cd functions
$env:EMAIL_SMTP_USER = "AKIA3TD2SDYDYSEBUZB4"
$env:EMAIL_SMTP_PASS = "BDQAfaz8PgjAHwDsdUUWXmTCDiaeX45WOyuzW9yUPuOa"
$env:EMAIL_FROM = "support@pathgen.dev"
node resend-failed-email.js
```

## Note

65 out of 66 emails sent successfully! Only `darelsubed@gmail.com` failed due to this configuration set issue.

