# Fortnite Core

A TypeScript monorepo for Fortnite data processing tools.

## Structure

- `/data-ingestion` - 🆕 **Multi-source data collector** (Epic, News, Fortnite-API, Twitter, Reddit)
- `/ai-assistant` - 🆕 **AI chat with RAG** (OpenAI + Pinecone vector search)
- `/tweet-tracker` - Twitter/X competitive tweet tracking
- `/api` - Main API server (11 REST endpoints)
- `/manifest-parser` - Manifest parser
- `/pak-parser` - Pak file parser
- `/replay-parser` - Replay parser
- `/scheduler` - Scheduler service
- `/database` - Database layer

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables (optional - for tweet tracking):
   ```bash
   # Set your Twitter API credentials
   X_BEARER_TOKEN=your_bearer_token_here
   TRACKED_TWITTER_USERS=FortniteGame,EpicGames,Kinch,Osirion
   ```

3. Build all packages:
   ```bash
   npm run build
   ```

4. Start the API server:
   ```bash
   cd packages/api
   npm start
   ```

## 🎮 Fortnite Competitive Intelligence System

A complete AI-powered system for tracking and analyzing the Fortnite competitive scene.

### Features

✅ **Multi-Source Data Ingestion** (204 records from 5 sources)  
✅ **AI Assistant with RAG** (OpenAI + vector search)  
✅ **Tweet Tracker** (20 competitive tweets)  
✅ **Tournament Schedule** (Simpsons Season, 18 days)  
✅ **REST API** (11 endpoints)  
✅ **Live Dashboard** (dark mode, real-time updates)  

### Quick Start

1. **Install & Build:**
   ```bash
   npm install
   npm run build
   ```

2. **Run Data Ingestion:**
   ```bash
   cd packages/data-ingestion
   npm run ingest:once
   ```

3. **Start API Server:**
   ```bash
   cd ../api
   npm start
   ```

4. **Access Dashboard:**
   ```
   http://localhost:3000/tweets.html
   ```

### API Endpoints

**Data:**
- `GET /api/data` - Multi-source ingested data (204 records)
- `GET /api/data?source=epic` - Filter by source
- `GET /api/data?tag=tournament` - Filter by tag

**Tweets:**
- `GET /api/tweets` - Competitive tweets (20 tweets)
- `GET /api/tweets/:username` - Tweets by user
- `GET /api/tweet-stats` - Tweet statistics

**AI:**
- `POST /api/chat` - AI chat with RAG (works with/without OpenAI)

**Other:**
- `GET /api/shop` - Item shop data
- `GET /api/events` - Tournaments & events
- `GET /api/diagnostics` - System health

### Documentation

📚 **[START-HERE.md](START-HERE.md)** - Quick start guide  
📊 **[FINAL-SUMMARY.md](FINAL-SUMMARY.md)** - Complete system overview  
📖 **[COMPLETE-SYSTEM-GUIDE.md](COMPLETE-SYSTEM-GUIDE.md)** - Full documentation  
🔧 **[docs/DATA-INGESTION.md](docs/DATA-INGESTION.md)** - Multi-source ingestion  
🤖 **[AI-ASSISTANT-GUIDE.md](AI-ASSISTANT-GUIDE.md)** - AI system guide

## Packages

Each package is independently versioned and can be built separately.

