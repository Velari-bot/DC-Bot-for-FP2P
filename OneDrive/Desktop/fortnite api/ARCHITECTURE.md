# Fortnite API Stack - Architecture

## Overview

This document describes the architecture of the Fortnite API Stack - a microservices-based system for analyzing Fortnite replay files.

## Architecture Diagram

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ HTTP
       ▼
┌─────────────────────────────────────┐
│        Next.js Frontend             │
│        (Port 3000)                  │
│  - React UI                         │
│  - Auth (BetterAuth + Discord)      │
└─────────────┬───────────────────────┘
              │ HTTP
              ▼
┌─────────────────────────────────────┐
│        Fastify API (PAPI)           │
│        (Port 4000)                  │
│  - REST Endpoints                   │
│  - File Upload                      │
│  - Job Management                   │
└──┬──────────────┬───────────────────┘
   │              │
   │              │ Enqueue Jobs
   │              ▼
   │     ┌─────────────────┐
   │     │   Redis Queue   │
   │     │   (BullMQ)      │
   │     └────────┬────────┘
   │              │
   │              │ Dequeue
   │              ▼
   │     ┌─────────────────┐
   │     │  Worker (Node)  │
   │     │  - Process Jobs │
   │     └────────┬────────┘
   │              │
   │              │ HTTP/gRPC
   │              ▼
   │     ┌─────────────────┐
   │     │  C# Parser      │
   │     │  (Port 5000)    │
   │     │  - Parse Replay │
   │     └─────────────────┘
   │
   │ Store Metadata
   ▼
