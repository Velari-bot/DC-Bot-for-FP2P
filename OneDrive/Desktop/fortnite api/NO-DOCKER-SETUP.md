# Running Without Docker

## Why Docker Doesn't Work

Docker Desktop requires **virtualization support** to be enabled. If you see "Virtualization support not detected", it means:

1. **Virtualization might be disabled in BIOS** - You'd need to restart and enable it in BIOS settings
2. **You might be in a VM or restricted environment** - Some corporate/school environments disable virtualization
3. **WSL2 might not be properly configured** - Docker Desktop on Windows requires WSL2

## Solution: Run API Directly (No Docker Needed!)

I've updated the API to **work without Docker** - it will run even if Postgres and Redis aren't available.

### ✅ What Works Without Docker:
- ✅ API server starts and runs
- ✅ Health check endpoint works
- ✅ File uploads work
- ✅ Basic API functionality

### ⚠️ What's Limited Without Postgres/Redis:
- ❌ Job queue for background processing (BullMQ)
- ❌ Persistent job tracking in database
- ❌ Tweets API (requires backend services)

But the **core API will still run** and respond to requests!

## Quick Start (No Docker)

### 1. Start the API
```powershell
# From project root
npm run dev:api
```

The API will:
- ✅ Start on http://localhost:4000
- ✅ Show warnings if Postgres/Redis aren't available
- ✅ Still accept file uploads and basic requests
- ✅ Return health status with service info

### 2. Test the API
```powershell
# Check health
curl http://localhost:4000/health

# Or open in browser:
# http://localhost:4000/health
```

You should see:
```json
{
  "status": "ok",
  "timestamp": "2025-11-15T...",
  "services": {
    "redis": "disconnected",
    "postgres": "disconnected"
  }
}
```

### 3. Start the Frontend
```powershell
# In a new terminal
npm run dev
```

Visit: http://localhost:3000

## Adding Postgres/Redis Later (Optional)

If you want full functionality later, you can:

### Option A: Enable Virtualization (for Docker)
1. Restart computer
2. Enter BIOS settings (usually F2, F12, or Del during boot)
3. Enable "Virtualization" or "VT-x" or "AMD-V"
4. Save and exit
5. Start Docker Desktop

### Option B: Install Locally (No Docker)
1. **Install PostgreSQL:**
   - Download: https://www.postgresql.org/download/windows/
   - Install and create database `pathgen`
   - Update `.env`: `DATABASE_URL=postgres://user:pass@localhost:5432/pathgen`

2. **Install Redis:**
   - Download: https://github.com/microsoftarchive/redis/releases
   - Or use: https://github.com/tporadowski/redis/releases
   - Update `.env`: `REDIS_URL=redis://localhost:6379`

Then restart the API - it will automatically connect!

## Current Status

✅ **API can run without Docker**  
✅ **Frontend can run**  
⚠️ **Tweets page will show connection errors (expected)**  
⚠️ **Job queue disabled (but file uploads still work)**

The API will warn you about missing services but continue running. Perfect for development!
