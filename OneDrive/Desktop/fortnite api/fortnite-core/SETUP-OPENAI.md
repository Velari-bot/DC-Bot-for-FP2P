# 🤖 Setting Up OpenAI for PathGen AI

## Current Configuration

The AI assistant is now configured to use **GPT-4o-mini** - OpenAI's fast and efficient mini model.

## Setup Instructions

### 1. Create/Edit `.env` File

In the `fortnite-core` directory, create or edit the `.env` file:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here

# Optional: Pinecone for vector search (advanced)
PINECONE_API_KEY=your-pinecone-key-here
PINECONE_ENV=us-east1-gcp
PINECONE_INDEX=fortnite-tracker

# Twitter API (for live tweets)
X_BEARER_TOKEN=your-twitter-bearer-token-here
TRACKED_TWITTER_USERS=osirion_gg,KinchAnalytics,FNcompReport
```

### 2. Get Your OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. Paste it in `.env` as `OPENAI_API_KEY`

### 3. Rebuild and Restart

```bash
# Rebuild the AI assistant
cd packages/ai-assistant
npm run build

# Rebuild the API
cd ../api
npm run build

# Restart the server
npm start
```

## How It Works

### Without OpenAI API Key:
- ✅ **Mock responses work** - Intelligent fallback responses
- ✅ **Sources included** - Verifiable information
- ✅ **Database integration** - Uses real tournament/tweet data
- ✅ **Context-aware** - Different responses for different questions

### With OpenAI API Key:
- ✅ **GPT-4o-mini responses** - Advanced AI understanding
- ✅ **RAG (Retrieval Augmented Generation)** - Uses your database
- ✅ **Context-aware** - References specific tweets, tournaments
- ✅ **Sources included** - Shows what data AI used
- ✅ **Conversation memory** - Remembers chat history

## Model: GPT-4o-mini

### Why GPT-4o-mini?
- **Fast**: 2-3x faster than GPT-4
- **Cost-effective**: ~80% cheaper than GPT-4
- **Smart**: Nearly GPT-4 level intelligence
- **Perfect for**: Chat, coaching, real-time responses

### Current Settings:
```typescript
chatModel: 'gpt-4o-mini'
maxTokens: 2000
temperature: 0.7
```

## Testing

### Test Without API Key:
```
Ask: "What tournaments are coming up?"
Response: Real tournament schedule from database + sources
```

### Test With API Key:
```
Ask: "What's the current Fortnite meta?"
Response: GPT-4o-mini analysis + sources from tweets/database
```

## Sources Feature

Every AI response now includes a **"📚 Sources & References"** section:

- Shows where the information came from
- Includes titles, descriptions, and links
- Clickable to verify information
- Color-coded with blue accents

### Example Sources:
- Tournament schedules from Epic CMS
- Competitive tweets from @osirion_gg
- Stats from @KinchAnalytics
- Creative map codes
- Official Fortnite links

## Current Status

✅ **AI is configured for GPT-4o-mini**  
✅ **Mock responses work without API key**  
✅ **Sources always included**  
✅ **Database integration ready**  
✅ **Real-time Twitter data available**  

Just add your OpenAI API key to `.env` and restart the server to unlock full AI capabilities!

