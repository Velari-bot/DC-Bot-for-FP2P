# Email Deliverability Fix - Land in Primary Inbox

This document explains all the changes made to fix email deliverability and ensure emails land in the **Primary** inbox instead of **Promotions**.

## ✅ What Was Fixed

### 1. Removed Promotional Headers

**Before:**
- `Precedence: bulk` header (triggers Promotions tab)

**After:**
- Removed `Precedence: bulk` header
- Added `X-Entity-Ref-ID` to make emails look transactional
- Headers now optimized for Primary inbox delivery

**Files Changed:**
- `functions/src/email/sender.ts` - Removed `Precedence: bulk`
- `apps/web/lib/email.ts` - Already had fix, verified

### 2. Created Plain Text Email System

**New Files:**
- `functions/src/email/plain-text.ts` - Plain text email generator
- `apps/web/lib/email-plain.ts` - Next.js version

**Features:**
- Generates personal, conversational emails
- No buttons, no CTAs, no promotional language
- Includes questions to encourage replies (Gmail loves this)
- Minimal HTML styling (looks like plain text)

**Usage:**
```typescript
import { generatePlainTextEmail, generatePlainTextHTML } from '@/lib/email-plain';
import { sendEmail } from '@/lib/email';

const text = generatePlainTextEmail({
  greeting: "Hey there,",
  body: "I wanted to give you a quick update about PathGen v2...",
  question: "Have you been practicing your edits lately?",
  signature: "- Ben from PathGen",
});

const html = generatePlainTextHTML({
  greeting: "Hey there,",
  body: "I wanted to give you a quick update about PathGen v2...",
  question: "Have you been practicing your edits lately?",
  signature: "- Ben from PathGen",
});

await sendEmail({
  to: email,
  subject: "Quick update from PathGen", // NO EMOJIS in subject!
  html,
  text,
});
```

### 3. Domain Warm-Up System

**New File:**
- `functions/src/email/warmup.ts` - Domain warm-up logic

**How It Works:**
- Days 1-10: Gradually increase from 50 to 150 emails/day
- Personal emails only (no links, no CTAs)
- Tracks warm-up progress in Firestore

**Usage:**
```typescript
import { sendWarmupEmail, isWarmupPeriod } from '@/functions/src/email/warmup';

if (await isWarmupPeriod()) {
  await sendWarmupEmail(email, {
    personalMessage: "I wanted to reach out and see how your practice is going...",
    askQuestion: true,
  });
}
```

### 4. Engagement Tracking

**New Files:**
- `functions/src/email/engagement.ts` - Engagement tracking
- `apps/web/app/api/email/track/open/route.ts` - Open tracking endpoint
- `apps/web/app/api/email/track/click/route.ts` - Click tracking endpoint

**Features:**
- Tracks opens (via 1x1 pixel)
- Tracks clicks (via redirect URLs)
- Tracks replies (via webhook)
- Stores in Firestore for analytics

**Automatic:**
- All emails now include tracking pixel
- All links are automatically wrapped with tracking

### 5. Email Content Guidelines

**❌ AVOID:**
- Emojis in subject lines (🚀, 🔥, etc.)
- Buttons/CTAs
- "Sign up now", "Buy today", "Limited time"
- More than 2 links
- Heavy images
- Promotional language

**✅ USE:**
- Plain text or plain text-style HTML
- Personal greeting ("Hey there,")
- Conversational tone
- Questions to encourage replies
- Minimal links (1-2 max)
- No buttons (just text links)

## 📋 DNS Authentication Checklist

Make sure these DNS records are set up correctly:

### SPF Record
```
Type: TXT
Name: @ (or pathgen.dev)
Value: v=spf1 include:amazonses.com ~all
```

### DKIM Records
Get from AWS SES Console → Verified identities → pathgen.dev → DKIM tab
Add all 3 CNAME records to DNS.

