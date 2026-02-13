# PathGen v2 Launch Checklist - December 12, 2025

## AI Coach Core

### ✅ Finalize AI prompt system for Fortnite coaching
- [x] System prompt configured in `/apps/web/app/api/chat/route.ts`
- [x] Covers all Fortnite topics (gameplay, mechanics, strategy, competitive)
- [x] Updated for current season
- [x] JSON response format enforced

### ✅ Guardrails for off-topic, outdated info, abuse, tricking the bot
- [x] Off-topic blocking implemented
- [x] Abuse protection (jailbreak attempts blocked)
- [x] Responds with: "I can only help with Fortnite coaching and gameplay improvement."

### ✅ Ensure chat model usage tracking works (limits per tier)
- [x] Free tier: 15 messages/day
- [x] Pro tier: 300 messages/month
- [x] Usage tracking in Firestore `/usage/{uid}`
- [x] Limits enforced in `/apps/web/app/api/chat/route.ts`

### ⚠️ Ensure voice interaction feature works + usage tracking
- [x] Voice API endpoint: `/apps/web/app/api/voice/coach/route.ts`
- [x] Free tier: 30 seconds/day
- [x] Voice Add-on: 100 minutes/month (3600 seconds), 550 interactions
- [x] Whisper transcription configured
- [x] TTS (Text-to-Speech) configured
- [ ] **ISSUE**: Currently returning 500 error - needs debugging
  - OpenAI API key is present
  - Firebase Admin credentials are present
  - Need to check actual error logs

### ❓ Confirm replay/upload system works if included
- [x] Upload endpoint exists: `/apps/web/app/api/analyze/upload/route.ts`
- [x] Status tracking: `/apps/web/app/api/analyze/status/[trackingId]/route.ts`
- [ ] TODO: Test actual replay upload functionality

---

## User Interface (UI/UX)

### ✅ Chat UI clean + mobile-friendly
- [x] Chat interface at `/apps/web/public/chat.html`
- [x] Dark theme enabled
- [x] Responsive layout
- [x] Message history display
- [x] Copy/Regenerate buttons

### ⚠️ Voice UI matches OpenAI style
- [x] Waveform animation implemented
- [x] Push-to-talk mode
- [x] Visual feedback during recording
- [ ] Playback of voice replies (needs voice API to work first)
- [x] Usage counter displayed (interactions + minutes)

### ❓ Onboarding flow works
- [x] Tutorial page exists: `/apps/web/public/tutorial.html`
- [x] Setup flow: `/apps/web/public/setup.html`
- [x] Coach setup: `/apps/web/public/setup-coach.html`
- [ ] TODO: Test complete onboarding flow

### ✅ Error messages are clean & helpful
- [x] No localhost references in production
- [x] User-friendly error messages
- [x] Proper loading states
- [x] Toast notifications for errors

### ✅ Dark mode + responsive layout functional
- [x] Dark theme by default
- [x] Responsive CSS
- [x] Mobile-friendly navigation

---

## Content

### ❓ 1–3 demo conversations preloaded
- [ ] TODO: Add sample conversations to show new users

### ✅ Explanation page: "How It Works"
- [x] Docs page exists: `/apps/web/public/docs.html`
- [x] Features explained
- [ ] Could be enhanced with more detail

### ❓ FAQ about limits, accuracy, Fortnite updates, refunds
- [x] Docs page has basic info
- [ ] TODO: Add comprehensive FAQ section
  - Usage limits by tier
  - Accuracy disclaimers
  - Fortnite season update policy
  - Refund policy

### ⚠️ Terms of Use + Privacy Policy
- [x] Terms page exists: `/apps/web/public/terms.html`
- [x] Last updated: December 12, 2025
- [ ] TODO: Review for completeness
- [ ] TODO: Add Privacy Policy page

---

## Critical Issues to Fix Before Launch

### 🔴 HIGH PRIORITY

1. **Voice API 500 Error**
   - Status: BROKEN
   - Action: Debug why `/api/voice/coach` returns 500
   - Test endpoint created: `/api/voice/test`
   - Next step: Check test endpoint output

2. **Video Recommendations Not Showing**
   - Status: FIXED in latest deployment
   - Action: Test that AI now returns video citations
   - Deployment: https://pathgen-maq2ckgm7-velari-bots-projects.vercel.app

3. **GitHub Push Blocked**
   - Status: BLOCKED (Stripe keys in docs)
   - Action: Code is deployed to Vercel, GitHub can wait
   - Not critical for launch

### 🟡 MEDIUM PRIORITY

1. **Add Privacy Policy**
   - Create `/apps/web/public/privacy.html`
   
2. **Add FAQ Section**
   - Enhance docs with comprehensive FAQ

3. **Test Replay Upload**
   - Verify upload functionality works

### 🟢 LOW PRIORITY

1. **Demo Conversations**
   - Add 2-3 example chats for new users

2. **Enhanced Onboarding**
   - Could add interactive tutorial

---

## Environment Variables Verified ✅

- `OPENAI_API_KEY` - Present
- `GOOGLE_APPLICATION_CREDENTIALS_JSON` - Present
- `FIREBASE_PROJECT_ID` - Present
- `STRIPE_SECRET_KEY` - Present
- `STRIPE_WEBHOOK_SECRET` - Present
- All Firebase config vars - Present
- Email SMTP credentials - Present

---

## Launch Readiness: 85%

**Deployment URL**: https://pathgen-4z4komm2q-velari-bots-projects.vercel.app

**Launch Date**: December 12, 2025 (10 days away)

**Next Steps**:
1. Fix voice API 500 error
2. Test all features end-to-end
3. Add Privacy Policy
4. Enhance FAQ section
5. Final QA pass

