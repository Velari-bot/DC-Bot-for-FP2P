# Add Discord OAuth Variables to Vercel via CLI

## Quick Method: Run the Script

```powershell
cd apps/web
.\add-discord-vars.ps1
```

## Manual Method: Step-by-Step Commands

Run these commands one at a time from the `apps/web` directory:

### 1. Add DISCORD_CLIENT_ID

```powershell
echo "1430744947732250726" | vercel env add DISCORD_CLIENT_ID production
```

**When prompted:**
- "Mark as sensitive?" → Type: `n` (or just press Enter for No)
- Select environment: Already set to `production`

### 2. Add DISCORD_CLIENT_SECRET

```powershell
echo "OjxmPipOHqCfVzZOIGqGVcHf3eUFXwWC" | vercel env add DISCORD_CLIENT_SECRET production
```

**When prompted:**
- "Mark as sensitive?" → Type: `y` (Yes - this is important!)
- Select environment: Already set to `production`

### 3. Add DISCORD_REDIRECT_URI

```powershell
echo "https://pathgen.dev/setup.html" | vercel env add DISCORD_REDIRECT_URI production
```

**When prompted:**
- "Mark as sensitive?" → Type: `n` (or just press Enter for No)
- Select environment: Already set to `production`

## Alternative: One-Line Commands (If Piping Doesn't Work)

If the echo commands don't work, use these interactive commands:

```powershell
# 1. DISCORD_CLIENT_ID
vercel env add DISCORD_CLIENT_ID production
# When prompted for value, paste: 1430744947732250726
# When prompted "Mark as sensitive?", type: n

# 2. DISCORD_CLIENT_SECRET  
vercel env add DISCORD_CLIENT_SECRET production
# When prompted for value, paste: OjxmPipOHqCfVzZOIGqGVcHf3eUFXwWC
# When prompted "Mark as sensitive?", type: y (YES!)

# 3. DISCORD_REDIRECT_URI
vercel env add DISCORD_REDIRECT_URI production
# When prompted for value, paste: https://pathgen.dev/setup.html
# When prompted "Mark as sensitive?", type: n
```

## Verify Variables Were Added

```powershell
vercel env ls
```

You should see all three `DISCORD_*` variables listed.

## Redeploy After Adding Variables

```powershell
vercel --prod
```

Or redeploy from Vercel dashboard.

## Troubleshooting

### "Command not found: vercel"
Install Vercel CLI first:
```powershell
npm install -g vercel
```

### "Project not linked"
Link your project first:
```powershell
vercel link
```

Follow the prompts to link to your existing Vercel project.

### Piping doesn't work
Use the interactive method instead - just run `vercel env add VARIABLE_NAME production` and paste the value when prompted.

