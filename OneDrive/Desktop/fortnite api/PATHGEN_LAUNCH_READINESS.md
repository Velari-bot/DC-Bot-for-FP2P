# 🚀 PATHGEN LAUNCH READINESS CHECKLIST

**Last Updated**: December 6, 2024  
**Status**: In Progress  
**Target Launch**: 8 Days

---

## ✅ COMPLETED ITEMS

### 🧩 PRODUCT & FEATURE CHECKLIST

#### AI Coach Core
- ✅ **AI Prompt System**: Finalized in `apps/web/app/api/chat/route.ts`
  - Fortnite-specific coaching prompts
  - Guardrails for off-topic content
  - Abuse protection (jailbreak attempts)
  - Voice mode behavior defined
- ✅ **Usage Tracking**: Implemented in `apps/web/app/api/chat/route.ts` and `apps/web/app/api/voice/coach/route.ts`
  - Chat token tracking per tier
  - Voice call duration tracking
  - Monthly/daily limits enforced
- ✅ **Voice Interaction**: Implemented in `apps/web/app/api/voice/coach/route.ts`
  - Usage tracking working
  - Tier-based limits enforced

#### User Interface (UI/UX)
- ✅ **Chat UI**: Exists at `apps/web/public/chat.html`
- ✅ **Onboarding Flow**: Complete
  - Login (`/login.html`)
  - Setup (`/setup.html`)
  - Subscribe (`/subscribe.html`)
  - Tutorial (`/tutorial.html`)
