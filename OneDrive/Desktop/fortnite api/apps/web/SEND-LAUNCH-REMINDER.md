# Send Launch Reminder Emails

## 🚀 Quick Start

Send "4 Days Away" launch reminder emails to all whitelisted email addresses.

## Method 1: API Endpoint (Recommended)

### Using curl:
```bash
curl -X POST https://pathgen.dev/api/email/send-launch-reminder \
  -H "Content-Type: application/json"
```

### Using the script:
```bash
node apps/web/scripts/send-launch-reminder.js
```

### Using browser/Postman:
1. Open: `https://pathgen.dev/api/email/send-launch-reminder`
2. Method: `POST`
3. Headers: `Content-Type: application/json`
4. Body: `{}` (empty JSON object)

## Method 2: Local Development

If running locally:
```bash
# Start your Next.js server first
npm run dev

# Then in another terminal:
curl -X POST http://localhost:3000/api/email/send-launch-reminder \
  -H "Content-Type: application/json"
```

## 📧 Email Details

- **Subject**: 🚀 PathGen v2 Launch - 4 Days Away! Get Ready!
- **Recipients**: All emails in `apps/web/lib/email-whitelist.ts` (123 emails)
- **Content**: Launch countdown message with features preview
- **Sending**: Individual emails (better tracking and personalization)

## 📊 Response Format

```json
{
  "success": true,
  "message": "Launch reminder emails sent",
  "stats": {
    "totalEmails": 123,
    "sent": 123,
    "failed": 0,
    "successRate": "100.00%"
  },
  "results": [...]
}
```

## ⚠️ Important Notes

1. **Rate Limiting**: Emails are sent in batches of 10 with 500ms delays to avoid AWS SES rate limits
2. **Personalization**: Each email gets a personalized unsubscribe URL
3. **Tracking**: Individual sending allows better tracking of successes/failures
4. **Environment**: Make sure `EMAIL_SMTP_USER` and `EMAIL_SMTP_PASS` are set

## 🔒 Security (Optional)

To add authentication, uncomment the auth check in `apps/web/app/api/email/send-launch-reminder/route.ts`:

```typescript
const authHeader = req.headers.get('authorization');
if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

Then call with:
```bash
curl -X POST https://pathgen.dev/api/email/send-launch-reminder \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET"
```

## 📝 Email Template

The email includes:
- 🚀 "4 Days Away!" header
- Feature highlights (AI Coaching, Replay Analysis, Voice, Competitive Insights)
- CTA button to pathgen.dev
- Unsubscribe link
- PathGen branding

## 🐛 Troubleshooting

- **"EMAIL_SMTP_USER and EMAIL_SMTP_PASS must be set"**: Check your `.env.local` file
- **Rate limit errors**: The script automatically handles batching and delays
- **Some emails fail**: Check the `failedEmails` array in the response
