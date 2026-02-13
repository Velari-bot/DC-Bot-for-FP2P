# Fortnite API Stack

Modern, scalable architecture for Fortnite replay analysis with microservices, queues, and real-time processing.

## Architecture

- **Frontend**: Next.js (TypeScript) + Tailwind + shadcn UI
- **Auth**: BetterAuth + Discord OAuth2
- **API**: Fastify (Node.js) - Primary REST API
- **Parser**: C# microservice for high-performance replay parsing
- **Queue & Workers**: BullMQ (Node) + Redis for job orchestration
- **DB & Cache**: Postgres (primary data) + Redis (cache, queues, sessions)
- **Monitoring**: TypeScript cron job for health checks and cleanup

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)
- .NET 8 SDK (for C# parser development)

### Setup

1. **Clone and configure environment:**

```bash
cp .env.example .env
# Edit .env with your values (Discord OAuth, JWT secrets, etc.)
```

2. **Start all services:**

```bash
docker-compose up --build
```

This will start:
- Postgres on port 5432
- Redis on port 6379
- Fastify API on port 4000
- Next.js frontend on port 3000
- C# parser service on port 5000
- BullMQ worker
- Cron monitor

3. **Access services:**

- Frontend: http://localhost:3000
- API: http://localhost:4000
- API Health: http://localhost:4000/health
- Parser Health: http://localhost:5000/health

## Project Structure

```
/fortnite-api-stack
  /apps
    /web                # Next.js frontend
  /packages
    /papi               # Fastify API
    /worker             # BullMQ worker (node)
    /cron-monitor       # health checks, cleanup
  /services
    /parser-csharp      # C# replay parser microservice
  /data
    /replays            # Uploaded replay files
    /results            # Analysis results
  docker-compose.yml
  README.md
```

## API Endpoints

### Fastify API (Port 4000)

- `POST /api/analyze` - Upload replay file, returns job_id
- `GET /api/analyze/:id` - Get analysis status and results
- `GET /api/jobs` - List all jobs (admin/debugging)
- `GET /health` - Health check

### C# Parser Service (Port 5000)

- `POST /Parse/parse` - Parse replay file, returns ParsedReplay JSON
- `GET /health` - Health check

## Development

### Local Development (without Docker)

1. **Start dependencies:**

```bash
docker-compose up postgres redis
```

2. **Run services individually:**

```bash
# Terminal 1: Fastify API
cd packages/papi
npm install
npm run dev

# Terminal 2: Worker
cd packages/worker
npm install
npm run dev

# Terminal 3: Next.js
cd apps/web
npm install
npm run dev

# Terminal 4: C# Parser
cd services/parser-csharp
dotnet run

# Terminal 5: Cron Monitor
cd packages/cron-monitor
npm install
npm run dev
```

### Building Services

```bash
# Build Fastify API
cd packages/papi
npm run build

# Build Worker
cd packages/worker
npm run build

# Build Next.js
cd apps/web
npm run build

# Build C# Parser
cd services/parser-csharp
dotnet publish -c Release
```

## Testing

### Manual Testing

1. **Upload a replay:**

```bash
curl -X POST http://localhost:4000/api/analyze \
  -F "file=@path/to/replay.replay" \
  -F "playerId=test-player"
```

2. **Check job status:**

```bash
curl http://localhost:4000/api/analyze/{job_id}
```

3. **Check health:**

```bash
curl http://localhost:4000/health
curl http://localhost:5000/health
```

### Database Access

```bash
docker exec -it fortnite-api-stack-postgres-1 psql -U pathgen -d pathgen
```

### Redis Access

```bash
docker exec -it fortnite-api-stack-redis-1 redis-cli
redis-cli ping  # Should return PONG
```

## Environment Variables

See `.env.example` for all available environment variables.

Key variables:
- `DATABASE_URL` - Postgres connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret for JWT tokens
- `PARSER_URL` - C# parser service URL
- `DISCORD_CLIENT_ID` - Discord OAuth client ID
- `DISCORD_WEBHOOK_URL` - Discord webhook for alerts

## Production Deployment

### Recommendations

1. **Use managed services:**
   - AWS RDS / Azure Database for Postgres
   - AWS ElastiCache / Azure Cache for Redis
   - Object storage (S3/Azure Blob) for replays and results

2. **Kubernetes:**
   - Move to Kubernetes for autoscaling
   - Use Horizontal Pod Autoscaler on worker based on queue length
   - Implement proper resource limits

3. **Security:**
   - Secure endpoints with JWT
   - Rate-limit uploads
   - Scan uploads for malware
   - Use HTTPS/TLS everywhere

4. **Observability:**
   - Prometheus + Grafana for metrics
   - Sentry for error tracking
   - Structured logging (JSON)

5. **Retention:**
   - Auto-delete replays after 30-90 days (configurable via `CLEANUP_DAYS`)

## Monitoring

The cron-monitor service runs:
- Health checks every 5 minutes
- Cleanup of old files daily at 2 AM
- Cleanup of orphaned jobs every hour

Alerts are sent to Discord webhook if services are down.

## Troubleshooting

### Services won't start

1. Check Docker is running: `docker ps`
2. Check ports are available: `netstat -an | grep LISTEN`
3. Check logs: `docker-compose logs [service-name]`

### Worker not processing jobs

1. Check Redis connection: `docker exec redis redis-cli ping`
2. Check worker logs: `docker-compose logs worker`
3. Verify queue exists: `docker exec redis redis-cli KEYS "*bull*"`

### Database connection errors

1. Verify Postgres is running: `docker-compose ps postgres`
2. Check connection string in `.env`
3. Test connection: `docker exec postgres psql -U pathgen -d pathgen -c "SELECT 1"`

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request
