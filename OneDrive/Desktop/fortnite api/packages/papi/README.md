# PAPI - Fortnite API Server

## Quick Start

```bash
npm run dev
```

Server will start on **port 4000** (required for frontend).

## Environment Variables

Optional:
- `REDIS_URL` - For job queue (optional)
- `DATABASE_URL` - For job tracking (optional)
- `OSIRION_API_KEY` - For replay analysis

## Endpoints

- `POST /api/chat` - AI chat with video knowledge
- `POST /api/analyze/upload` - Upload replay for analysis
- `GET /api/tweets` - Get competitive tweets
- `GET /health` - Health check

## Note

The server **must** run on port 4000 for the frontend to work correctly.

