# Gameplay Analysis Microservice (PathGen)

MVP microservice for analyzing Fortnite replays and gameplay clips. Extracts key events, detects mistakes, and generates actionable drills.

## Overview

Microservice that ingests Fortnite `.replay` files or `.mp4` clips and produces automated gameplay analysis and drills.

## Features

- **Replay & Clip Analysis**: Accepts `.replay` files or `.mp4` video clips (mock clip parsing)
- **Event Detection**: Automatically detects fights, rotations, highground losses, healing issues, and storm exposure
- **Human-Readable Analysis**: Generates concise summaries, insights, and prioritized drills
- **Structured JSON Output**: Returns detailed events and metrics for frontend rendering
- **Background Processing**: Uses BullMQ/Redis queue for async job processing
- **REST API**: Clean API endpoints with job status polling

## Installation

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test
```

## Prerequisites

- Node.js 18+
- Redis (for job queue)
- TypeScript

## Environment Variables

```env
REDIS_URL=redis://localhost:6379
GAMEPLAY_ANALYSIS_PORT=3001
```

## API Endpoints

### POST /api/analyze

Upload a replay or clip for analysis.

**Request** (multipart/form-data):
- `file` (required): `.replay` or `.mp4` file
- `type` (required): `"replay"` or `"clip"`
- `player_id` (required): Player identifier
- `start_time` (optional): Start time in seconds (for clips)
- `end_time` (optional): End time in seconds (for clips)
- `playstyle_id` (optional): Playstyle identifier

**Response**:
```json
{
  "job_id": "uuid",
  "status": "queued"
}
```

### GET /api/analyze/:job_id

Get job status and analysis result.

**Response** (queued/processing):
```json
{
  "job_id": "uuid",
  "status": "queued",
  "progress": 0
}
```

**Response** (complete):
```json
{
  "job_id": "uuid",
  "status": "complete",
  "analysis": {
    "summary": "You lost 2 out of 3 fights...",
    "insights": ["Fight 1: Missed 2 initial shots..."],
    "drills": [
      {
        "title": "Aim under pressure",
        "description": "5x 30-second close-quarter aim drills",
        "difficulty": "easy"
      }
    ],
    "events": [...],
    "metrics": {
      "total_damage": 350,
      "avg_fight_duration": 6.2,
      "fight_win_rate": 0.33,
      "avg_accuracy": 0.27,
      "times_in_storm": 2,
      "loot_efficiency_score": 0.54
    },
    "jump_timestamps": [
      { "label": "Fight 1", "time": 123.45 }
    ]
  }
}
```

### DELETE /api/analyze/:job_id

Cancel or delete analysis result.

## Usage Example

```bash
# Start Redis (if not running)
redis-server

# Start the service
npm run build
node dist/index.js

# Upload a replay
curl -X POST http://localhost:3001/api/analyze \
  -F "file=@/path/to/replay.replay" \
  -F "type=replay" \
  -F "player_id=player123"

# Check status
curl http://localhost:3001/api/analyze/{job_id}

# Get result (when complete)
curl http://localhost:3001/api/analyze/{job_id}
```

## Heuristics

The service uses rule-based heuristics to detect events:

1. **Fight Detection**: Consecutive damage events separated by < 8s → same fight
2. **Highground Loss**: Vertical position decrease > 2m during fight
3. **No Healing After Fight**: No healing used in 20s after fight end with HP < 75%
4. **Storm Exposure**: Detects storm damage and late rotations

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ POST /analyze
       ▼
┌─────────────┐
│   API       │ → Queue Job
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Queue     │ (BullMQ/Redis)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Worker    │ → Parse → Detect → Generate
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Storage   │ (JSON files)
└─────────────┘
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm run test:watch
```

## Sample Test Files

Place sample replays in `data/replays/` and clips in `data/clips/` for testing.

## Future Enhancements

- ML-based fight detection
- Video HUD OCR for clip analysis
- Custom playstyle model integration
- Heatmap generation
- Team aggregation
- Real-time voice interaction

## License

MIT

