# PathGen v2 Email System — AWS SES Integration

Complete, production-ready email system for PathGen v2 using AWS SES via SMTP.

## 📋 Overview

This email system provides:
- ✅ AWS SES SMTP integration (Nodemailer)
- ✅ Template system with variable injection
- ✅ Usage tracking and rate limiting
- ✅ Error handling with retries
- ✅ Admin dashboard functions
- ✅ Deliverability features (unsubscribe, validation)
- ✅ Both Firebase Functions and Next.js API routes

## 🚀 Setup

### 1. Install Dependencies

**Firebase Functions:**
```bash
cd functions
npm install nodemailer html-to-text validator
```

**Next.js App:**
```bash
cd apps/web
npm install nodemailer html-to-text validator
```

### 2. Configure Environment Variables

**Required Environment Variables:**

```bash
# AWS SES SMTP Credentials
EMAIL_SMTP_USER=<your_aws_ses_smtp_username>
EMAIL_SMTP_PASS=<your_aws_ses_smtp_password>

# Email From Address
EMAIL_FROM="PathGen <no-reply@pathgen.gg>"
EMAIL_FROM_NAME="PathGen"  # Optional, parsed from EMAIL_FROM if not set
```

**For Firebase Functions:**
Set as Firebase secrets:
```bash
firebase functions:secrets:set EMAIL_SMTP_USER
firebase functions:secrets:set EMAIL_SMTP_PASS
firebase functions:secrets:set EMAIL_FROM
```

**For Vercel/Next.js:**
Add to Vercel environment variables or `.env.local`:
```bash
EMAIL_SMTP_USER=your_username
EMAIL_SMTP_PASS=your_password
EMAIL_FROM="PathGen <no-reply@pathgen.gg>"
```

### 3. AWS SES Configuration

1. **Verify Domain in AWS SES:**
   - Go to AWS SES Console
   - Verify domain: `pathgen.gg`
   - Set up DKIM, SPF, DMARC records

2. **Create SMTP Credentials:**
   - Go to SES → SMTP Settings
   - Create SMTP credentials
   - Use the username and password in environment variables

3. **Request Production Access (if in sandbox):**
   - AWS SES starts in sandbox mode
   - Request production access to send to any email

## 📁 Project Structure

```
functions/
├── src/
│   └── email/
│       ├── config.ts          # SMTP configuration
│       ├── validation.ts      # Email validation
│       ├── templates.ts       # Template loader & injection
│       ├── usage.ts           # Usage tracking & rate limits
│       ├── sender.ts          # Main email sending logic
│       └── admin.ts           # Admin functions
├── emails/
│   └── templates/
│       └── v2-announcement.html
└── package.json

apps/web/
├── app/api/email/
│   ├── send/route.ts          # Send email endpoint
│   └── admin/
│       ├── broadcast/route.ts # Broadcast to all users
│       ├── stats/route.ts     # Email statistics
│       ├── preview/route.ts   # Template preview/save
│       └── templates/route.ts # List templates
└── lib/
    └── email.ts               # Shared email utilities
```

## 🔧 Usage

### Send Email (API Route)

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
    html: '<h1>Welcome!</h1>',
    // OR use template:
    template: 'v2-announcement',
    variables: {
      username: 'John',
      cta_link: 'https://pathgen.dev'
    }
  })
});
```

### Send Email (Firebase Functions)

```typescript
import { sendEmail } from './email/sender';

