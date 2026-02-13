# How to Start the API

## Quick Start Guide

### Option 1: Using Docker (Recommended)

#### Prerequisites
1. **Docker Desktop must be running**
   - Open Docker Desktop application
   - Wait for it to fully start (whale icon in system tray)

#### Steps
1. Open PowerShell in the project root directory
2. Run one of these commands:

```powershell
# Start just the API services (Postgres, Redis, API)
docker-compose up postgres redis fastify-api

# OR start ALL services (includes frontend, parser, worker, etc.)
docker-compose up --build
```

3. Wait for services to start (look for "listening on port 4000")
4. Test the API:
   - Open browser: http://localhost:4000/health
   - Should see: `{"status":"ok","timestamp":"..."}`

#### Troubleshooting Docker
- **Error: "cannot find the file specified"** → Docker Desktop is not running
  - Solution: Start Docker Desktop application
- **Error: "port already in use"** → Another service is using port 4000
  - Solution: Change PORT in .env or stop the other service

---

### Option 2: Start API Directly (Local Development)

#### Prerequisites
1. **PostgreSQL installed locally**
   - Download: https://www.postgresql.org/download/
   - Default: runs on `localhost:5432`

2. **Redis installed locally**
   - Download: https://redis.io/download
   - Or use Windows version: https://github.com/microsoftarchive/redis/releases
   - Default: runs on `localhost:6379`

#### Steps
1. **Update `.env` for local connections:**
   ```
   DATABASE_URL=postgres://pathgen:pathgenpass@localhost:5432/pathgen
   REDIS_URL=redis://localhost:6379
   ```

2. **Create the database:**
   ```powershell
   # Connect to PostgreSQL
   psql -U postgres

   # Create database and user
   CREATE DATABASE pathgen;
   CREATE USER pathgen WITH PASSWORD 'pathgenpass';
   GRANT ALL PRIVILEGES ON DATABASE pathgen TO pathgen;
   \q
   ```

3. **Install dependencies:**
   ```powershell
   cd packages/papi
   npm install
   ```

4. **Start the API:**
   ```powershell
   # From project root
   npm run dev:api

   # OR from packages/papi directory
   cd packages/papi
   npm run dev
   ```

5. **Verify it's running:**
   - Open: http://localhost:4000/health
   - Should see: `{"status":"ok"}`

---

## Environment Variables

Your `.env` file should contain:
```env
DISCORD_CLIENT_ID=1430744947732250726
DISCORD_CLIENT_SECRET=your_actual_secret_here
DATABASE_URL=postgres://pathgen:pathgenpass@postgres:5432/pathgen
REDIS_URL=redis://redis:6379
PORT=4000
```

**Note:** For Docker, use service names (`postgres`, `redis`). For local, use `localhost`.

---

## Common Issues

### Issue: "tsx is not recognized"
**Solution:**
```powershell
cd packages/papi
npm install
```

### Issue: "Connection refused" or "ECONNREFUSED"
**Causes:**
- Database/Redis not running
- Wrong connection URL in .env
- Services not started

**Solutions:**
- Check if Postgres is running: `psql -U postgres -c "SELECT 1;"`
- Check if Redis is running: `redis-cli ping` (should return PONG)
- Verify `.env` has correct connection strings

### Issue: Port 4000 already in use
**Solution:**
```powershell
# Find what's using port 4000
netstat -ano | findstr :4000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# OR change PORT in .env to another port (e.g., 4001)
```

---

## Testing the API

Once running, test these endpoints:

1. **Health Check:**
   ```powershell
   curl http://localhost:4000/health
   ```

2. **Upload Replay:**
   ```powershell
   curl -X POST http://localhost:4000/api/analyze -F "file=@path/to/replay.replay"
   ```

3. **Check Job Status:**
   ```powershell
   curl http://localhost:4000/api/analyze/{job_id}
   ```

---

## Next Steps

After API is running:
1. Start the Next.js frontend: `npm run dev` (from root)
2. Visit: http://localhost:3000
3. Try uploading a replay file
4. Check the tweets page: http://localhost:3000/tweets
