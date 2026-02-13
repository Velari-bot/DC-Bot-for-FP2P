# 💰 New Pricing Structure - Implemented

## ✅ What's Been Updated

### 1. Constants (`apps/web/lib/constants.ts`)
- ✅ **FREE TIER** limits: 15 messages/day, 200 chars max, no chat history
- ✅ **BASE PRO** limits: 300 messages/month, 2000 chars, saves history
- ✅ **ADD-ONS** limits defined:
  - Gameplay: 15 clips + 5 replays/month
  - Competitive: UNLIMITED insights
  - Voice: 100 minutes/month

### 2. User Creation (`apps/web/app/api/users/create/route.ts`)
- ✅ Creates users with FREE TIER limits by default
- ✅ Sets up subscription document with add-ons tracking
- ✅ Uses new limit structure

### 3. Webhook Handler (`apps/web/app/api/stripe/webhook/route.ts`)
- ✅ Detects add-ons from subscription items
- ✅ Applies correct limits based on plan + add-ons
- ✅ Updates user document with new limit structure

## 📊 Limit Structure

### Free Tier Users
```javascript
{
  messageLimitPerDay: 15,
  maxMessageLength: 200,
  saveChatHistory: false,
  voiceLimitSecondsPerDay: 30,
  competitiveInsightsLimitPerMonth: 4, // 1/week
}
```

### Base Pro Users
```javascript
{
  messageLimitPerMonth: 300,
  maxMessageLength: 2000,
  saveChatHistory: true,
  betterModelResponses: true,
}
```

### With Add-ons
- **Gameplay Add-On**: +15 clips/month, +5 replays/month
- **Competitive Add-On**: UNLIMITED insights
- **Voice Add-On**: +100 minutes/month

## 🔍 How Add-ons Are Detected

The webhook detects add-ons by:
1. **Price amount**: $1.50 (150 cents) = Gameplay, $0.75 (75 cents) = Competitive, $2.00 (200 cents) = Voice
2. **Product name**: Checks for keywords like "gameplay", "competitive", "voice"
3. **Metadata**: Checks price metadata for add-on flags

## 🚀 Next Steps

1. **Deploy the changes**:
   ```powershell
   cd "C:\Users\bende\OneDrive\Desktop\fortnite api"
   vercel --prod
   ```

2. **Test with a purchase**:
   - Make a test purchase with add-ons
   - Check Firestore to verify limits are set correctly
   - Verify add-ons are detected in subscription document

3. **Update frontend** to enforce these limits:
   - Check `messageLimitPerDay` for free users
   - Check `messageLimitPerMonth` for pro users
   - Check `maxMessageLength` before sending messages
   - Check add-on limits before allowing features

---

**The pricing structure is now implemented in the backend!** 🎉

