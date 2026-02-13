# ✅ New Pricing Structure - Complete Implementation

## 🎯 What's Been Implemented

### 1. **FREE TIER - "Starter"**
- ✅ 15 messages/day (not per month)
- ✅ Max 200 characters per message
- ✅ No saved chat history
- ✅ 30 seconds voice/day
- ✅ 1 gameplay clip/week
- ✅ 1 competitive insight/week

### 2. **BASE PRO - "Pro Core" ($6.99/mo)**
- ✅ 300 messages/month (10/day average)
- ✅ Large message size (2,000 chars)
- ✅ Saves chat history
- ✅ Better model responses
- ✅ No voice, gameplay, or competitive insights (requires add-ons)

### 3. **ADD-ONS (Stackable)**

#### 🎮 Gameplay Analysis Add-On (+$1.50/mo)
- ✅ 15 clips/month (up to 2 minutes each)
- ✅ 5 replays/month
- ✅ Priority processing
- ✅ Basic heatmaps
- ✅ Mistake labels + suggestions

#### 📊 Competitive Insights Add-On (+$0.75/mo)
- ✅ **UNLIMITED** FNCS reports
- ✅ **UNLIMITED** ranked meta breakdowns
- ✅ **UNLIMITED** loadout meta
- ✅ Patch-by-patch competitive changes
- ✅ Pro play patterns + scrim insights

#### 🎤 Voice Interaction Add-On (+$2.00/mo)
- ✅ 100 minutes/month total
- ✅ Real-time "push-to-talk" conversations
- ✅ Tactical coaching
- ✅ Voiced review of clips (if Gameplay Add-On active)

## 📝 Data Structure

### User Document (`/users/{userId}`)
```javascript
{
  plan: 'free' | 'pro',
  messagesSentToday: 0,
  messagesSentThisMonth: 0,
  messageLimitPerDay: 15, // Free tier
  messageLimitPerMonth: 300, // Pro tier
  maxMessageLength: 200, // Free: 200, Pro: 2000
  saveChatHistory: false, // Free: false, Pro: true
  voiceSecondsUsedToday: 0,
  voiceSecondsUsedThisMonth: 0,
  voiceLimitSecondsPerDay: 30, // Free tier
  voiceLimitSecondsPerMonth: 6000, // Voice add-on (100 min = 6000 sec)
  gameplayClipsUsedThisMonth: 0,
  gameplayClipsLimitPerMonth: 15, // If Gameplay add-on
  gameplayReplaysUsedThisMonth: 0,
  gameplayReplaysLimitPerMonth: 5, // If Gameplay add-on
  competitiveInsightsUsedThisMonth: 0,
  competitiveInsightsLimitPerMonth: -1, // -1 = unlimited (if Competitive add-on)
}
```

### Subscription Document (`/subscriptions/{userId}`)
```javascript
{
  plan: 'free' | 'pro',
  planId: 'free' | 'pro_monthly' | 'pro_yearly',
  status: 'active' | 'past_due' | 'canceled',
  addons: {
    gameplay: true/false,
    competitive: true/false,
    voice: true/false,
  },
  currentPeriodStart: timestamp,
  currentPeriodEnd: timestamp,
  renewsAt: timestamp,
}
```

## 🔍 How It Works

### Add-on Detection
The webhook automatically detects add-ons by:
1. **Price amount**: 
   - $6.99 (699 cents) = Base Pro
   - $1.50 (150 cents) = Gameplay Add-On
   - $0.75 (75 cents) = Competitive Add-On
   - $2.00 (200 cents) = Voice Add-On
2. **Product name**: Checks for keywords
3. **Subscription items**: Multiple items = base + add-ons

### Limit Application
- **Free users**: Daily limits (15 messages/day, 30s voice/day)
- **Pro users**: Monthly limits (300 messages/month)
- **With add-ons**: Additional limits added on top

## 🚀 Deploy

```powershell
cd "C:\Users\bende\OneDrive\Desktop\fortnite api"
vercel --prod
```

## ✅ Testing

After deployment:
1. **Test free user creation** - Should have 15 messages/day limit
2. **Test pro subscription** - Should have 300 messages/month limit
3. **Test with add-ons** - Should detect and apply add-on limits
4. **Check Firestore** - Verify limits are set correctly

---

**The new pricing structure is fully implemented!** 🎉

