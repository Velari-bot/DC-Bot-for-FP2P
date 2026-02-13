# ✅ PathGen "Always Up-to-Date & Working" Checklist

**Last Updated**: December 12, 2025  
**Status**: Implementation in Progress

---

## 📊 A. Data + AI Systems

### Daily Data Updates
- [x] **Data ingestion scheduled** - Currently runs every 10 minutes (more frequent than daily)
  - Location: `fortnite-core/packages/data-ingestion/src/index.ts`
  - Schedule: `*/10 * * * *` (every 10 minutes)
  - Sources: Epic CMS, Fortnite-API, News RSS, Twitter, Reddit
- [ ] **Verify daily refresh** - Ensure at least one successful run per 24 hours
- [ ] **Add daily verification alert** - Alert if no successful ingestion in 24h

### Nightly Tests
- [ ] **Movement advice accuracy tests** - Automated validation
  - Test file: `tests/nightly/movement-advice.test.ts` (TO CREATE)
- [ ] **Loadout meta update tests** - Verify meta data freshness
  - Test file: `tests/nightly/loadout-meta.test.ts` (TO CREATE)
- [ ] **Map rotation & POI change tests** - Validate map data
  - Test file: `tests/nightly/map-rotation.test.ts` (TO CREATE)
- [ ] **Competitive update tests** - Tournaments, formats, loot pool
  - Test file: `tests/nightly/competitive-updates.test.ts` (TO CREATE)
- [ ] **Schedule nightly test runner** - Cron job to run all tests at 2 AM

### Fallback Models
- [ ] **Implement fallback data source** - Use cached data if primary fails
  - Location: `fortnite-core/packages/data-ingestion/src/fallback.ts` (TO CREATE)
- [ ] **Add fallback detection** - Auto-switch when primary source fails
- [ ] **Cache last successful ingestion** - Store backup for fallback use

### Voice AI Updates
- [ ] **Monthly voice model review** - Check for better TTS options
- [ ] **Voice response quality tests** - Automated quality checks
- [ ] **Update voice coaching prompts** - Monthly review of voice responses

---

## 💻 B. Code + Servers

### Weekly Endpoint Checks
- [x] **Health check endpoint exists** - `/health` endpoint available
  - Location: `packages/papi/src/index.ts` (line 222)
  - Location: `fortnite-core/packages/api/src/index.ts`
- [ ] **Automated weekly ping script** - Test all endpoints
  - Script: `scripts/weekly-health-check.js` (TO CREATE)
- [ ] **Latency monitoring** - Track response times
- [ ] **API route validation** - Ensure all routes respond correctly

### External Uptime Monitoring
- [ ] **UptimeRobot setup** - Configure monitoring
  - Guide: `docs/UPTIME-MONITORING-SETUP.md` (TO CREATE)
- [ ] **Pingdom setup** - Alternative monitoring option
- [ ] **Vercel Analytics** - Enable built-in monitoring
- [ ] **Alert configuration** - Email/Discord alerts on downtime

### Stress Testing
- [ ] **Load testing script** - 50-200 concurrent users
  - Script: `scripts/stress-test.js` (TO CREATE)
- [ ] **Performance benchmarks** - Document expected response times
- [ ] **Load test results** - Run monthly and document

### Code Backups
- [x] **GitHub version control** - Code is versioned
- [ ] **Deployment tags** - Tag each deployment
- [ ] **Backup verification** - Ensure backups are working

---

## 🎨 C. UI/UX

### Monthly Signup Flow Checks
- [ ] **Login functionality test** - Automated test
  - Test: `tests/ui/login-flow.test.ts` (TO CREATE)
- [ ] **Email verification test** - Verify email flow works
- [ ] **Stripe/Payment test** - Test checkout flow
- [ ] **OAuth test** - Discord login verification

### Device Testing
- [ ] **Desktop Chrome** - Test checklist
- [ ] **iPhone Safari** - Test checklist
- [ ] **Android Chrome** - Test checklist
- [ ] **Tablet testing** - iPad/Android tablet

### Voice AI Permissions
- [ ] **Microphone permission test** - All devices
- [ ] **Permission error handling** - User-friendly messages
- [ ] **Fallback for no mic** - Text-only mode

---

## 📋 D. Business + Compliance

### Legal Pages
- [x] **Terms of Service** - `apps/web/public/terms.html`
- [x] **Privacy Policy** - `apps/web/public/privacy.html`
- [ ] **Refund Policy** - Add to terms or separate page
- [ ] **Footer links** - Add to all pages

### Stripe Security
- [x] **Stripe integration** - Multiple endpoints exist
- [ ] **3D Secure enabled** - Verify in Stripe dashboard
- [ ] **PCI compliance** - Document compliance status
- [ ] **Webhook security** - Verify webhook secret validation

### DMCA Safety
- [ ] **Fortnite visual usage review** - Ensure fair use
- [ ] **Screenshot policy** - Document usage rights
- [ ] **Content attribution** - Credit Epic Games where needed

---

## 🎯 2. Conversion Checklist (Visitor → Signup → Paid)

### A. Instant Trust (DON'T LOOK LIKE A SCAM)