const result = await sendEmail({
  to: 'user@example.com',
  subject: 'Welcome!',
  template: 'v2-announcement',
  variables: { username: 'John' },
  userId: 'user123' // For rate limiting
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
    variables: {
      username: '{{username}}' // Will be replaced per user
    }
  })
});
```

## 📊 Rate Limits

The system enforces:

- **Global:** 50 emails/minute, 500/day
- **Per User:** 5 triggered emails/day (password resets, etc.)
- **Admin Broadcasts:** Bypass rate limits

Rate limits are tracked in Firestore (`emailUsage` collection).

## 🎨 Email Templates

### Template Location

Templates can be stored in:
1. **Firestore** (`emailTemplates` collection) - Recommended for dynamic updates
2. **File System** (`functions/emails/templates/*.html`) - For static templates

### Template Variables

Use `{{variable}}` syntax:

```html
<h1>Hello {{username}}!</h1>
<p>Click <a href="{{cta_link}}">here</a> to get started.</p>
```

### Auto-Generated Features

All emails automatically include:
- ✅ Unsubscribe footer (required by Gmail)
- ✅ Contact info (pathgen.dev, Discord)
- ✅ Plain text version (auto-generated from HTML)

## 🔐 Security

- ✅ Never hardcode credentials (always use env vars)
- ✅ Email validation (regex + DNS check)
- ✅ Rate limiting to prevent abuse
- ✅ Sanitized error messages (never leak AWS credentials)
- ✅ Admin-only endpoints require authentication

## 📈 Monitoring

### Email Logs

All emails are logged to Firestore (`emailLogs` collection):
- `event`: "sent" | "failed" | "rejected"
- `messageId`: SES message ID
- `timestamp`: When sent
- `to`, `subject`, `userId`: Email details

### Statistics API

```typescript
// GET /api/email/admin/stats?days=7
const stats = await fetch('/api/email/admin/stats?days=7', {
  headers: { 'Authorization': `Bearer ${adminToken}` }
});
```

Returns:
- Usage stats (total sent, daily count, etc.)
- Deliverability stats (success rate, failures)
- Template count

## 🛠️ Admin Functions

### Preview Template

```typescript
// GET /api/email/admin/preview?template=v2-announcement&variables={"username":"John"}
```

### Save Template

```typescript
// POST /api/email/admin/preview
{
  "template": "v2-announcement",
  "html": "<html>...</html>"
}
```

### List Templates

```typescript
// GET /api/email/admin/templates
```

## 🐛 Error Handling

The system includes:

- **Retry Logic:** Up to 3 retries with exponential backoff
- **Error Logging:** All failures logged to Firestore
- **Safe Error Messages:** Never expose AWS credentials
- **SES Response Codes:** Logged for debugging

## 📝 Example: Sending Announcement Email

```typescript
import { sendEmail } from './lib/email';

// Send to single user
await sendEmail({
  to: 'user@example.com',
  subject: 'PathGen v2 is Here!',
  template: 'v2-announcement',
  variables: {
    username: 'John',
    unsubscribe_url: 'https://pathgen.dev/unsubscribe?email=user@example.com'
  }
});

// Broadcast to all users (admin)
import { broadcastEmail } from './lib/email';

await broadcastEmail({
  template: 'v2-announcement',
  subject: 'PathGen v2 is Here!',
  variables: {
    // Variables will be replaced per user if needed
  }
});
```

## ✅ Deliverability Checklist

Before sending production emails:

- [ ] Domain verified in AWS SES
- [ ] DKIM records configured
- [ ] SPF record configured
- [ ] DMARC policy set
- [ ] Unsubscribe footer included (auto-added)
- [ ] Contact info included (auto-added)
- [ ] Test emails sent to Gmail/Outlook
- [ ] Production access requested (if in sandbox)

## 🚨 Troubleshooting

### "EMAIL_SMTP_USER not set"
- Check environment variables are set
- For Firebase Functions: Use `firebase functions:secrets:set`
- For Vercel: Add to project settings

### "Rate limit exceeded"
- Check `emailUsage` collection in Firestore
- Wait for rate limit window to reset
- Use `skipRateLimit: true` for admin broadcasts

### "Template not found"
- Check template exists in Firestore (`emailTemplates` collection)
- Or check file system (`functions/emails/templates/`)
- Template name must match exactly

### Emails going to spam
- Verify DKIM/SPF/DMARC records
- Check email content (avoid spam trigger words)
- Ensure unsubscribe footer is present
- Warm up sending domain gradually

## 📚 API Reference

### POST /api/email/send
Send email to one or more recipients.

**Body:**
```json
{
  "to": "user@example.com" | ["user1@example.com", "user2@example.com"],
  "subject": "Email Subject",
  "html": "<html>...</html>",
  "text": "Plain text version", // Optional, auto-generated if not provided
  "template": "template-name", // Optional, use template instead of html
  "variables": { "key": "value" }, // Optional, for template variables
  "userId": "user123" // Optional, for rate limiting
}
```

### POST /api/email/admin/broadcast
Broadcast email to all users (admin only).

**Body:**
```json
{
  "template": "template-name",
  "subject": "Email Subject",
  "variables": { "key": "value" }
}
```

### GET /api/email/admin/stats
Get email system statistics (admin only).

**Query Params:**
- `days` (optional): Number of days to analyze (default: 7)

### GET /api/email/admin/preview
Preview email template with variables (admin only).

**Query Params:**
- `template`: Template name
- `variables`: JSON string of variables (optional)

### POST /api/email/admin/preview
Save or update email template (admin only).

**Body:**
```json
{
  "template": "template-name",
  "html": "<html>...</html>"
}
```

### GET /api/email/admin/templates
List all email templates (admin only).

---

**Built for PathGen v2 — Fortnite AI Coach**

