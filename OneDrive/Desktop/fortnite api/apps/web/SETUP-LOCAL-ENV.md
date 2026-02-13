# 🔧 Setup Local Environment Variables

## The Problem

When running the dev server locally (`npm run dev`), you're getting:
```
🔐 Discord OAuth - Client Secret exists: false
❌ DISCORD_CLIENT_SECRET not set
```

This is because Vercel environment variables are only for production. For local development, you need a `.env.local` file.

## ✅ Solution: Add to `.env.local`

The `.env.local` file already exists in `apps/web/`. You need to add the Discord variables to it.

### Step 1: Open `.env.local`

Open the file: `apps/web/.env.local`

### Step 2: Add These Lines

Add these Discord OAuth variables:

```env
DISCORD_CLIENT_ID=1430744947732250726
DISCORD_CLIENT_SECRET=OjxmPipOHqCfVzZOIGqGVcHf3eUFXwWC
DISCORD_REDIRECT_URI=http://localhost:3000/setup.html
```

### Step 3: Save the File

Save `.env.local` and restart your dev server.

### Step 4: Restart Dev Server

Stop the current dev server (Ctrl+C) and restart:

```powershell
cd apps/web
npm run dev
```

## 📋 Complete `.env.local` Example

Your `.env.local` file should look something like this:

```env
# Discord OAuth Configuration
DISCORD_CLIENT_ID=1430744947732250726
DISCORD_CLIENT_SECRET=OjxmPipOHqCfVzZOIGqGVcHf3eUFXwWC
DISCORD_REDIRECT_URI=http://localhost:3000/setup.html

# Add other variables as needed
# NEXT_PUBLIC_API_URL=http://localhost:4000
# etc...
```

## ✅ After Adding

After adding the variables and restarting:

1. The dev server logs should show:
   - `🔐 Discord OAuth - Client Secret exists: true` ✅

2. Discord OAuth should work locally at:
   - `http://localhost:3000/login.html`

3. Make sure `http://localhost:3000/setup.html` is added to Discord redirects (for local dev testing)

## 🔒 Important Notes

- `.env.local` is in `.gitignore` - it won't be committed to Git ✅
- Never commit secrets to Git
- Production uses Vercel environment variables (already set)
- Local dev uses `.env.local` (needs to be added)

## 🐛 Troubleshooting

### Still not working after adding?

1. **Make sure file is saved** - Check that `.env.local` was saved
2. **Restart dev server** - Environment variables are loaded at startup
3. **Check file location** - Must be in `apps/web/.env.local` (not root)
4. **Check for typos** - Variable names are case-sensitive
5. **No spaces around `=`** - `KEY=value` not `KEY = value`

### Verify it's loading:

After restarting, check the dev server logs. You should see:
- `🔐 Discord OAuth - Client Secret exists: true`
- If it still says `false`, the file might not be in the right location

