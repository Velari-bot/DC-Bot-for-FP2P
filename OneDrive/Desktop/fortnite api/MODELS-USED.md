# 🤖 AI Models Used in PathGen

## 📝 Text Chat Model

**Model:** `gpt-4o-mini` (default)

- **Configurable via:** `OPENAI_MODEL` environment variable
- **Fallback:** If `OPENAI_MODEL` is not set, defaults to `gpt-4o-mini`
- **Location:** `apps/web/app/api/chat/route.ts`
- **Features:**
  - Fast and efficient
  - Cost-effective
  - Nearly GPT-4 level intelligence
  - Perfect for chat and coaching

### Configuration
```typescript
model: process.env.OPENAI_MODEL || 'gpt-4o-mini'
```

### Settings
- **Max tokens:** Varies by user tier (Free: 200 chars, Pro: 2000 chars)
- **Temperature:** Default (varies by context)
- **Response format:** JSON for structured responses

---

## 🎤 Voice Interaction Models

### 1. Speech-to-Text (Transcription)

**Model:** `whisper-1`

- **Purpose:** Converts user's voice recording to text
- **Location:** `apps/web/app/api/voice/coach/route.ts`
- **Settings:**
  - Language: English (`en`)
  - Format: Accepts WebM audio files

```typescript
const transcription = await openai.audio.transcriptions.create({
  file: audioFile,
  model: 'whisper-1',
  language: 'en',
});
```

### 2. AI Response Generation

**Model:** `gpt-4o-mini` (same as text chat)

- **Configurable via:** `OPENAI_MODEL` environment variable
- **Fallback:** If `OPENAI_MODEL` is not set, defaults to `gpt-4o-mini`
- **Location:** `apps/web/app/api/voice/coach/route.ts`
- **Settings:**
  - **Max tokens:** 150 (short responses for voice)
  - **Temperature:** 0.7
  - **Response format:** JSON object
  - **Prompt:** Optimized for short, tactical voice responses (3-7 seconds)

```typescript
const completion = await openai.chat.completions.create({
  model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  messages: [...],
  max_tokens: 150,
  temperature: 0.7,
  response_format: { type: 'json_object' },
});
```

### 3. Text-to-Speech (TTS)

**Model:** `tts-1`

- **Purpose:** Converts AI response text to speech audio
- **Location:** `apps/web/app/api/voice/coach/route.ts`
- **Current voice:** `alloy` (hardcoded as default)
- **Available voices:** 
  - `alloy` - Clear and confident (currently used)
  - `echo` - Deep and resonant
  - `fable` - Warm and expressive
  - `onyx` - Strong and authoritative
  - `nova` - Energetic and upbeat
  - `shimmer` - Soft and gentle
  - `vale` - Bright and inquisitive (also available in UI)
  - `charon` - Mysterious and calm

**Note:** The frontend shows 8 voice options in the UI, but the backend currently only uses `alloy`. To use different voices, you need to:
1. Send the selected voice from frontend to backend
2. Update the backend to use the selected voice

```typescript
const ttsResponse = await openai.audio.speech.create({
  model: 'tts-1',
  voice: 'alloy', // TODO: Make this dynamic based on user selection
  input: responseText,
});
```

---

## 🎯 Model Summary

| Feature | Model | Configurable | Default |
|---------|-------|--------------|---------|
| **Text Chat** | `gpt-4o-mini` | ✅ Yes (`OPENAI_MODEL`) | `gpt-4o-mini` |
| **Voice Transcription** | `whisper-1` | ❌ No | `whisper-1` |
| **Voice AI Response** | `gpt-4o-mini` | ✅ Yes (`OPENAI_MODEL`) | `gpt-4o-mini` |
| **Voice TTS** | `tts-1` | ❌ No | `tts-1` |
| **TTS Voice** | `alloy` | ⚠️ Partial (hardcoded) | `alloy` |

---

## 🔧 How to Change Models

### Change Chat/Voice AI Model

1. **Via Environment Variable (Recommended):**
   ```bash
   # In Vercel Dashboard → Environment Variables
   OPENAI_MODEL=gpt-4o
   # or
   OPENAI_MODEL=gpt-4-turbo
   ```

2. **Via Code:**
   Edit `apps/web/app/api/chat/route.ts` or `apps/web/app/api/voice/coach/route.ts`:
   ```typescript
   model: 'gpt-4o' // or your preferred model
   ```

### Change TTS Voice

Currently, the voice is hardcoded. To make it dynamic:

1. **Frontend sends voice selection:**
   ```javascript
   formData.append('voice', selectedVoice); // 'alloy', 'echo', etc.
   ```

2. **Backend uses selected voice:**
   ```typescript
   const voice = formData.get('voice') as string || 'alloy';
   const ttsResponse = await openai.audio.speech.create({
     model: 'tts-1',
     voice: voice, // Use selected voice
     input: responseText,
   });
   ```

---

## 📊 Model Costs (Approximate)

### GPT-4o-mini
- **Input:** ~$0.15 per 1M tokens
- **Output:** ~$0.60 per 1M tokens
- **Best for:** Chat and voice responses

### Whisper-1
- **Cost:** ~$0.006 per minute of audio
- **Best for:** Voice transcription

### TTS-1
- **Cost:** ~$0.015 per 1K characters
- **Best for:** Text-to-speech generation

---

## 🎤 Available TTS Voices

The frontend shows these voice options, but only `alloy` is currently implemented:

1. **Vale** - Bright and inquisitive
2. **Alloy** - Clear and confident ✓ (currently used)
3. **Echo** - Deep and resonant
4. **Fable** - Warm and expressive
5. **Onyx** - Strong and authoritative
6. **Nova** - Energetic and upbeat
7. **Shimmer** - Soft and gentle
8. **Charon** - Mysterious and calm

**Note:** All 8 voices are available in OpenAI's TTS API. The backend just needs to be updated to accept the voice selection from the frontend.

