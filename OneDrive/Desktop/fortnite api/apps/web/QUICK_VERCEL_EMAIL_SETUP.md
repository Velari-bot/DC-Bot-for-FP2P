# Quick Vercel Email Setup

## Option 1: Use the Script (Easiest)

From the `apps/web` directory:

```powershell
cd apps/web
.\add-email-env.ps1
```

This will automatically add all email environment variables to Vercel for Production, Preview, and Development.

## Option 2: Manual Setup via Vercel Dashboard

1. Go to: https://vercel.com/velari-bots-projects/pathgen/settings/environment-variables

2. Click **"Add New"** for each variable:

| Variable Name | Value | Environments |
|--------------|-------|---------------|
| `EMAIL_SMTP_USER` | `AKIA3TD2SDYDYSEBUZB4` | ✅ Production, Preview, Development |
| `EMAIL_SMTP_PASS` | `BDQAfaz8PgjAHwDsdUUWXmTCDiaeX45WOyuzW9yUPuOa` | ✅ Production, Preview, Development |
| `EMAIL_FROM` | `support@pathgen.dev` | ✅ Production, Preview, Development |

3. For each variable:
   - ✅ Mark as **Sensitive** (especially for EMAIL_SMTP_PASS)
   - ✅ Select **Production**, **Preview**, and **Development**
   - Click **Save**

## Option 3: Vercel CLI

```powershell
# Make sure you're in the project root or apps/web
vercel env add EMAIL_SMTP_USER production
# Paste: AKIA3TD2SDYDYSEBUZB4
# Select: Production, Preview, Development

vercel env add EMAIL_SMTP_PASS production
# Paste: BDQAfaz8PgjAHwDsdUUWXmTCDiaeX45WOyuzW9yUPuOa
# Select: Production, Preview, Development
# Mark as sensitive: yes

vercel env add EMAIL_FROM production
# Paste: support@pathgen.dev
# Select: Production, Preview, Development
```

## After Adding Variables

**Important:** You must redeploy for changes to take effect!

```powershell
# From project root
vercel --prod
```

Or trigger a redeploy from Vercel dashboard:
1. Go to **Deployments** tab
2. Click **⋯** (three dots) on latest deployment
3. Click **Redeploy**

## Verify Setup

After redeploying, test the email API:

```bash
curl -X POST https://your-domain.vercel.app/api/email/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<h1>Test</h1>"
  }'
```

## Troubleshooting

**"EMAIL_SMTP_USER not set" error:**
- ✅ Check variables are added to Vercel
- ✅ Verify they're set for the right environment (Production/Preview/Development)
- ✅ **Redeploy** after adding variables (this is required!)

**Email not sending:**
- ✅ Check Vercel function logs for errors
- ✅ Verify SMTP credentials are correct
- ✅ Check AWS SES is not in sandbox mode (or verify recipient email)

---

**Quick Reference - Your Credentials:**
- SMTP User: `AKIA3TD2SDYDYSEBUZB4`
- SMTP Pass: `BDQAfaz8PgjAHwDsdUUWXmTCDiaeX45WOyuzW9yUPuOa`
- From: `support@pathgen.dev`

