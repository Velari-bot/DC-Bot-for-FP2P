# 🚀 Vercel Quick Start Guide

Get PathGen V2 deployed on Vercel in 5 minutes.

## Step 1: Connect Repository

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **Add New Project**
3. Import your Git repository
4. Vercel will auto-detect Next.js ✅

## Step 2: Set Root Directory

**IMPORTANT:** In Vercel Dashboard:
- Go to **Settings** → **General**
- Set **Root Directory** to: `apps/web`
- Click **Save**

## Step 3: Add Email Environment Variables

### Option A: Use PowerShell Script (Recommended)

```powershell
cd apps/web
.\setup-vercel-email.ps1
```

### Option B: Manual via Dashboard

1. Go to **Settings** → **Environment Variables**
2. Add these three variables:

| Variable | Value | Environments |
|----------|-------|--------------|
| `EMAIL_SMTP_USER` | `AKIA3TD2SDYDYSEBUZB4` | ✅ Production, Preview, Development |
| `EMAIL_SMTP_PASS` | `BDQAfaz8PgjAHwDsdUUWXmTCDiaeX45WOyuzW9yUPuOa` | ✅ Production, Preview, Development |
| `EMAIL_FROM` | `support@pathgen.dev` | ✅ Production, Preview, Development |

**⚠️ Mark `EMAIL_SMTP_PASS` as Sensitive!**

### Option C: Use Vercel CLI

```bash
cd apps/web
vercel login
vercel env add EMAIL_SMTP_USER production
# Paste: AKIA3TD2SDYDYSEBUZB4

vercel env add EMAIL_SMTP_PASS production
# Paste: BDQAfaz8PgjAHwDsdUUWXmTCDiaeX45WOyuzW9yUPuOa

vercel env add EMAIL_FROM production
# Paste: support@pathgen.dev
```

## Step 4: Deploy

1. Go to **Deployments** tab
2. Click **Redeploy** on latest deployment
3. Or push a new commit

## Step 5: Test

```bash
curl -X POST https://your-domain.vercel.app/api/email/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"to":"test@example.com","subject":"Test","html":"<h1>Test</h1>"}'
```

## ✅ Done!

Your app is now live on Vercel with email functionality!

---

**Need more details?** See `VERCEL_DEPLOYMENT_COMPLETE.md`