- ✅ **Dark Mode**: All pages use dark theme (#0A0A0A)

#### Content
- ✅ **Terms of Service**: `apps/web/public/terms.html`
- ✅ **Privacy Policy**: `apps/web/public/privacy.html`
- ✅ **FAQ**: `apps/web/public/faq.html`

### 🔐 AUTHENTICATION & USER SYSTEM
- ✅ **Firebase Auth**: Configured
  - Discord OAuth working
  - Email login available
- ✅ **User Creation**: `apps/web/app/api/users/create/route.ts`
- ✅ **Firestore Integration**: Firebase Admin configured

### 🧾 PAYMENTS (Stripe)
- ✅ **Stripe Integration**: Multiple endpoints
  - `/api/stripe/create-checkout`
  - `/api/stripe/create-subscription`
  - `/api/stripe/create-payment-intent`
  - `/api/stripe/create-portal-session`
  - `/api/stripe/webhook`
- ✅ **Products**: Base Pro ($6.99/mo) + Add-ons configured
- ✅ **Customer Portal**: Enabled

---

## ⚠️ ITEMS TO VERIFY/COMPLETE

### 🧩 PRODUCT & FEATURE CHECKLIST

#### AI Coach Core
- [ ] **Verify prompt is updated for latest Fortnite season** (check current season)
- [ ] **Test guardrails** - Try off-topic questions, jailbreak attempts
- [ ] **Verify usage limits work correctly** - Test hitting limits
- [ ] **Test voice interaction end-to-end** - Record, transcribe, respond, TTS

#### User Interface (UI/UX)
- [ ] **Test chat UI on mobile** - iPhone Safari, Android Chrome
- [ ] **Verify voice UI has waveform animation**
- [ ] **Test push-to-talk or auto mode**
- [ ] **Verify voice reply playback works**
- [ ] **Test onboarding flow end-to-end**
- [ ] **Check error messages** - Ensure no dev-mode errors shown
- [ ] **Test responsive layout** - Tablet, mobile, desktop

#### Content
- [ ] **Create 1-3 demo conversations** - Preload example chats
- [ ] **Create "How It Works" page** - Explain the system
- [ ] **Update FAQ** - Add limits, accuracy, Fortnite updates, refunds
- [ ] **Verify Terms mention AI cannot guarantee wins**
- [ ] **Verify Privacy Policy mentions OpenAI processing**
- [ ] **Add COPPA-compliant messaging** (Fortnite has minors)

### 🔐 AUTHENTICATION & USER SYSTEM
- [ ] **Test Google login** - Verify it works
- [ ] **Test email login** - Verify it works
- [ ] **Test signup → dashboard redirect** - Verify flow
- [ ] **Test email verification** - Send and verify emails
- [ ] **Test password reset** - Full flow
- [ ] **Test user profile page** - Loads correctly
- [ ] **Verify roles & entitlements** - Connected to Stripe subscriptions
- [ ] **Test database rules** - No public writes via Firestore bugs

### 🧾 PAYMENTS (Stripe)
- [ ] **Verify products in Stripe Dashboard** - Base Pro, Add-ons exist
- [ ] **Test subscription creation** - Full flow
- [ ] **Test customer portal** - Can manage subscription
- [ ] **Test webhooks** - Locally and in Vercel
- [ ] **Test billing settings** - Upgrade, downgrade, cancel
- [ ] **Enable 3D Secure** - In Stripe Dashboard
- [ ] **Verify webhook secret** - Stored in Vercel env vars
- [ ] **Test with Stripe live mode** - $1 purchase test

### 🧠 AI BACKEND + INFRASTRUCTURE
- [ ] **Verify OpenAI API keys** - In Vercel environment variables
- [ ] **Test rate limiting** - Per user vs global
- [ ] **Verify usage logging** - Chat tokens, voice calls logged
- [ ] **Test replay analyzer** - File upload, processing, deletion
- [ ] **Verify all environment variables** - Set in Vercel
- [ ] **Test serverless functions** - Avoid cold-start issues
- [ ] **Check real-world latency** - Test response times

### 🧪 TESTING
- [ ] **Create new user test** - Full signup flow
- [ ] **Upgrade to Pro test** - Stripe checkout flow
- [ ] **Chat until limit reached** - Verify limit enforcement
- [ ] **Voice call until limit reached** - Verify limit enforcement
- [ ] **Replay file upload test** - Verify processing
- [ ] **Logout/login test** - Verify persistence
- [ ] **Dashboard refresh test** - Verify data loads
- [ ] **Load testing** - 50-100 simulated users
- [ ] **Mobile testing** - iPhone Safari, Android Chrome, Tablet
- [ ] **Poor connection test** - Slow network handling

### 📈 ANALYTICS / METRICS
- [ ] **Add analytics** - Plausible, PostHog, or LogSnag
- [ ] **Track signups** - Event tracking
- [ ] **Track upgrades** - Conversion tracking
- [ ] **Track errors** - Frontend/backend error logging
- [ ] **Track token usage** - Analytics dashboard
- [ ] **Add uptime monitoring** - BetterStack or Pingdom

### 📣 MARKETING / EXTERNAL
- [ ] **Export logo files** - Dark + light versions
- [ ] **Create app icon** - For socials
- [ ] **Take screenshots** - Clean product screenshots
- [ ] **Create demo video** - 10-20 second video
- [ ] **Verify domain** - pathgen.gg connected to Vercel
- [ ] **Setup email sending** - SES or Resend
- [ ] **Create welcome email** - Automated
- [ ] **Link Terms/Privacy** - In footer
- [ ] **Prepare social media** - TikTok, YouTube, Instagram, Twitter
- [ ] **Setup Discord server** - Channels + rules

### 🛡️ LEGAL & SAFETY
- [ ] **Verify Terms of Service** - AI cannot guarantee wins
- [ ] **Verify Privacy Policy** - Mentions OpenAI processing
- [ ] **Add COPPA messaging** - Age-appropriate warnings
- [ ] **Create refund policy** - Clear refund terms
- [ ] **Add GDPR compliance** - "Delete my data" function
- [ ] **Review all legal pages** - Final proofread

### ⚙️ FINAL "DAY BEFORE LAUNCH" CHECK
- [ ] **Test Stripe live mode** - Actual $1 purchase
- [ ] **Test OpenAI live API calls** - Real API, not test
- [ ] **Test signup on mobile + PC** - Both platforms
- [ ] **Break the site intentionally** - Check error handling
- [ ] **Disable dev logs** - Remove console.logs from user view
- [ ] **Final proofread** - All page content
- [ ] **Verify Vercel analytics** - Clean dashboard
- [ ] **Backup Firestore** - Data structure backup
- [ ] **Prepare support email** - support@pathgen.gg

### 🚀 LAUNCH DAY CHECK
- [ ] **Turn ON live API keys** - Switch from test to live
- [ ] **Post announcement video** - All platforms
- [ ] **Run real user test** - Friend goes through onboarding
- [ ] **Monitor error logs** - Every 30 minutes
- [ ] **Monitor usage limits** - Check Stripe logs
- [ ] **Post "We're Live"** - Tweet & Discord

---

## 🔍 DETAILED VERIFICATION NEEDED

### Critical Path Items (Must Complete Before Launch)

1. **Stripe Live Mode Testing**
   - Test actual payment processing
   - Verify webhooks work in production
   - Test subscription lifecycle

2. **OpenAI API Production Keys**
   - Switch from test to live keys
   - Verify rate limits
   - Monitor costs

3. **Mobile Testing**
   - Full onboarding on mobile
   - Chat UI responsive
   - Voice UI works on mobile

4. **Error Handling**
   - Graceful degradation
   - User-friendly error messages
   - No dev-mode errors exposed

5. **Legal Compliance**
   - Terms updated for AI coaching
   - Privacy policy mentions OpenAI
   - COPPA compliance for minors

---

## 📝 NEXT STEPS

1. **Immediate**: Test critical paths (auth, payments, AI chat)
2. **Day 1-2**: Complete missing content (How It Works, demo conversations)
3. **Day 3-4**: Mobile testing and error handling
4. **Day 5-6**: Legal review and analytics setup
5. **Day 7**: Final testing and staging
6. **Day 8**: Launch!

---

**Status**: Ready to begin systematic verification and completion of remaining items.

