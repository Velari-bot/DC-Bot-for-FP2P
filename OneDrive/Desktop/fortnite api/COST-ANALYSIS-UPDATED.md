# 💰 Cost Analysis - Maximum Usage per User (UPDATED LIMITS)

## Current Models Used

- **Text Chat:** `gpt-4o-mini`
- **Voice Transcription:** `whisper-1`
- **Voice AI Response:** `gpt-4o-mini`
- **Text-to-Speech:** `tts-1`

## OpenAI API Pricing (as of 2024)

### GPT-4o-mini
- **Input:** $0.150 per 1M tokens
- **Output:** $0.600 per 1M tokens
- **Total:** ~$0.75 per 1M tokens (average)

### Whisper-1 (Audio Transcription)
- **Cost:** $0.006 per minute of audio

### TTS-1 (Text-to-Speech)
- **Cost:** $0.015 per 1,000 characters

---

## Assumptions for Calculations

### Text Chat
- Average user message: **50 tokens** (≈200 chars)
- Average AI response: **150 tokens** (≈600 chars)
- Total per message: **200 tokens** (50 input + 150 output)

### Voice Interaction
- Average audio length: **30 seconds** (0.5 minutes) per interaction
- Average transcript: **50 tokens** (from Whisper)
- Average AI response: **150 tokens** (from gpt-4o-mini)
- Average TTS response: **600 characters** (≈30 seconds of speech)

**Cost per voice interaction:**
- Whisper: 0.5 min × $0.006 = **$0.003**
- GPT-4o-mini: 200 tokens × $0.75/1M = **$0.00015**
- TTS: 600 chars × $0.015/1K = **$0.009**
- **Total per interaction: $0.01215**

---

## 💵 Cost Per User at Maximum Usage

### 🆓 FREE TIER ($0/month subscription)

**Text Chat:**
- 5 messages/day × 30 days = **150 messages/month**
- 150 messages × 200 tokens = **30,000 tokens/month**
- Cost: 30,000 × $0.75/1M = **$0.0225/month**

**Voice:**
- 0 interactions/month
- **Cost: $0**

**Total FREE TIER Cost: $0.0225/month per user**

---

### 💎 BASE PRO ($6.99/month subscription)

**Text Chat:**
- 200 messages/month
- 200 messages × 200 tokens = **40,000 tokens/month**
- Cost: 40,000 × $0.75/1M = **$0.03/month**

**Voice:**
- 0 interactions/month
- **Cost: $0**

**Total BASE PRO Cost: $0.03/month per user**

---

### 🎤 VOICE ADD-ON (+$1.99/month)

**Voice Interactions:**
- **550 interactions/month maximum**
- **3,600 seconds/month limit** (60 minutes total)
- **30 minutes max per session** (1,800 seconds hard cap)

**Actual maximum usage (constrained by 3,600 seconds/month):**
- 3,600 seconds ÷ 30 seconds/interaction = **120 interactions maximum**
- (If users used full 30-minute sessions: 3,600 ÷ 1,800 = **2 sessions maximum**)

**Cost calculation (at 120 interactions @ 30 seconds each):**
- 120 interactions × $0.01215 = **$1.458/month**

**If using maximum 550 interactions (but limited by seconds):**
- Would need: 550 × 30 seconds = 16,500 seconds
- But limit is 3,600 seconds, so max is 120 interactions
- **Actual cost: $1.46/month**

**Voice Add-On Cost: $1.46/month per user** (at maximum usage)

---

### 🎮 GAMEPLAY ADD-ON (+$1.50/month)

**Replays:**
- 15 replays/month
- *Note: Replay analysis costs depend on your replay processing service (not OpenAI)*
- **OpenAI cost: $0** (assuming replay processing is separate)

**Total GAMEPLAY ADD-ON Cost: $0/month** (OpenAI only)

---

### 📈 COMPETITIVE ADD-ON (+$0.75/month)

**Competitive Insights:**
- UNLIMITED insights/month
- Each insight: ~200 tokens (same as chat)
- **This is UNLIMITED, so cost scales with usage**

**Conservative estimates:**
- At 1,000 insights/month: 1,000 × 200 tokens = 200,000 tokens
- Cost: 200,000 × $0.75/1M = **$0.15/month**
- At 10,000 insights/month: **$1.50/month**
- At 100,000 insights/month: **$15/month**

**⚠️ WARNING: UNLIMITED means costs can scale unbounded!**

