# Quick Start Guide

Get the Fortnite API Stack running in 5 minutes.

## Prerequisites

- Docker Desktop installed and running
- Git (to clone the repository)
- 4GB+ RAM available for Docker

## Step 1: Setup

```bash
# Clone or navigate to the project directory
cd fortnite-api-stack

# Copy environment template
cp .env.example .env

# Edit .env (optional - defaults work for local development)
# At minimum, you may want to set:
# - DISCORD_CLIENT_ID (if using Discord OAuth)
# - DISCORD_WEBHOOK_URL (if using alerts)
# - JWT_SECRET (for production)
```

## Step 2: Start Services

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

This will start:
- ✅ Postgres (port 5432)
- ✅ Redis (port 6379)
- ✅ Fastify API (port 4000)
- ✅ Next.js Frontend (port 3000)
- ✅ C# Parser Service (port 5000)
- ✅ BullMQ Worker
- ✅ Cron Monitor

## Step 3: Verify

Open your browser:

- **Frontend**: http://localhost:3000
- **API Health**: http://localhost:4000/health
- **Parser Health**: http://localhost:5000/health

You should see:
- Frontend: Upload page with file input
- API Health: `{"status":"ok","timestamp":"..."}`
- Parser Health: `{"status":"ok","timestamp":"..."}`

## Step 4: Test Upload

### Via Browser

1. Go to http://localhost:3000
2. Click "Select Replay File"
3. Choose a `.replay` file
4. Click "Analyze Replay"
5. Wait for job to complete
6. View results

### Via curl

```bash
# Upload a replay file
curl -X POST http://localhost:4000/api/analyze \
  -F "file=@path/to/your/replay.replay" \
  -F "playerId=test-player"

# Response: {"job_id":"123","status":"pending","message":"..."}

# Check status (replace 123 with your job_id)
curl http://localhost:4000/api/analyze/123

# Response: {"job_id":"123","status":"completed","result":{...}}
```

## Step 5: Monitor

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f worker
docker-compose logs -f fastify-api
docker-compose logs -f parser
```

### Check Queue

```bash
# Access Redis CLI
docker exec -it fortnite-api-stack-redis-1 redis-cli

# Check queue length
KEYS *bull*
LLEN bull:analysis:wait
```

### Check Database

```bash
# Access Postgres
docker exec -it fortnite-api-stack-postgres-1 psql -U pathgen -d pathgen

# List jobs
SELECT job_id, status, created_at FROM analysis_jobs ORDER BY created_at DESC LIMIT 10;

# Exit
\q
```

## Troubleshooting

### Services won't start

```bash
# Check Docker is running
docker ps

# Check ports are free
# Windows PowerShell:
netstat -an | findstr "3000 4000 5000 5432 6379"

# Linux/Mac:
lsof -i :3000 -i :4000 -i :5000 -i :5432 -i :6379
```

### Port already in use

Edit `docker-compose.yml` and change port mappings:

```yaml
ports:
  - "3001:3000"  # Change 3000 to 3001
```

### Worker not processing jobs

1. Check worker logs: `docker-compose logs worker`
2. Check Redis: `docker exec redis redis-cli ping`
3. Check parser: `curl http://localhost:5000/health`

### Database connection errors

1. Wait for Postgres to be healthy: `docker-compose ps postgres`
2. Check connection string in `.env`
3. Check database exists: `docker exec postgres psql -U pathgen -l`

## Next Steps

1. **Implement actual parser**: Replace placeholder in `services/parser-csharp/ReplayParser.cs` with real Fortnite replay parsing library
2. **Implement heuristics**: Add real logic in `packages/worker/src/index.ts` for fight detection, no-heal, storm damage
3. **Add authentication**: Configure BetterAuth with Discord OAuth (see README.md)
4. **Configure alerts**: Set `DISCORD_WEBHOOK_URL` in `.env` for health check alerts
5. **Production setup**: See README.md for production deployment recommendations

## Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (deletes all data)
docker-compose down -v
```

## Common Commands

```bash
# Restart specific service
docker-compose restart worker

# Rebuild specific service
docker-compose up --build worker

# View service status
docker-compose ps

# View resource usage
docker stats

# Clean up
docker-compose down
docker system prune -a
```

## Development Mode

For local development without Docker:

1. Start only dependencies: `docker-compose up postgres redis`
2. Run services individually (see README.md for details)
3. Make code changes and see them reflected immediately

## Need Help?

- Check logs: `docker-compose logs [service-name]`
- Check health: `curl http://localhost:4000/health`
- Check architecture: See `ARCHITECTURE.md`
- Check full documentation: See `README.md`
