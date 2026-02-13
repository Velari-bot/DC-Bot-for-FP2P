# 💰 Cost Analysis - Maximum Usage per User

## Current Models Used

- **Text Chat:** `gpt-4o-mini`
- **Voice Transcription:** `whisper-1`
- **Voice AI Response:** `gpt-4o-mini`
- **Text-to-Speech:** `tts-1`

## OpenAI API Pricing (as of 2024)

### GPT-4o-mini
- **Input:** $0.150 per 1M tokens
- **Output:** $0.600 per 1M tokens

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
- Average audio length: **30 seconds** (0.5 minutes)
- Average transcript: **50 tokens** (from Whisper)
- Average AI response: **150 tokens** (from gpt-4o-mini)
- Average TTS response: **600 characters** (≈30 seconds of speech)

---

## 💵 Cost Per User at Maximum Usage

### 🆓 FREE TIER ($0/month subscription)

**Text Chat:**
- 5 messages/day × 30 days = **150 messages/month**
- 150 messages × 200 tokens = **30,000 tokens/month**
- Cost: (30,000 / 1,000,000) × $0.150 = **$0.0045** input
- Cost: (30,000 / 1,000,000) × $0.600 = **$0.018** output
- **Total chat cost: $0.0225/month**

**Voice:**
- 0 interactions/month
- **Cost: $0**

**Gameplay:**
- 0 clips/month
- **Cost: $0**

**Competitive:**
- 0 insights/month
- **Cost: $0**

**Total FREE TIER Cost: $0.0225/month per user**

---

### 💎 BASE PRO ($6.99/month subscription)

**Text Chat:**
- 200 messages/month
- 200 messages × 200 tokens = **40,000 tokens/month**
- Cost: (40,000 / 1,000,000) × $0.150 = **$0.006** input
- Cost: (40,000 / 1,000,000) × $0.600 = **$0.024** output
- **Total chat cost: $0.03/month**

**Voice:**
- 0 interactions/month
- **Cost: $0**

**Gameplay:**
- 0 replays/month
- **Cost: $0**

**Competitive:**
- 0 insights/month
- **Cost: $0**

**Total BASE PRO Cost: $0.03/month per user**

---

### 🎤 VOICE ADD-ON (+$1.99/month)

**Voice Interactions:**
- **550 interactions/month**
- Each interaction includes:
  - **Transcription:** 30 seconds × $0.006/min = **$0.003** per interaction
  - **AI Response:** 200 tokens × ($0.150 + $0.600) / 1M = **$0.00015** per interaction
  - **TTS:** 600 chars × $0.015 / 1,000 = **$0.009** per interaction
  - **Total per interaction: $0.01215**

- **Total cost:** 550 × $0.01215 = **$6.68/month**

**Note:** Voice add-on has 3,600 seconds/month limit (60 minutes), so 550 interactions × 30 seconds = 16,500 seconds = 275 minutes, which exceeds the limit. Actual max would be:
- **3,600 seconds/month ÷ 30 seconds/interaction = 120 interactions max**
- Actual cost: 120 × $0.01215 = **$1.458/month**

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
- Each insight: ~200 tokens (assume same as chat)
- **This is UNLIMITED, so cost scales with usage**
- At 1,000 insights/month: 1,000 × 200 tokens = 200,000 tokens
- Cost: (200,000 / 1,000,000) × $0.750 = **$0.15/month**
- At 10,000 insights/month: **$1.50/month**
- At 100,000 insights/month: **$15/month**

**⚠️ WARNING: UNLIMITED means costs can scale unbounded!**

**Conservative estimate (1,000 insights/month): $0.15/month per user**

---

## 🎯 TOTAL COST PER USER (Maximum Usage)

### FREE TIER
- Subscription: **$0**
- OpenAI costs: **$0.0225**
- **Total: $0.0225/month per user**

### BASE PRO
- Subscription: **$6.99**
- OpenAI costs: **$0.03**
- **Total: $6.99/month revenue, $0.03/month cost**
- **Profit margin: 99.6%**

### BASE PRO + VOICE ADD-ON
- Subscription: **$8.98**
- OpenAI costs: **$0.03 (chat) + $1.46 (voice) = $1.49**
- **Total: $8.98/month revenue, $1.49/month cost**
- **Profit margin: 83.4%**

### BASE PRO + GAMEPLAY ADD-ON
- Subscription: **$8.49**
- OpenAI costs: **$0.03**
- **Total: $8.49/month revenue, $0.03/month cost**
- **Profit margin: 99.6%**

### BASE PRO + COMPETITIVE ADD-ON
- Subscription: **$7.74**
- OpenAI costs: **$0.03 (chat) + $0.15 (competitive) = $0.18**
- **Total: $7.74/month revenue, $0.18/month cost**
- **Profit margin: 97.7%**

### BASE PRO + ALL ADD-ONS
- Subscription: **$11.23**
- OpenAI costs: **$0.03 (chat) + $1.46 (voice) + $0.15 (competitive) = $1.64**
- **Total: $11.23/month revenue, $1.64/month cost**
- **Profit margin: 85.4%**

---

## 📊 Cost Per 1,000 Users (At Maximum Usage)

| Tier | Revenue | OpenAI Cost | Net Profit | Profit Margin |
|------|---------|-------------|------------|---------------|
| **Free** | $0 | $22.50 | -$22.50 | N/A |
| **Base Pro** | $6,990 | $30 | $6,960 | 99.6% |
| **Pro + Voice** | $8,980 | $1,490 | $7,490 | 83.4% |
| **Pro + Gameplay** | $8,490 | $30 | $8,460 | 99.6% |
| **Pro + Competitive** | $7,740 | $180 | $7,560 | 97.7% |
| **All Add-Ons** | $11,230 | $1,640 | $9,590 | 85.4% |

---

## ⚠️ RISK ANALYSIS

### High-Risk Scenarios

1. **Voice Add-On Heavy Users:**
   - Max usage: $1.46/month cost vs $1.99/month revenue
   - **Only $0.53 profit per user**
   - If users average 60+ interactions/month, you lose money

2. **Competitive Add-On (UNLIMITED):**
   - **UNLIMITED = UNBOUNDED COSTS**
   - A single power user could cost $100+/month if they spam insights
   - **Recommendation:** Add rate limiting or cap (e.g., 1,000/month)

3. **Voice Session Length:**
   - Assumed 30 seconds average
   - If users use full 30-minute sessions, costs scale 60x
   - Max cost per interaction: $0.73 (30 min transcription + response)

---

## 💡 Recommendations

1. **Add rate limiting to Competitive Add-On:**
   - Cap at 1,000 insights/month
   - Or implement tiered pricing

2. **Monitor voice usage:**
   - Average interaction length
   - If users consistently use 5+ minute sessions, costs increase significantly

3. **Consider caching:**
   - Cache common responses
   - Reduce redundant API calls

4. **Set up billing alerts:**
   - Monitor OpenAI usage daily
   - Alert if costs exceed revenue

---

## 📝 Summary

**Most Profitable:** Base Pro only (99.6% margin)
**Most Risky:** Competitive Add-On (unlimited = unbounded costs)
**Breakeven Risk:** Voice Add-On heavy users

**Average Cost per User:** ~$0.50-$1.50/month (depending on tier)
**Average Revenue per User:** ~$7-$11/month
**Overall Profit Margin:** ~85-99% (very healthy!)

