# 🚀 PathGen v2 Email System — Quick Setup Guide

## ✅ What's Been Built

A complete, production-ready AWS SES email system for PathGen v2 with:

- ✅ AWS SES SMTP integration via Nodemailer
- ✅ Template system with variable injection
- ✅ Usage tracking & rate limiting (Firestore)
- ✅ Error handling with retries
- ✅ Admin dashboard functions
- ✅ Deliverability features (unsubscribe, validation)
- ✅ Next.js API routes + Firebase Functions support

## 📦 Installation

### 1. Install Dependencies

**Firebase Functions:**
```bash
cd functions
npm install
```

**Next.js App:**
```bash
cd apps/web
npm install
```

### 2. Set Environment Variables

**Required:**
```bash
EMAIL_SMTP_USER=<your_aws_ses_smtp_username>
EMAIL_SMTP_PASS=<your_aws_ses_smtp_password>
EMAIL_FROM="PathGen <no-reply@pathgen.gg>"
```

**For Firebase Functions (Cloud Functions):**
```bash
firebase functions:secrets:set EMAIL_SMTP_USER
# Paste your SMTP username when prompted

firebase functions:secrets:set EMAIL_SMTP_PASS
# Paste your SMTP password when prompted

firebase functions:secrets:set EMAIL_FROM
# Paste: PathGen <no-reply@pathgen.gg>
```

**For Vercel/Next.js:**
Add to Vercel project settings → Environment Variables:
- `EMAIL_SMTP_USER`
- `EMAIL_SMTP_PASS`
- `EMAIL_FROM`

Or add to `.env.local` for local development:
```bash
EMAIL_SMTP_USER=your_username
EMAIL_SMTP_PASS=your_password
EMAIL_FROM="PathGen <no-reply@pathgen.gg>"
```

## 🔧 AWS SES Setup

### Step 1: Verify Domain

1. Go to [AWS SES Console](https://console.aws.amazon.com/ses/)
2. Navigate to **Verified identities**
3. Click **Create identity**
4. Select **Domain**
5. Enter: `pathgen.gg`
6. Follow DNS setup instructions:
   - Add DKIM records
   - Add SPF record
   - Set up DMARC policy

### Step 2: Create SMTP Credentials

1. In AWS SES Console, go to **SMTP settings**
2. Click **Create SMTP credentials**
3. Save the **SMTP username** and **SMTP password**
4. Use these in your environment variables

### Step 3: Request Production Access (if needed)

If AWS SES is in sandbox mode:
1. Go to **Account dashboard**
2. Click **Request production access**
3. Fill out the form
4. Wait for approval (usually 24-48 hours)

## 📧 Using the Email System

### Send Email via API

```typescript
// POST /api/email/send
const response = await fetch('/api/email/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}`
  },
  body: JSON.stringify({
    to: 'user@example.com',
    subject: 'Welcome to PathGen!',
    template: 'v2-announcement',
    variables: {
      username: 'John',
      cta_link: 'https://pathgen.dev'
    }
  })
});
```

### Broadcast to All Users (Admin)

```typescript
// POST /api/email/admin/broadcast
const response = await fetch('/api/email/admin/broadcast', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify({
    template: 'v2-announcement',
    subject: 'PathGen v2 is Here!',
    variables: {}
  })
});
```

## 📊 Rate Limits

The system automatically enforces:
- **50 emails/minute** (global)
- **500 emails/day** (global)
- **5 emails/day per user** (for triggered emails)

Admin broadcasts bypass rate limits.

## 🎨 Email Templates

### Using the Announcement Template

The `v2-announcement.html` template is already in:
- `functions/emails/templates/v2-announcement.html`
- Can be uploaded to Firestore via admin API

### Template Variables

Use `{{variable}}` syntax in templates:
```html
<h1>Hello {{username}}!</h1>
<a href="{{cta_link}}">Get Started</a>
```

### Auto-Added Features

All emails automatically include:
- ✅ Unsubscribe footer (Gmail compliance)
- ✅ Contact info (pathgen.dev, Discord)
- ✅ Plain text version (auto-generated)

## 🔍 Testing

### Test Email Sending

1. Set up environment variables
2. Use the API route:
```bash
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<h1>Test</h1>"
  }'
```

### Check Email Logs

View logs in Firestore:
- Collection: `emailLogs`
- Fields: `event`, `to`, `subject`, `messageId`, `timestamp`

### View Statistics

```bash
curl http://localhost:3000/api/email/admin/stats?days=7 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## 📁 File Structure

```
functions/
├── src/email/          # Email system core
│   ├── config.ts       # SMTP configuration
│   ├── validation.ts   # Email validation
│   ├── templates.ts    # Template system
│   ├── usage.ts        # Usage tracking
│   ├── sender.ts       # Main sending logic
│   └── admin.ts        # Admin functions
├── emails/templates/   # Email templates
│   └── v2-announcement.html
└── package.json

apps/web/
├── app/api/email/      # API routes
│   ├── send/
│   └── admin/
├── lib/email.ts       # Shared utilities
└── package.json
```

## 🚨 Troubleshooting

### "EMAIL_SMTP_USER not set"
- ✅ Check environment variables are set
- ✅ For Firebase: Use `firebase functions:secrets:set`
- ✅ For Vercel: Add to project settings

### "Rate limit exceeded"
- ✅ Check `emailUsage` collection in Firestore
- ✅ Wait for rate limit window to reset
- ✅ Use admin broadcast (bypasses limits)

### "Template not found"
- ✅ Upload template to Firestore via admin API
- ✅ Or place in `functions/emails/templates/`
- ✅ Template name must match exactly

### Emails going to spam
- ✅ Verify DKIM/SPF/DMARC records
- ✅ Check email content (avoid spam words)
- ✅ Ensure unsubscribe footer present (auto-added)
- ✅ Warm up sending domain gradually

## 📚 Full Documentation

See `functions/EMAIL_SYSTEM_README.md` for complete documentation.

## ✅ Next Steps

1. ✅ Install dependencies (`npm install` in both directories)
2. ✅ Set environment variables
3. ✅ Configure AWS SES (verify domain, create SMTP credentials)
4. ✅ Test sending an email
5. ✅ Upload announcement template to Firestore (optional)
6. ✅ Start sending emails!

---

**Ready to send emails! 🎉**