**Conservative estimate (1,000 insights/month): $0.15/month per user**

---

## 🎯 TOTAL COST PER USER (Maximum Usage)

### FREE TIER
- Subscription: **$0**
- OpenAI costs: **$0.0225**
- **Total cost: $0.0225/month per user**
- **Revenue: $0**
- **Net: -$0.0225/month** (free users cost you money)

### BASE PRO
- Subscription: **$6.99**
- OpenAI costs: **$0.03**
- **Total cost: $0.03/month**
- **Revenue: $6.99**
- **Net profit: $6.96/month** (99.6% margin)

### BASE PRO + VOICE ADD-ON
- Subscription: **$8.98**
- OpenAI costs: **$0.03 (chat) + $1.46 (voice) = $1.49**
- **Total cost: $1.49/month**
- **Revenue: $8.98**
- **Net profit: $7.49/month** (83.4% margin)

### BASE PRO + GAMEPLAY ADD-ON
- Subscription: **$8.49**
- OpenAI costs: **$0.03**
- **Total cost: $0.03/month**
- **Revenue: $8.49**
- **Net profit: $8.46/month** (99.6% margin)

### BASE PRO + COMPETITIVE ADD-ON
- Subscription: **$7.74**
- OpenAI costs: **$0.03 (chat) + $0.15 (competitive) = $0.18**
- **Total cost: $0.18/month** (at 1,000 insights/month)
- **Revenue: $7.74**
- **Net profit: $7.56/month** (97.7% margin at conservative usage)

### BASE PRO + ALL ADD-ONS
- Subscription: **$11.23**
- OpenAI costs: **$0.03 (chat) + $1.46 (voice) + $0.15 (competitive) = $1.64**
- **Total cost: $1.64/month** (at conservative competitive usage)
- **Revenue: $11.23**
- **Net profit: $9.59/month** (85.4% margin)

---

## 📊 Cost Per 1,000 Users (At Maximum Usage)

| Tier | Revenue | OpenAI Cost | Net Profit | Profit Margin |
|------|---------|-------------|------------|---------------|
| **Free** | $0 | $22.50 | -$22.50 | N/A (loss) |
| **Base Pro** | $6,990 | $30 | $6,960 | 99.6% |
| **Pro + Voice** | $8,980 | $1,490 | $7,490 | 83.4% |
| **Pro + Gameplay** | $8,490 | $30 | $8,460 | 99.6% |
| **Pro + Competitive** | $7,740 | $180 | $7,560 | 97.7% |
| **All Add-Ons** | $11,230 | $1,640 | $9,590 | 85.4% |

---

## ⚠️ RISK ANALYSIS

### High-Risk Scenarios

1. **Voice Add-On:**
   - Max usage: $1.46/month cost vs $1.99/month revenue
   - **Only $0.53 profit per user at maximum**
   - If users average 120+ interactions/month using full 30-second clips, you break even

2. **Competitive Add-On (UNLIMITED):**
   - **UNLIMITED = UNBOUNDED COSTS**
   - A single power user could cost $100+/month if they spam insights
   - **Recommendation:** Add rate limiting (e.g., 1,000/month hard cap)

3. **Voice Session Length:**
   - Assumed 30 seconds average per interaction
   - If users use full 30-minute sessions, max interactions = 2/month
   - Cost per 30-min session: $0.73 (30 min transcription + response + TTS)

---

## 💡 Recommendations

1. **Add rate limiting to Competitive Add-On:**
   - Cap at 1,000 insights/month
   - Or implement tiered pricing for heavy users

2. **Monitor voice usage closely:**
   - Track average interaction length
   - Alert if users consistently max out interactions

3. **Set up billing alerts:**
   - Monitor OpenAI usage daily
   - Alert if costs exceed 10% of revenue

4. **Consider caching competitive insights:**
   - Cache common queries
   - Reduce redundant API calls

---

## 📝 Summary

**Most Profitable:** Base Pro only (99.6% margin)
**Most Risky:** Competitive Add-On (unlimited = unbounded costs)
**Breakeven Risk:** Voice Add-On at maximum usage (only $0.53 profit margin)

**Average Cost per User:** ~$0.02-$1.50/month (depending on tier and usage)
**Average Revenue per User:** ~$7-$11/month
**Overall Profit Margin:** ~83-99% (very healthy, except competitive add-on at high usage!)

