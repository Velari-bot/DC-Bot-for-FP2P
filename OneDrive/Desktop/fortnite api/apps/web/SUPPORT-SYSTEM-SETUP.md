# 📧 Support System Setup Guide

## ✅ What's Been Built

A complete support system for PathGen with:
- ✅ Support page/forum UI at `/support`
- ✅ Email notifications to `support@pathgen.dev`
- ✅ Discord webhook notifications for major events
- ✅ Automatic notifications for:
  - User signups
  - Purchases/subscriptions
  - Support requests

## 🔧 Environment Variables

### Required: Discord Webhook URL

Add this environment variable to your Vercel project:

**Variable Name:** `DISCORD_WEBHOOK_URL`

**Value:** `https://discord.com/api/webhooks/1447053863751258163/ylJTvWEPYxi1ynXT-1FVDiu6Q6FPcAJKSrHRFrvNjVL1KsbjTw-VLlzr5EDroknO5LvJ`

**How to Set:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Click "Add New"
3. Name: `DISCORD_WEBHOOK_URL`
4. Value: `https://discord.com/api/webhooks/1447053863751258163/ylJTvWEPYxi1ynXT-1FVDiu6Q6FPcAJKSrHRFrvNjVL1KsbjTw-VLlzr5EDroknO5LvJ`
5. Environments: ✅ Production, ✅ Preview, ✅ Development
6. Click "Save"

**For Local Development:**
Add to `apps/web/.env.local`:
```bash
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/1447053863751258163/ylJTvWEPYxi1ynXT-1FVDiu6Q6FPcAJKSrHRFrvNjVL1KsbjTw-VLlzr5EDroknO5LvJ
```

## 📧 Email Configuration

The support system uses the existing email system. Make sure these are set:

- `EMAIL_SMTP_USER` - AWS SES SMTP username
- `EMAIL_SMTP_PASS` - AWS SES SMTP password
- `EMAIL_FROM` - Email from address (e.g., `PathGen <no-reply@pathgen.gg>`)

Support requests are automatically sent to: **support@pathgen.dev**

## 🎯 Features

### 1. Support Page (`/support`)

Users can submit support requests through a clean, modern form with:
- Name and email fields
- Category selection (General, Technical, Billing, Feature Request, Bug Report, Other)
- Subject and message fields
- Real-time validation and feedback

### 2. Email Notifications

When a support request is submitted:
- An email is sent to `support@pathgen.dev` with:
  - User information (name, email, user ID if available)
  - Category and subject
  - Full message content
  - Formatted HTML email for easy reading

### 3. Discord Webhook Notifications

Discord notifications are sent for:

**User Signups:**
- User ID
- Email
- Username

**Purchases/Subscriptions:**
- User ID and email
- Plan type
- Amount and currency
- Customer and subscription IDs
- Add-ons purchased

**Support Requests:**
- User email and name
- User ID (if available)
- Category
- Subject and message

## 🚀 Testing

### Test Support Request

1. Navigate to `https://pathgen.dev/support` (or `http://localhost:3000/support` locally)
2. Fill out the form
3. Submit
4. Check:
   - Email inbox at `support@pathgen.dev`
   - Discord webhook channel for notification

### Test User Signup Notification

1. Create a new user account
2. Check Discord webhook for signup notification

### Test Purchase Notification

1. Complete a purchase/subscription
2. Check Discord webhook for purchase notification

## 📁 Files Created

- `apps/web/lib/discord-webhook.ts` - Discord webhook utility functions
- `apps/web/src/app/support/page.tsx` - Support page UI
- `apps/web/app/api/support/route.ts` - Support request API endpoint

## 🔄 Integration Points

The Discord webhook is integrated into:

1. **User Signup** (`apps/web/app/api/users/create/route.ts`)
   - Sends notification when new user signs up

2. **Stripe Webhook** (`apps/web/app/api/stripe/webhook/route.ts`)
   - Sends notification when checkout session is completed

3. **Support Request** (`apps/web/app/api/support/route.ts`)
   - Sends notification when support request is submitted

## ⚠️ Error Handling

- If Discord webhook fails, the request still succeeds (non-blocking)
- Errors are logged to console for debugging
- Email sending failures are logged but don't block the request
- User always gets feedback on form submission status

## 🎨 UI Features

- Dark mode by default (matches PathGen theme)
- Responsive design
- Form validation
- Loading states
- Success/error feedback
- Clean, modern design with PathGen branding