#### Founder Information
- [ ] **Founder photo** - Add Aiden Bender photo
- [ ] **Founder name** - "Founded by Fortnite competitive player Aiden Bender"
- [ ] **Location on landing page** - Hero section or About section

#### Real Screenshots
- [ ] **AI UI screenshots** - Real product screenshots
- [ ] **Dashboard preview** - Actual dashboard images
- [ ] **Chat interface** - Real chat examples

#### User Reviews
- [ ] **Testimonials section** - Real user reviews
- [ ] **Before/after stories** - Improvement metrics
- [ ] **Social proof badges** - "Used by 500+ players"

#### Demo Video
- [ ] **30-second demo video** - Product walkthrough
- [ ] **Video hosting** - YouTube/Vimeo embed
- [ ] **Video placement** - Hero section or dedicated section

#### Data Source Logos
- [ ] **Epic Games attribution** - If allowed
- [ ] **API provider logos** - Fortnite-API.com, etc.
- [ ] **Source transparency** - Show data sources

---

### B. Hero Section

#### Current Status
- [x] **Tagline exists** - "AI coaches for every Fortnite player"
- [ ] **Update tagline** - "Your personal Fortnite AI coach. Improve smarter, not harder."
- [x] **Value explanation** - Subtitle exists
- [x] **CTA button** - "Get Started" button present
- [ ] **Add "Start Free Trial"** - More conversion-focused CTA

---

### C. Social Proof

#### Improvement Stories
- [ ] **Before/after section** - User success stories
- [ ] **Arena rank improvements** - Showcase improvements
- [ ] **Tournament placements** - Aiden's competitive results

#### Competitive Players
- [ ] **"Used by competitive players" section** - Social proof row
- [ ] **Player testimonials** - Real competitive player quotes
- [ ] **Rank badges** - Show user ranks (if available)

---

### D. Product Transparency

#### How It Works
- [ ] **Clear explanation** - "PathGen analyzes your gameplay, compares it to competitive pro data, and gives you real-time coaching through voice, stats, and tactical recommendations."
- [ ] **What it can do** - Feature list
- [ ] **What it can't do** - Honest limitations
- [ ] **Live demo** - Interactive demo section

#### Current Implementation
- [x] **AI chat mockup** - Shows on landing page
- [ ] **Add "Try it LIVE" button** - Interactive demo
- [ ] **Real AI response demo** - Show actual AI responses

---

### E. Conversion to Signup

#### Signup Simplicity
- [x] **Email + password** - Available
- [x] **Google/Discord login** - OAuth available
- [ ] **7-day free trial** - Verify implementation
- [ ] **No credit card required** - For free tier
- [ ] **Money-back guarantee** - Add to signup page

---

### F. Conversion to Paid

#### Plan Explanation
- [x] **Plan tiers exist** - Subscribe page
- [ ] **Plain English explanation** - Simplify pricing
- [ ] **Value comparison** - PathGen vs hiring coach
- [ ] **Value comparison** - PathGen vs YouTube
- [ ] **Discord community access** - Show live community
- [ ] **Payment badges** - Stripe Verified badge

---

### G. Avoid Scam Energy

#### Current Status
- [x] **No overhyped claims** - Professional tone
- [x] **Product working live** - Chat mockup shows functionality
- [x] **Transparent design** - Clean, professional UI
- [ ] **Real screenshots** - Replace mockups with real screenshots
- [ ] **Real gameplay analysis samples** - Show actual analysis
- [x] **Refund policy** - Mentioned in terms
- [ ] **Business email** - Add to footer
- [ ] **Social media links** - Add to footer

---

## 📝 Implementation Priority

### High Priority (Week 1)
1. ✅ Create this checklist document
2. ⏳ Add founder info to landing page
3. ⏳ Add footer with terms/privacy/refund links
4. ⏳ Create nightly test infrastructure
5. ⏳ Set up external uptime monitoring

### Medium Priority (Week 2)
6. ⏳ Add real screenshots to landing page
7. ⏳ Create demo video
8. ⏳ Add user reviews/testimonials
9. ⏳ Implement fallback data system
10. ⏳ Create stress testing script

### Low Priority (Week 3+)
11. ⏳ Monthly voice model review process
12. ⏳ Device testing automation
13. ⏳ DMCA compliance review
14. ⏳ Social proof section expansion

---

## 🔄 Maintenance Schedule

### Daily
- [ ] Check data ingestion logs
- [ ] Monitor error rates
- [ ] Review user feedback

### Weekly
- [ ] Run endpoint health checks
- [ ] Review uptime metrics
- [ ] Check conversion rates

### Monthly
- [ ] Run full test suite
- [ ] Review and update voice models
- [ ] Update landing page content
- [ ] Review and update testimonials
- [ ] Check DMCA compliance

### Quarterly
- [ ] Full security audit
- [ ] Performance optimization review
- [ ] Competitive analysis update
- [ ] Pricing review

---

## 📊 Progress Tracking

**Overall Completion**: ~35%

**By Category**:
- Data + AI Systems: 40%
- Code + Servers: 50%
- UI/UX: 30%
- Business + Compliance: 60%
- Conversion Optimization: 25%

**Next Steps**: See Implementation Priority section above.

