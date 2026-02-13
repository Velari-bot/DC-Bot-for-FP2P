# 🤖 Fortnite AI Assistant - Complete Guide

## 🎯 What This Is

A production-ready **RAG (Retrieval-Augmented Generation) system** that:
- ✅ Ingests data from Twitter, Fortnite API, tournament schedules
- ✅ Generates vector embeddings using OpenAI
- ✅ Stores in Pinecone (or in-memory fallback)
- ✅ Provides intelligent chat interface with context-aware responses
- ✅ Cites sources and timestamps in responses

## 📦 Package Structure

```
packages/ai-assistant/
├── src/
│   ├── index.ts           # Main exports
│   ├── config.ts          # Configuration
│   ├── types.ts           # TypeScript types
│   ├── data-loader.ts     # Multi-source data ingestion
│   ├── embeddings.ts      # OpenAI embeddings generation
│   ├── retriever.ts       # Pinecone vector search
│   ├── chat.ts            # RAG-powered chat handler
│   └── ingest-data.ts     # Data ingestion script
├── package.json
└── tsconfig.json
```

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
cd fortnite-core
npm install
```

### Step 2: Set Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...your-key-here

# Optional (for Pinecone)
PINECONE_API_KEY=your-key
PINECONE_ENV=us-east1-gcp
PINECONE_INDEX=fortnite-tracker
```

### Step 3: Build Packages

```bash
npm run build
```

### Step 4: Ingest Data

```bash
cd packages/ai-assistant
npm run ingest
```

This will:
- Load tweets from your tweet-tracker database
- Load tournament schedules
- Generate embeddings
- Upload to Pinecone (or store in memory)

### Step 5: Start API Server

```bash
cd ../api
npm start
```

### Step 6: Test Chat Endpoint

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "What did Osirion say about weapon changes?"}'
```

## 💬 API Usage

### POST /api/chat

**Request:**
```json
{
  "query": "What tournaments are coming up?",
  "conversation_history": [
    {"role": "user", "content": "previous question"},
    {"role": "assistant", "content": "previous answer"}
  ],
  "max_context": 5
}
```

**Response:**
```json
{
  "response": "Based on the Simpsons Season schedule, upcoming tournaments include...",
  "sources": [
    {
      "source": "twitter",
      "author": "osirion_gg",
      "content": "BLINKY FISH REMOVED FROM NON FISHING HOLES...",
      "created_at": "2025-11-04T22:39:42.000Z",
      "relevance_score": 0.85
    }
  ],
  "timestamp": "2025-11-05T00:15:00.000Z"
}
```

## 📊 Data Sources

Currently ingesting:
- ✅ **Twitter** - Real-time tweets from competitive accounts
- ✅ **Tournament Schedule** - Simpsons Season calendar
- 🔜 **Reddit** (planned)
- 🔜 **Fortnite API** (planned)
- 🔜 **News feeds** (planned)

### Adding New Data Sources

Edit `packages/ai-assistant/src/data-loader.ts`:

```typescript
export async function loadRedditData(): Promise<FortniteDataRecord[]> {
  // Your Reddit API logic here
  return records;
}

// Then add to loadAllData()
export async function loadAllData(): Promise<FortniteDataRecord[]> {
  const [tweets, fortnite, reddit] = await Promise.all([
    loadTweets(),
    loadFortniteData(),
    loadRedditData(),  // <-- Add here
  ]);
  
  return [...tweets, ...fortnite, ...reddit];
}
```

## 🧠 How RAG Works

1. **User asks question** → "What did Kinch say about FNCS?"
2. **Generate query embedding** → OpenAI converts question to vector
3. **Search vector database** → Pinecone finds similar content
4. **Retrieve top results** → Get 5 most relevant documents
5. **Build context prompt** → Include retrieved data in system message
6. **Call OpenAI Chat** → GPT generates answer using context
7. **Return response + sources** → User gets answer with citations

## ⚙️ Configuration

Edit `packages/ai-assistant/src/config.ts`:

```typescript
export const config = {
  openai: {
    embeddingModel: 'text-embedding-3-small',
    chatModel: 'gpt-4-turbo-preview',
    maxTokens: 2000,
    temperature: 0.7,
  },
  
  retrieval: {
    topK: 5,              // Number of context documents
    minScore: 0.7,        // Minimum relevance score
  },
  
  ingestion: {
    chunkSize: 500,       // Characters per chunk
    chunkOverlap: 50,     // Overlap between chunks
  },
};
```

## 🔄 Updating Data

Re-run ingestion whenever you have new tweets:

```bash
cd packages/ai-assistant
npm run ingest
```

Or automate it:
```bash
# Run every hour
crontab -e
# Add: 0 * * * * cd /path/to/fortnite-core/packages/ai-assistant && npm run ingest
```

## 🎨 Frontend Integration

### React Component Example

```tsx
import { useState } from 'react';

export function ChatWidget() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    
    const res = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    
    const data = await res.json();
    setResponse(data);
    setLoading(false);
  };

  return (
    <div>
      <input 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ask about Fortnite..."
      />
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Thinking...' : 'Ask'}
      </button>
      
      {response && (
        <div>
          <p>{response.response}</p>
          <div>
            <h4>Sources:</h4>
            {response.sources.map((src, i) => (
              <div key={i}>
                <small>@{src.author} - {new Date(src.created_at).toLocaleDateString()}</small>
                <p>{src.content.substring(0, 100)}...</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

## 📈 Cost Estimates

### OpenAI Costs (per 1000 queries)
- **Embeddings**: ~$0.13 (text-embedding-3-small)
- **Chat**: ~$1.00-3.00 (gpt-4-turbo)

### Pinecone Costs
- **Free tier**: 1 index, 100K vectors
- **Paid**: $0.096/hour for 1 pod

## 🔧 Troubleshooting

### "Missing OPENAI_API_KEY"
```bash
# Add to .env
OPENAI_API_KEY=sk-...your-key
```

### "Pinecone upload failed"
No problem! System falls back to in-memory storage automatically.

### "No context found"
Run ingestion first:
```bash
cd packages/ai-assistant
npm run ingest
```

## 📚 Next Steps

1. ✅ **Add more data sources** (Reddit, news feeds)
2. ✅ **Create dashboard UI** with chat interface
3. ✅ **Add streaming responses** for better UX
4. ✅ **Implement conversation history** for multi-turn chat
5. ✅ **Add Discord/Firebase webhooks** for notifications

## 🎯 Example Queries

Try these:
- "What tournaments are happening this month?"
- "What did Osirion say about weapon changes?"
- "Show me Kinch's latest analytics on FNCS"
- "What's the meta right now?"
- "When is the next solo tournament?"

---

**Built with ❤️ for the Fortnite competitive community**

