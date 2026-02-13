# Production Readiness Checklist

## ✅ Gmail Email Memory Ingestion System

### Current Status: **READY FOR PRODUCTION** ✅

## 🔒 Security

- ✅ OAuth2 credentials stored in environment variables
- ✅ Refresh tokens not exposed in responses
- ✅ Sender validation (only allowed senders processed)
- ✅ Account validation (only jlbender2005 account)
- ✅ No sensitive data in logs (production mode)
- ✅ Error messages sanitized in production

## ⚙️ Configuration

### Required Environment Variables

**For Gmail API:**
```bash
GMAIL_CLIENT_ID=your_client_id
GMAIL_CLIENT_SECRET=your_client_secret
GMAIL_REDIRECT_URI=https://your-domain.vercel.app/api/email/gmail-callback
```

**For OpenAI (Memory Worker):**
```bash
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o-mini  # Optional, defaults to gpt-4o-mini
```

### Vercel Setup

1. **Add Environment Variables:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all required variables above
   - Set for: Production, Preview, Development

2. **Function Timeout:**
   - Gmail reader: May need up to 30 seconds (default is 10s)
   - Memory worker: Usually < 5 seconds
   - Update `vercel.json` if needed:
   ```json
   {
     "functions": {
       "apps/web/app/api/email/**/*.ts": {
         "maxDuration": 30
       }
     }
   }
   ```

## 🚀 Production Deployment

### 1. Build & Deploy
```bash
cd apps/web
npm run build
vercel deploy --prod
```

### 2. Verify Environment Variables
- Check all env vars are set in Vercel
- Test endpoints after deployment

### 3. Test Endpoints
```bash
# Test Gmail reader
curl -X POST https://your-domain.vercel.app/api/email/gmail-reader \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "YOUR_REFRESH_TOKEN",
    "query": "is:unread",
    "max_results": 5,
    "process_memory": true
  }'
```

## 📊 Monitoring

### Logs to Monitor
- `[GMAIL] Memory extracted for...` - Successful extractions
- `[ERROR] Email memory ingestion failed` - Processing errors
- `[ERROR] Gmail reader failed` - Gmail API errors

### Error Handling
- ✅ Graceful degradation (returns IGNORE_EMAIL on errors)
- ✅ Continues processing other emails if one fails
- ✅ Detailed error logging in development
- ✅ Sanitized errors in production

## 🔄 Automation

### Option 1: Vercel Cron Jobs
Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/email/gmail-reader",
    "schedule": "0 */6 * * *"
  }]
}
```

### Option 2: External Cron Service
- Use cron-job.org or similar
- Call endpoint every 6 hours
- Pass refresh token in request body

### Option 3: Webhook (Gmail Push Notifications)
- Requires Google Cloud Pub/Sub setup
- More complex but real-time
- See Gmail API docs for setup

## ⚠️ Known Limitations

1. **Refresh Token Expiry:**
   - Refresh tokens expire after ~7 days (604799 seconds)
   - Need to re-authorize periodically
   - Consider storing refresh token securely and auto-refreshing

2. **Rate Limits:**
   - Gmail API: 1 billion quota units/day (plenty for email reading)
   - OpenAI API: Depends on your plan
   - No rate limiting implemented (add if needed)

3. **Email Content Size:**
   - Limited to 8000 characters to prevent token overflow
   - Very long emails will be truncated

4. **Concurrent Processing:**
   - Processes emails sequentially
   - Could be parallelized for better performance

## 🐛 Troubleshooting

### 500 Errors
- Check server logs for detailed error messages
- Verify OPENAI_API_KEY is set
- Check refresh token is valid
- Verify Gmail API is enabled

### Memory Not Extracted
- Check if sender is in allowed list
- Verify email.account == "jlbender2005"
- Check OpenAI API is working
- Review server logs for errors

### Gmail API Errors
- 401: Refresh token expired, get new one
- 403: Check OAuth consent screen setup
- 429: Rate limit exceeded, add delays

## ✅ Production Checklist

- [x] Environment variables configured
- [x] Error handling implemented
- [x] Logging configured
- [x] Security measures in place
- [x] Content length limits
- [x] Graceful error handling
- [x] Tested in development
- [ ] Deployed to production
- [ ] Production endpoints tested
- [ ] Monitoring set up
- [ ] Automation configured (cron/webhook)

---

**Status:** Ready for production deployment! 🚀

