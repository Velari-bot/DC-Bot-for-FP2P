# 🚀 PathGen v2 - Complete Setup Guide

## 📋 Prerequisites

- Node.js 18+ installed
- npm or yarn
- Git

## 🏗️ Project Structure

```
fortnite-api/
├── apps/
│   └── web/              # Next.js frontend (port 3000)
├── packages/
│   └── papi/             # Fastify API backend (port 4000)
└── package.json          # Root package.json
```

## 🔧 Initial Setup

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all subproject dependencies
npm run install:all
```

Or manually:
```bash
npm install
cd apps/web && npm install && cd ../..
cd packages/papi && npm install && cd ../..
```

## 🏃 Running Locally

### Option 1: Run Both Services (Recommended)

**Terminal 1 - API Server:**
```bash
cd packages/papi
$env:PORT='4000'; npm run dev
```

**Terminal 2 - Web Server:**
```bash
cd apps/web
$env:NEXT_PUBLIC_API_URL='http://localhost:4000'; npx next dev -p 3000
```

### Option 2: Use Root Scripts

**Terminal 1 - API:**
```bash
npm run dev:api
```

**Terminal 2 - Web:**
```bash
npm run dev:web
```

### Option 3: PowerShell Scripts (Windows)

Create `start-dev.ps1` in the root:
```powershell
# Start API
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd packages/papi; `$env:PORT='4000'; npm run dev"

# Start Web
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd apps/web; `$env:NEXT_PUBLIC_API_URL='http://localhost:4000'; npx next dev -p 3000"
```

## 🌐 Environment Variables

### API Server (`packages/papi`)

Create `packages/papi/.env`:
```env
PORT=4000
NODE_ENV=development

# Optional: Redis (for queue features)
REDIS_URL=redis://localhost:6379
REDIS_ENABLED=true

# Optional: PostgreSQL (for database features)
DATABASE_URL=postgresql://user:password@localhost:5432/fortnite_api
DATABASE_ENABLED=true

# Discord OAuth (required for Discord login)
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret

# Osirion API (for replay analysis)
OSIRION_API_KEY=your_osirion_key
```

### Web App (`apps/web`)

Create `apps/web/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

For production, set in Vercel:
- `NEXT_PUBLIC_API_URL` = Your API server URL (e.g., `https://api.yourdomain.com`)

## 🚢 Production Deployment

### Frontend (Vercel)

1. **Connect Repository** to Vercel
2. **Project Settings:**
   - Root Directory: `apps/web`
   - Framework Preset: Next.js
   - Build Command: `npm install --include=dev && npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install --include=dev`
3. **Environment Variables:**
   - `NEXT_PUBLIC_API_URL` = Your production API URL

### Backend API

Deploy to your preferred hosting:
- **Railway**
- **Render**
- **Fly.io**
- **DigitalOcean App Platform**
- **AWS/GCP/Azure**

**Environment Variables to Set:**
- `PORT` (usually auto-set by platform)
- `NODE_ENV=production`
- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `OSIRION_API_KEY`
- `REDIS_URL` (if using Redis)
- `DATABASE_URL` (if using PostgreSQL)

## 📝 Available Scripts

### Root Level

```bash
npm run dev          # Start web dev server
npm run dev:web      # Start web dev server
npm run dev:api      # Start API dev server
npm run dev:worker   # Start worker (if exists)
npm run dev:monitor  # Start monitor (if exists)
npm run build        # Build web app
npm run build:web    # Build web app
npm run build:api    # Build API
npm run install:all  # Install all dependencies
```

### Web App (`apps/web`)

```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### API (`packages/papi`)

```bash
npm run dev          # Start dev server with watch (port 4000)
npm run build        # Build TypeScript
npm run start        # Start production server
```

## 🔍 Troubleshooting

### Port Already in Use

**API (4000):**
```bash
# Find and kill process
netstat -ano | findstr :4000
taskkill /PID <PID> /F
```

**Web (3000):**
```bash
# Find and kill process
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### API Not Connecting

1. Check API is running on port 4000
2. Verify `NEXT_PUBLIC_API_URL` is set correctly
3. Check CORS settings in API
4. Verify API health: `http://localhost:4000/health`

### Build Errors

1. **TypeScript errors:** Ensure devDependencies are installed
   ```bash
   cd apps/web && npm install --include=dev
   ```

2. **Missing dependencies:** Run `npm run install:all`

3. **Vercel build fails:** Check Root Directory is set to `apps/web`

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Fastify Documentation](https://www.fastify.io/)
- [Vercel Deployment Guide](https://vercel.com/docs)

## 🆘 Need Help?

Check the logs:
- API: Check terminal running `npm run dev:api`
- Web: Check terminal running `npm run dev:web`
- Vercel: Check deployment logs in Vercel dashboard

