# Setting Firebase Secrets for Email System

## Manual Method (Recommended)

When you run `firebase functions:secrets:set`, you need to **paste the actual value** when prompted.

### Step 1: Set SMTP Username

```powershell
firebase functions:secrets:set EMAIL_SMTP_USER
```

When prompted, paste: `AKIA3TD2SDYDYSEBUZB4`

### Step 2: Set SMTP Password

```powershell
firebase functions:secrets:set EMAIL_SMTP_PASS
```

When prompted, paste: `BDQAfaz8PgjAHwDsdUUWXmTCDiaeX45WOyuzW9yUPuOa`

**Important:** The password will be masked (hidden) as you type - this is normal!

### Step 3: Set From Address

```powershell
firebase functions:secrets:set EMAIL_FROM
```

When prompted, paste: `support@pathgen.dev`

## Quick Copy-Paste Values

**EMAIL_SMTP_USER:**
```
AKIA3TD2SDYDYSEBUZB4
```

**EMAIL_SMTP_PASS:**
```
BDQAfaz8PgjAHwDsdUUWXmTCDiaeX45WOyuzW9yUPuOa
```

**EMAIL_FROM:**
```
support@pathgen.dev
```

## Verify Secrets Are Set

```powershell
firebase functions:secrets:access EMAIL_SMTP_USER
firebase functions:secrets:access EMAIL_SMTP_PASS
firebase functions:secrets:access EMAIL_FROM
```

## Troubleshooting

**Error: "Secret Payload cannot be empty"**
- You didn't paste a value when prompted
- Run the command again and make sure to paste the value

**Password is hidden when typing**
- This is normal and expected for security
- Just paste the password and press Enter

## After Setting Secrets

1. Redeploy Firebase Functions:
   ```powershell
   firebase deploy --only functions
   ```

2. Test the email system to verify it works with secrets.