┌─────────────────────────────────────┐
│      Postgres Database              │
│      (Port 5432)                    │
│  - Jobs Table                       │
│  - Users Table                      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│      Cron Monitor                   │
│  - Health Checks (every 5 min)      │
│  - Cleanup (daily at 2 AM)          │
│  - Orphaned Jobs (hourly)           │
└─────────────────────────────────────┘
```

## Service Details

### 1. Next.js Frontend (`apps/web`)

**Technology**: Next.js 14, React 18, TypeScript, Tailwind CSS

**Responsibilities**:
- User interface for uploading replays
- Authentication (BetterAuth + Discord OAuth)
- Displaying analysis results
- Job status monitoring

**Key Files**:
- `src/app/page.tsx` - Main upload page
- `src/lib/api.ts` - API client

### 2. Fastify API (`packages/papi`)

**Technology**: Fastify, BullMQ, Postgres, Redis

**Responsibilities**:
- Accept replay file uploads
- Create analysis jobs
- Enqueue jobs to BullMQ
- Store job metadata in Postgres
- Provide job status API

**Endpoints**:
- `POST /api/analyze` - Upload replay, returns job_id
- `GET /api/analyze/:id` - Get job status and results
- `GET /api/jobs` - List all jobs (admin)
- `GET /health` - Health check

### 3. C# Parser Service (`services/parser-csharp`)

**Technology**: .NET 8, ASP.NET Core Web API

**Responsibilities**:
- High-performance replay file parsing
- Extract player timeline data
- Normalize events
- Return structured JSON

**Endpoints**:
- `POST /Parse/parse` - Parse replay file
- `GET /health` - Health check

**Note**: Currently implements placeholder logic. Replace `ReplayParser.ParseAsync()` with actual Fortnite replay parsing library.

### 4. BullMQ Worker (`packages/worker`)

**Technology**: BullMQ, Node.js, TypeScript

**Responsibilities**:
- Dequeue jobs from Redis
- Send replay files to C# parser service
- Run heuristics (fight detection, no-heal, storm damage)
- Generate heatmap data
- Save results to disk and update database

**Job Flow**:
1. Receive job from queue
2. Update database status to "processing"
3. Send file to parser service
4. Run heuristics on parsed data
5. Generate heatmap
6. Save results to `/data/results/{jobId}.json`
7. Update database status to "completed"

### 5. Postgres Database

**Technology**: Postgres 15

**Schema**:
```sql
CREATE TABLE analysis_jobs (
  id SERIAL PRIMARY KEY,
  job_id VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  file_path TEXT,
  player_id VARCHAR(255),
  result_path TEXT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 6. Redis

**Technology**: Redis 7

**Usage**:
- BullMQ job queue
- Cache (future)
- Rate limiting (future)
- Session storage (future)

### 7. Cron Monitor (`packages/cron-monitor`)

**Technology**: Node.js, TypeScript, node-cron

**Responsibilities**:
- Health checks every 5 minutes
- Cleanup old files daily at 2 AM
- Cleanup orphaned jobs hourly
- Send Discord alerts on service failures

## Data Flow

### Upload Flow

1. User uploads replay via Next.js frontend
2. Frontend sends POST to `/api/analyze` with file
3. Fastify API saves file to disk
4. Fastify API creates job in Postgres (status: "pending")
5. Fastify API enqueues job to BullMQ
6. Fastify API returns job_id to frontend
7. Frontend polls `/api/analyze/:id` for status

### Processing Flow

1. Worker dequeues job from BullMQ
2. Worker updates database status to "processing"
3. Worker reads file from disk
4. Worker sends file to C# parser via HTTP POST
5. C# parser parses replay and returns JSON
6. Worker runs heuristics on parsed data
7. Worker generates heatmap data
8. Worker saves results to `/data/results/{jobId}.json`
9. Worker updates database status to "completed" with result_path
10. Frontend polling detects status change and displays results

## Environment Variables

See `.env.example` for all environment variables.

Key variables:
- `DATABASE_URL` - Postgres connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret for JWT tokens
- `PARSER_URL` - C# parser service URL
- `DISCORD_CLIENT_ID` - Discord OAuth client ID
- `DISCORD_WEBHOOK_URL` - Discord webhook for alerts

## Scaling Considerations

### Horizontal Scaling

- **Workers**: Can scale horizontally. Each worker processes jobs independently.
- **Frontend**: Can scale horizontally with load balancer.
- **API**: Can scale horizontally, all share same Redis queue and database.

### Vertical Scaling

- **Parser**: CPU-intensive. Consider larger instances or GPU acceleration.
- **Database**: Monitor query performance, add indexes as needed.
- **Redis**: Monitor memory usage, consider Redis Cluster for large scale.

### Queue Management

- Use BullMQ's concurrency settings to control worker throughput
- Monitor queue depth and scale workers accordingly
- Implement job prioritization for premium users

## Security

### Authentication

- BetterAuth handles JWT generation and validation
- Discord OAuth for social login
- Store tokens securely (httpOnly cookies recommended)

### File Uploads

- Validate file types (only .replay files)
- Limit file size (100MB default)
- Scan for malware (future)
- Rate limit uploads per user

### API Security

- JWT validation on protected endpoints
- Rate limiting (future)
- CORS configuration
- Input validation

## Monitoring

### Health Checks

- All services expose `/health` endpoint
- Cron monitor checks all services every 5 minutes
- Discord alerts on service failures

### Logging

- Structured logging (JSON format recommended)
- Log levels: INFO, WARN, ERROR
- Centralized logging (future: ELK stack, Loki)

### Metrics

- Job completion rate
- Processing time per job
- Queue depth
- Error rates
- Service uptime

## Future Enhancements

1. **Real-time Updates**: WebSocket or Server-Sent Events for job status
2. **Video Processing**: Generate highlight reels from replays
3. **AI Analysis**: ML models for gameplay insights
4. **Object Storage**: Move to S3/Azure Blob for replays and results
5. **CDN**: Serve static assets via CDN
6. **Caching**: Redis cache for frequently accessed results
7. **Rate Limiting**: Implement per-user rate limits
8. **Malware Scanning**: Scan uploads for malicious files
9. **Batch Processing**: Support bulk replay uploads
10. **Export**: Allow users to export results in various formats
