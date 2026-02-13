# ✅ PathGen AI Voice + Usage Tracking System — IMPLEMENTED

## Overview

The comprehensive AI Voice Interaction system has been implemented with usage tracking, tier limits, Firestore integration, and abuse protections.

## Files Created/Updated

### 1. `.cursorrules`
- **Purpose**: System prompt rules for Cursor AI
- **Location**: Root directory
- **Contents**: Complete PathGen AI Coach rules including:
  - Allowed topics (Fortnite only)
  - Blocked content
  - Voice mode behavior
  - Usage tracking rules
  - Limit enforcement
  - Response formatting
  - Abuse protection

### 2. `apps/web/app/api/chat/route.ts` (Updated)
- **Purpose**: Chat API endpoint with voice support and usage tracking
- **New Features**:
  - ✅ Usage limit checking (text and voice)
  - ✅ Voice mode support with JSON response format
  - ✅ Free tier limits (15 messages/day, 30s voice/day)
  - ✅ Pro tier limits (300 messages/month)
  - ✅ Voice add-on limits (100 minutes/month)
  - ✅ Enhanced system prompt with mode-specific instructions
  - ✅ JSON response format enforcement
  - ✅ Firestore integration for user/usage data

## API Endpoint

### POST `/api/chat`

**Request Body:**
```json
{
  "query": "How do I improve my box fighting?",
  "mode": "text" | "voice",  // Optional, defaults to "text"
  "userId": "user123",        // Required for usage tracking
  "conversation_history": [], // Optional
  "max_context": 10           // Optional
}
```

**Response Format:**

**Text Mode:**
```json
{
  "type": "text",
  "text": "Here's how to improve your box fighting...",
  "sources": [],
  "timestamp": "2025-11-29T..."
}
```

**Voice Mode:**
```json
{
  "type": "voice",
  "text": "Your crosshair drops too low during fights. Keep it neck height when entering a box.",
  "emotion": "calm",
  "sources": [],
  "timestamp": "2025-11-29T..."
}
```

**Limit Exceeded Response:**
```json
{
  "type": "text" | "voice",
  "text": "You've hit your daily message limit. Upgrade to Pro to unlock more!",
  "limitExceeded": true,
  "limitType": "daily" | "monthly" | "voice_free" | "voice_monthly",
  "remaining": 0,
  "limit": 15
}
```

## Usage Limits

### Free Tier
- **Text**: 15 messages/day
- **Voice**: 30 seconds/day
- **Message Length**: 200 characters max
- **Chat History**: Not saved

### Base Pro Tier ($6.99/mo)
- **Text**: 300 messages/month
- **Voice**: ❌ No voice access
- **Message Length**: 2,000 characters max
- **Chat History**: ✅ Saved
- **Model**: Better responses

### Voice Add-On (+$1.99/mo)
- **Voice**: 100 minutes/month (6,000 seconds)
- **Features**: Real-time push-to-talk, tactical coaching, voiced clip review

## Usage Tracking Flow

1. **Request Received** → Check `userId`
2. **Firestore Lookup** → Get user and usage documents
3. **Period Check** → Verify billing cycle hasn't expired
4. **Limit Check** → Compare current usage vs. limits
5. **Response**:
   - ✅ **Under Limit**: Process request, generate response
   - ❌ **Over Limit**: Return limit exceeded message
6. **Usage Update** → Tracked separately by backend functions

## Voice Mode Behavior

When `mode: "voice"`:

- **Response Length**: 3-7 seconds when spoken
- **Style**: Tactical, direct, actionable
- **Format**: Short sentences with 1-3 improvements
- **Tone**: Calm but firm (like a coach)
- **Content**: Focused on specific gameplay tips

## Abuse Protection

The system automatically rejects:
- ❌ Non-Fortnite topics
- ❌ Jailbreak attempts
- ❌ "Ignore previous instructions"
- ❌ Off-topic requests (homework, coding, etc.)

## Frontend Integration

The frontend should:

1. **Check User Status** before sending requests
2. **Pass `userId`** in request body
3. **Set `mode`** based on UI (text input vs. voice button)
4. **Parse JSON Response** to extract `type`, `text`, and `emotion`
5. **Convert Voice Text** to audio using TTS (e.g., Web Speech API)
6. **Display Limit Warnings** when `limitExceeded: true`

## Example Frontend Code

```javascript
async function sendMessage(query, mode = 'text') {
  const userId = getCurrentUserId(); // From auth
  
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      mode,
      userId,
      conversation_history: getConversationHistory()
    })
  });
  
  const data = await response.json();
  
  if (data.limitExceeded) {
    showLimitWarning(data.text);
    return;
  }
  
  if (data.type === 'voice') {
    // Convert text to speech
    speakText(data.text, data.emotion);
  } else {
    // Display text response
    displayMessage(data.text);
  }
}
```

## Next Steps

1. ✅ **Backend**: Complete (usage tracking, limits, voice mode)
2. ⏳ **Frontend**: Update `chat.html` to:
   - Pass `userId` and `mode` parameters
   - Parse JSON responses
   - Implement voice TTS
   - Display limit warnings
3. ⏳ **Testing**: Test with real users and various tier limits
4. ⏳ **Monitoring**: Track usage patterns and adjust limits if needed

## System Prompt Location

The comprehensive system prompt is stored in:
- `.cursorrules` (for Cursor AI)
- `apps/web/app/api/chat/route.ts` (in `FORTNITE_COACH_SYSTEM_PROMPT` constant)

Both are kept in sync and define the exact behavior of the AI coach.

