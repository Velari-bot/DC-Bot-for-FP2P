# Example: Converting Promotional Email to Personal Email

This shows how to convert your existing promotional emails to personal emails that land in Primary inbox.

## ❌ BEFORE (Promotional - Goes to Promotions)

```typescript
const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>PathGen Launch - 4 Days Away!</title>
</head>
<body>
    <h1>🚀 4 Days Away!</h1>
    <p>Get ready! PathGen v2 is launching in just <strong>4 days</strong>, and we're hyped to have you on board.</p>
    
    <h2>What's Coming:</h2>
    <ul>
        <li>AI-Powered Coaching</li>
        <li>Replay Analysis</li>
    </ul>
    
    <a href="https://pathgen.dev" style="background: #8B5CF6; padding: 14px 32px; border-radius: 50px;">
        Get Ready →
    </a>
</body>
</html>
`;

await sendEmail({
  to: email,
  subject: '🚀 PathGen v2 Launch Update - 4 Days Away',
  html: emailHtml,
});
```

**Problems:**
- ❌ Emoji in subject line
- ❌ Button/CTA
- ❌ Promotional language ("Get ready!", "we're hyped")
- ❌ Heavy HTML styling
- ❌ Multiple links

## ✅ AFTER (Personal - Lands in Primary)

```typescript
import { generatePlainTextEmail, generatePlainTextHTML } from '@/lib/email-plain';
import { sendEmail } from '@/lib/email';

const text = generatePlainTextEmail({
  greeting: "Hey there,",
  body: `I wanted to give you a quick update about PathGen v2. We're launching in 4 days with some really cool features.

The new version includes AI-powered coaching that gives you real-time feedback on your gameplay, plus replay analysis where you can upload clips and get instant breakdowns.

I think you'll really like the replay analysis feature - just upload a clip and get feedback on your edits, rotations, and decision-making.`,
  question: "Have you been practicing your edits lately? I'd love to hear how your game is going.",
  signature: "- Ben from PathGen",
});

const html = generatePlainTextHTML({
  greeting: "Hey there,",
  body: `I wanted to give you a quick update about PathGen v2. We're launching in 4 days with some really cool features.

The new version includes AI-powered coaching that gives you real-time feedback on your gameplay, plus replay analysis where you can upload clips and get instant breakdowns.

I think you'll really like the replay analysis feature - just upload a clip and get feedback on your edits, rotations, and decision-making.`,
  question: "Have you been practicing your edits lately? I'd love to hear how your game is going.",
  signature: "- Ben from PathGen",
});

await sendEmail({
  to: email,
  subject: 'Quick update from PathGen', // NO EMOJIS!
  html,
  text,
});
```

**Improvements:**
- ✅ No emojis in subject
- ✅ Personal greeting ("Hey there,")
- ✅ Conversational tone
- ✅ Question to encourage replies
- ✅ Plain text style (no buttons)
- ✅ Minimal links (just in footer)

## 📝 Template Conversion Checklist

When converting existing templates:

1. **Remove emojis** from subject lines
2. **Change greeting** from "Dear Customer" to "Hey there,"
3. **Remove buttons** - use plain text links instead
4. **Remove promotional language:**
   - "Get ready!" → "I wanted to give you a quick update"
   - "we're hyped" → "we're excited"
   - "Sign up now!" → Remove entirely
5. **Add a question** to encourage replies
6. **Use plain text style** HTML (minimal styling)
7. **Limit links** to 1-2 maximum
8. **Personal signature** ("- Ben from PathGen" not "- The PathGen Team")

## 🎯 Quick Conversion Formula

**Promotional:**
```
Subject: 🚀 NEW UPDATE! CLICK HERE!
Body: Get ready! Sign up now! [BUTTON]
```

**Personal:**
```
Subject: Quick update from PathGen
Body: Hey there, I wanted to give you a quick update... [Question?] - Ben
```

## 💡 Pro Tips

1. **Always include a question** - Gmail rewards emails that get replies
2. **Use first person** ("I wanted to...") not third person ("We wanted to...")
3. **Keep it short** - 3-4 paragraphs max
4. **One topic per email** - Don't try to cover everything
5. **Test with yourself** - Send to your own Gmail and check which tab it lands in