### DMARC Record
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:support@pathgen.dev
```

**Verify:**
- SPF: https://mxtoolbox.com/spf.aspx?domain=pathgen.dev
- DKIM: https://mxtoolbox.com/dkim.aspx?domain=pathgen.dev
- DMARC: https://mxtoolbox.com/dmarc.aspx?domain=pathgen.dev

## 🚀 Domain Warm-Up Plan

**Days 1-10:**
- Day 1: 50 emails (personal, no links)
- Day 2: 60 emails
- Day 3: 70 emails
- Day 4: 80 emails
- Day 5: 90 emails
- Day 6: 100 emails
- Day 7: 110 emails
- Day 8: 120 emails
- Day 9: 135 emails
- Day 10: 150 emails

**After Day 10:**
- Can send normal volume
- Still use plain text for best results
- Monitor engagement rates

## 📊 Engagement Tracking

**Track Opens:**
- Automatic via 1x1 pixel in all emails
- Endpoint: `/api/email/track/open?messageId=...&email=...`

**Track Clicks:**
- Automatic via link wrapping
- Endpoint: `/api/email/track/click?messageId=...&email=...&url=...`

**View Stats:**
```typescript
import { getEmailEngagementStats } from '@/functions/src/email/engagement';

const stats = await getEmailEngagementStats(messageId);
// Returns: { opens, clicks, replies, openRate, clickRate, replyRate }
```

## 🎯 Best Practices

### Subject Lines
**❌ Bad:**
- "🚀 PathGen v2 is Here! Sign Up Now!"
- "🔥 Limited Time Offer - Get Started Today!"

**✅ Good:**
- "Quick update from PathGen"
- "PathGen v2 is launching soon"
- "How's your Fortnite practice going?"

### Email Content
**❌ Bad:**
```html
<h1>🔥 NEW UPDATE! CLICK HERE TO LEARN MORE! 🔥</h1>
<button>Sign Up Now</button>
```

**✅ Good:**
```html
<p>Hey there,</p>
<p>I wanted to give you a quick update about PathGen v2...</p>
<p>Have you been practicing your edits lately?</p>
<p>- Ben from PathGen</p>
```

### Links
- Maximum 2 links per email
- Use plain text links (not buttons)
- Make links contextual and natural

## 🔍 Monitoring

**Check Email Logs:**
```typescript
import { getEmailStats } from '@/lib/email';

const stats = await getEmailStats();
// Returns: usage, deliverability, templates
```

**Check Engagement:**
- Firestore: `emailEngagement` collection
- Firestore: `emailLogs` collection (has `opened`, `clicked`, `replied` fields)

## 📝 Example: Sending a Personal Email

```typescript
import { generatePlainTextEmail, generatePlainTextHTML } from '@/lib/email-plain';
import { sendEmail } from '@/lib/email';

async function sendPersonalUpdate(email: string) {
  const text = generatePlainTextEmail({
    greeting: "Hey there,",
    body: `I wanted to give you a quick update about PathGen v2. We're launching in a few days with some really cool features like AI voice coaching and replay analysis.

I think you'll really like the new replay analysis feature - just upload a clip and get instant feedback on your gameplay.`,
    question: "What's been your biggest challenge in ranked lately? I'd love to hear your thoughts.",
    signature: "- Ben from PathGen",
  });

  const html = generatePlainTextHTML({
    greeting: "Hey there,",
    body: `I wanted to give you a quick update about PathGen v2. We're launching in a few days with some really cool features like AI voice coaching and replay analysis.

I think you'll really like the new replay analysis feature - just upload a clip and get instant feedback on your gameplay.`,
    question: "What's been your biggest challenge in ranked lately? I'd love to hear your thoughts.",
    signature: "- Ben from PathGen",
  });

  await sendEmail({
    to: email,
    subject: "Quick update from PathGen", // NO EMOJIS!
    html,
    text,
  });
}
```

## 🎓 Key Takeaways

1. **Remove `Precedence: bulk`** - This triggers Promotions tab
2. **Use plain text style** - Best inbox placement
3. **Add questions** - Encourages replies (Gmail loves this)
4. **No emojis in subjects** - Looks promotional
5. **No buttons** - Use plain text links
6. **Warm up domain** - Start slow, increase gradually
7. **Track engagement** - Opens, clicks, replies improve reputation
8. **Personal tone** - "Hey there," not "Dear Customer"

## ✅ Next Steps

1. **Verify DNS records** are correct (SPF, DKIM, DMARC)
2. **Start warm-up period** (10 days, 50-150 emails/day)
3. **Use plain text emails** for all communications
4. **Monitor engagement** rates in Firestore
5. **Ask users to move emails to Primary** tab (one-time request)

After 10 days of warm-up and following these guidelines, your emails should consistently land in the Primary inbox! 🎉

