# ⚡ Quick Fix for Local Dev Server

## The Error

```
🔐 Discord OAuth - Client Secret exists: false
❌ DISCORD_CLIENT_SECRET not set
```

## ✅ Quick Fix

### Option 1: Use the Script (Easiest)

```powershell
cd apps/web
.\add-local-env.ps1
```

This will automatically add the Discord variables to `.env.local`.

### Option 2: Manual Edit

1. Open: `apps/web/.env.local`
2. Add these lines at the end:

```env
# Discord OAuth Configuration
DISCORD_CLIENT_ID=1430744947732250726
DISCORD_CLIENT_SECRET=OjxmPipOHqCfVzZOIGqGVcHf3eUFXwWC
DISCORD_REDIRECT_URI=http://localhost:3000/setup.html
```

3. Save the file

### Step 3: Restart Dev Server

**IMPORTANT:** Environment variables are loaded when the server starts. You MUST restart!

1. Stop the current dev server: **Ctrl+C**
2. Start it again:

```powershell
npm run dev
```

## ✅ Verify It Works

After restarting, you should see in the logs:
- `🔐 Discord OAuth - Client Secret exists: true` ✅

And Discord OAuth should work at:
- `http://localhost:3000/login.html`

## 📝 Notes

- Production (Vercel) uses Vercel environment variables ✅ (already set)
- Local dev uses `.env.local` file (needs to be added)
- Don't forget to restart the server after adding variables!

