# Gameplay Analysis Service - Usage Guide

## Service Status

✅ **Service is running on port 3001**

The API server is operational. Redis connection errors are expected if Redis isn't running - the API will still work, but job processing requires Redis.

## API Endpoints

### 1. Health Check
```bash
GET http://localhost:3001/health
```

**Response:**
```json
{
  "status": "ok"
}
```

### 2. Upload Replay/Clip for Analysis
```bash
POST http://localhost:3001/api/analyze
Content-Type: multipart/form-data
```

**Form Data:**
- `file` (required): The replay file (.replay) or video clip (.mp4, .mov, .avi)
- `playerId` (required): Player identifier
- `type` (required): Either "replay" or "clip"
- `startTime` (optional): Start time in seconds (for clips)
- `endTime` (optional): End time in seconds (for clips)
- `playstyleId` (optional): Playstyle identifier

**Example using curl:**
```bash
curl -X POST http://localhost:3001/api/analyze \
  -F "file=@path/to/replay.replay" \
  -F "playerId=player123" \
  -F "type=replay"
```

**Response:**
```json
{
  "job_id": "uuid-here",
  "status": "queued"
}
```

### 3. Check Analysis Status
```bash
GET http://localhost:3001/api/analyze/:jobId
```

**Example:**
```bash
GET http://localhost:3001/api/analyze/abc123-def456-ghi789
```

**Response (while processing):**
```json
{
  "job_id": "abc123-def456-ghi789",
  "status": "processing"
}
```

**Response (when complete):**
```json
{
  "job_id": "abc123-def456-ghi789",
  "status": "complete",
  "analysis": {
    "summary": "Detected 3 fights. 2 fights involved highground loss.",
    "insights": [
      "Fight 1: No healing used after fight — risky when HP <75%",
      "Fight 2: Highground was lost during the fight."
    ],
    "drills": [
      {
        "title": "Healing Timing",
        "description": "Practice healing immediately after a fight when safe",
        "difficulty": "medium"
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
      { "label": "fight_1", "time": 123.45 }
    ]
  }
}
```

### 4. Delete Analysis Result
```bash
DELETE http://localhost:3001/api/analyze/:jobId
```

## Testing the Service

### Quick Test (Health Check)
```powershell
Invoke-WebRequest -Uri http://localhost:3001/health -UseBasicParsing
```

### Test with Sample Data
You can test with the synthetic replay file:
```powershell
# First, get the full path to the sample data
$sampleFile = Resolve-Path "sample-data\synthetic-replay.json"

# Upload it (note: this is JSON format for testing)
curl -X POST http://localhost:3001/api/analyze `
  -F "file=@$sampleFile" `
  -F "playerId=test-player" `
  -F "type=replay"
```

## Redis Requirement

⚠️ **Note:** While the API server runs without Redis, **job processing requires Redis**.

### To Enable Full Functionality:

1. **Install Redis** (if not installed):
   - Windows: Download from https://github.com/microsoftarchive/redis/releases
   - Or use Docker: `docker run -d -p 6379:6379 redis`
   - Or use WSL: `wsl redis-server`

2. **Start Redis:**
   ```bash
   redis-server
   ```

3. **Restart the service:**
   ```bash
   npm start
   ```

Once Redis is running, you'll see:
```
✅ Connected to Redis
```

And job processing will work fully.

## Example Workflow

1. **Upload a replay:**
   ```bash
   POST /api/analyze
   → Returns: { "job_id": "abc123", "status": "queued" }
   ```

2. **Poll for results:**
   ```bash
   GET /api/analyze/abc123
   → Returns: { "status": "processing" } (keep polling)
   → Eventually: { "status": "complete", "analysis": {...} }
   ```

3. **View the analysis:**
   - Read the `summary`, `insights`, and `drills`
   - Check `metrics` for performance data
   - Use `jump_timestamps` to navigate to specific events in the replay

## Troubleshooting

- **Port 3001 already in use?** Change `GAMEPLAY_ANALYSIS_PORT` in `.env`
- **Redis errors?** Expected if Redis isn't running. API still works, but jobs won't process.
- **File upload fails?** Check file size (max 500MB) and file type (.replay, .mp4, .mov, .avi)

