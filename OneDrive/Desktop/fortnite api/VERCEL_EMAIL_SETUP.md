# Vercel Email System Setup

## Environment Variables Required

Add these environment variables in your Vercel project settings:

### Step 1: Go to Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `pathgen` (or your project name)
3. Go to **Settings** → **Environment Variables**

### Step 2: Add Email Environment Variables

Add these three variables:

**1. EMAIL_SMTP_USER**
```
AKIA3TD2SDYDYSEBUZB4
```

**2. EMAIL_SMTP_PASS**
```
BDQAfaz8PgjAHwDsdUUWXmTCDiaeX45WOyuzW9yUPuOa
```

**3. EMAIL_FROM**
```
support@pathgen.dev
```

### Step 3: Set for All Environments

Make sure to set these for:
- ✅ **Production**
- ✅ **Preview**
- ✅ **Development**

### Step 4: Optional - Configuration Set

If you want to use a specific configuration set:
```
SES_CONFIGURATION_SET=PathGen-Email-Events
```

## Verify Setup

After adding environment variables:

1. **Redeploy your Vercel project:**
   - Go to **Deployments** tab
   - Click **Redeploy** on the latest deployment
   - Or push a new commit to trigger a deployment

2. **Test the email API:**
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

## Quick Setup Script

You can also set these via Vercel CLI:

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Link to your project
vercel link

# Set environment variables
vercel env add EMAIL_SMTP_USER production
# Paste: AKIA3TD2SDYDYSEBUZB4

vercel env add EMAIL_SMTP_PASS production
# Paste: BDQAfaz8PgjAHwDsdUUWXmTCDiaeX45WOyuzW9yUPuOa

vercel env add EMAIL_FROM production
# Paste: support@pathgen.dev
```

## Troubleshooting

**Email not sending:**
- ✅ Check environment variables are set correctly
- ✅ Verify they're set for the right environment (Production/Preview)
- ✅ Redeploy after adding variables
- ✅ Check Vercel function logs for errors

**"EMAIL_SMTP_USER not set" error:**
- ✅ Make sure variables are added to Vercel
- ✅ Redeploy the project after adding variables
- ✅ Check variable names match exactly (case-sensitive)

## Next Steps

1. ✅ Add environment variables to Vercel
2. ✅ Redeploy your project
3. ✅ Test email sending via `/api/email/send`
4. ✅ Upload announcement template to Firestore
5. ✅ Send announcement email via `/api/email/admin/broadcast`

---

**Your Email Credentials:**
- SMTP User: `AKIA3TD2SDYDYSEBUZB4`
- SMTP Pass: `BDQAfaz8PgjAHwDsdUUWXmTCDiaeX45WOyuzW9yUPuOa`
- From: `support@pathgen.dev`

