# 🚀 Complete Vercel Deployment Guide - PathGen V2

This guide covers everything needed to deploy PathGen V2 to Vercel, including the email system.

## 📋 Prerequisites

- Vercel account ([vercel.com](https://vercel.com))
- Git repository connected to Vercel
- Firebase project with Firestore enabled
- AWS SES SMTP credentials

## 🎯 Quick Setup Steps

### 1. Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New Project**
3. Import your Git repository
4. Vercel will auto-detect Next.js

### 2. Configure Root Directory

**IMPORTANT:** Set the root directory in Vercel Dashboard:

1. Go to **Settings** → **General**
2. Scroll to **Root Directory**
3. Click **Edit**
4. Set to: `apps/web`
5. Click **Save**

**OR** the `vercel.json` in the root already specifies this, but setting it in the dashboard is more reliable.

### 3. Set Environment Variables

Go to **Settings** → **Environment Variables** and add:

#### Required Email Variables

| Variable | Value | Environments |
|----------|-------|--------------|
| `EMAIL_SMTP_USER` | `AKIA3TD2SDYDYSEBUZB4` | ✅ Production, Preview, Development |
| `EMAIL_SMTP_PASS` | `BDQAfaz8PgjAHwDsdUUWXmTCDiaeX45WOyuzW9yUPuOa` | ✅ Production, Preview, Development |
| `EMAIL_FROM` | `support@pathgen.dev` | ✅ Production, Preview, Development |

**⚠️ Mark `EMAIL_SMTP_PASS` as Sensitive!**

#### Optional Email Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `SES_CONFIGURATION_SET` | `PathGen-Email-Events` | AWS SES Configuration Set (optional) |
| `EMAIL_FROM_NAME` | `PathGen` | Display name for sender (defaults to "PathGen") |

#### Firebase Variables (if using Firebase Admin)

| Variable | Value | Description |
|----------|-------|-------------|
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | `{...}` | Firebase Admin SDK JSON (stringified) |

#### Other Required Variables

Add any other environment variables your app needs (Discord OAuth, Stripe, etc.)

### 4. Deploy

After setting environment variables:

1. Go to **Deployments** tab
2. Click **Redeploy** on the latest deployment
3. Or push a new commit to trigger automatic deployment

## 📧 Email System on Vercel

### Email API Endpoints

All email endpoints are available at your Vercel domain:

- `POST /api/email/send` - Send individual email
- `POST /api/email/admin/broadcast` - Broadcast to all users (admin only)
- `GET /api/email/admin/stats` - Get email statistics (admin only)
- `GET /api/email/admin/preview?template=name` - Preview template (admin only)
- `POST /api/email/admin/preview` - Save/update template (admin only)
- `GET /api/email/admin/templates` - List all templates (admin only)

### Testing Email on Vercel

```bash
curl -X POST https://your-domain.vercel.app/api/email/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<h1>Test</h1>"
  }'
```

### Email Templates

Email templates are stored in **Firestore** (not file system), so they work seamlessly on Vercel:

- Collection: `emailTemplates`
- Document ID: Template name (e.g., `v2-announcement`)
- Fields: `html` (string), `updatedAt` (timestamp)

To upload a template:

```bash
POST /api/email/admin/preview
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json

{
  "template": "v2-announcement",
  "html": "<html>...</html>"
}
```

## 🔧 Vercel Configuration

The root `vercel.json` is configured with:

```json
{
  "version": 2,
  "rootDirectory": "apps/web",
  "buildCommand": "cd apps/web && npm install && npm run build",
  "outputDirectory": "apps/web/.next",
  "installCommand": "cd apps/web && npm install",
  "framework": "nextjs",
  "functions": {
    "apps/web/app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

This ensures:
- ✅ Next.js is built from `apps/web`
- ✅ API routes have 30s timeout (for email sending)
- ✅ All dependencies are installed correctly

## 🚨 Troubleshooting

### "EMAIL_SMTP_USER not set" Error

1. ✅ Check environment variables are set in Vercel
2. ✅ Verify they're set for the right environment (Production/Preview)
3. ✅ Redeploy after adding variables
4. ✅ Check variable names match exactly (case-sensitive)

### "Template not found" Error

1. ✅ Upload template to Firestore first via `/api/email/admin/preview`
2. ✅ Check template name matches exactly
3. ✅ Verify Firebase Admin is initialized correctly

### Build Failures

1. ✅ Check `apps/web/package.json` has all dependencies
2. ✅ Verify `rootDirectory` is set to `apps/web`
3. ✅ Check Vercel build logs for specific errors

### Email Not Sending

1. ✅ Verify AWS SES credentials are correct
2. ✅ Check AWS SES account is out of sandbox mode (if sending to unverified emails)
3. ✅ Check Vercel function logs for errors
4. ✅ Verify `EMAIL_FROM` domain is verified in AWS SES

## 📝 Quick Setup Script

Use the PowerShell script to add email variables:

```powershell
cd apps/web
.\add-email-env.ps1
```

Or manually via Vercel CLI:

```bash
cd apps/web
vercel env add EMAIL_SMTP_USER production
# Paste: AKIA3TD2SDYDYSEBUZB4

vercel env add EMAIL_SMTP_PASS production
# Paste: BDQAfaz8PgjAHwDsdUUWXmTCDiaeX45WOyuzW9yUPuOa

vercel env add EMAIL_FROM production
# Paste: support@pathgen.dev
```

## ✅ Verification Checklist

Before going live, verify:

- [ ] Root directory set to `apps/web` in Vercel Dashboard
- [ ] All environment variables added (Production, Preview, Development)
- [ ] Email credentials are correct
- [ ] Firebase Admin initialized (if using Firestore)
- [ ] Test email sent successfully
- [ ] Build completes without errors
- [ ] API routes respond correctly

## 🎉 You're Done!

Your PathGen V2 app is now deployed on Vercel with full email functionality!

**Next Steps:**
1. Upload email templates to Firestore
2. Test email sending via API
3. Set up monitoring/alerts for email failures
4. Configure AWS SES bounce/complaint handling

---

**Need Help?**
- Check Vercel logs: Dashboard → Deployments → [Latest] → Functions
- Check AWS SES logs: AWS Console → SES → Configuration Sets
- Check Firestore logs: Firebase Console → Firestore → Usage

