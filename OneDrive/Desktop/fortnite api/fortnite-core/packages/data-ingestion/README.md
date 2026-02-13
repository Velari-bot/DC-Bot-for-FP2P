# @fortnite-core/data-ingestion

Multi-source data ingestion system for Fortnite competitive intelligence.

## Overview

Collects, normalizes, and stores data from multiple sources:
- 📱 **Twitter** - Competitive tweets (osirion_gg, KinchAnalytics, FNcompReport)
- 🎮 **Epic CMS** - Official Fortnite content, news, tournaments
- 🔮 **Fortnite-API.com** - Third-party API (news, shop, tournaments)
- 🤖 **Reddit** - Community posts from r/FortniteBR, r/FortniteCompetitive, r/FortniteLeaks
- 📰 **News RSS** - Fortnite Insider, ShiinaBR, HYPEX

## Features

- ✅ Unified schema for all data sources
- ✅ Automatic deduplication
- ✅ Smart pruning (keeps 20,000 most recent)
- ✅ Scheduled ingestion (every 10 minutes)
- ✅ Error handling per source
- ✅ Detailed logging
- ✅ Feeds AI assistant for RAG

## Quick Start

### 1. Install
```bash
npm install
npm run build
```

### 2. Configure (Optional)
```env
# Reddit (optional)
REDDIT_CLIENT_ID=your_id
REDDIT_SECRET=your_secret
REDDIT_USER_AGENT=fortnite-ingestor/1.0

# Fortnite-API (optional)
FORTNITE_API_KEY=your_key
```

### 3. Run

**One-time ingestion:**
```bash
npm run ingest:once
```

**Scheduled (every 10 min):**
```bash
npm start
```

## Data Schema

All sources normalized to:
```typescript
interface FortniteRecord {
  id: string;
  source: 'twitter' | 'epic' | 'fortnite-api' | 'reddit' | 'news';
  author?: string;
  title?: string;
  content: string;
  created_at: string;
  url?: string;
  tags?: string[];
}
```

## Storage

**Primary:** `data/ingestion/records.json`
- Full dataset (up to 20,000 records)
- Includes stats and metadata

**Latest:** `data/ingestion/latest.json`
- 100 most recent records
- Quick access for AI assistant

**Logs:** `data/ingestion/ingestion.log`
- NDJSON format
- One line per ingestion run

## API Integration

The API package exposes ingested data at:

```bash
# Get all data
GET /api/data

# Filter by source
GET /api/data?source=twitter

# Filter by tag
GET /api/data?tag=tournament

# Limit results
GET /api/data?limit=50
```

## Adding New Sources

Create a new file in `src/sources/`:

```typescript
// src/sources/my-source.ts
import { FortniteRecord } from '../types';

export async function collectMyData(): Promise<FortniteRecord[]> {
  const records: FortniteRecord[] = [];
  
  // Your collection logic
  
  return records;
}
```

Then add to `src/index.ts`:

```typescript
import { collectMyData } from './sources/my-source';

const sources = [
  // ...existing sources
  { name: 'My Source', fn: collectMyData, source: 'my-source' },
];
```

## Sources Details

### Twitter
- Reads from existing tweet-tracker database
- No additional API calls
- ~20 tweets currently

### Epic CMS
- Official Fortnite content
- News, tournaments, emergency notices
- No authentication required
- Reliable and fast

### Fortnite-API.com
- Third-party wrapper for Fortnite data
- News, shop, tournaments
- Optional API key for higher limits
- Good for structured data

### Reddit
- Requires app credentials
- Fetches hot posts from 3 subreddits
- 10 posts per subreddit
- Community insights and leaks

### News RSS
- No authentication needed
- Fortnite Insider, ShiinaBR, HYPEX feeds
- 10 articles per feed
- Latest news and leaks

## Scheduling

**Default:** Every 10 minutes (`*/10 * * * *`)

**Change schedule in `src/config.ts`:**
```typescript
cronSchedule: '*/30 * * * *', // Every 30 minutes
```

## Performance

- **Ingestion time:** ~10-30 seconds
- **Storage:** ~5-15MB for 20,000 records
- **Memory:** ~50MB during ingestion
- **CPU:** Minimal

## Error Handling

Each source fails independently:
- ✅ If Twitter fails, Epic/News still work
- ✅ Errors logged but don't stop other sources
- ✅ Partial data better than no data

## Maintenance

**View logs:**
```bash
tail -f data/ingestion/ingestion.log
```

**Check stats:**
```bash
cat data/ingestion/records.json | jq '.stats'
```

**Manual run:**
```bash
npm run ingest:once
```

## Integration with AI

The AI assistant automatically loads from this unified data:

```typescript
import { loadFromIngestion } from '@fortnite-core/ai-assistant';

const data = await loadFromIngestion();
// Returns all normalized records from all sources
```

## License

Part of Fortnite Core API monorepo.

