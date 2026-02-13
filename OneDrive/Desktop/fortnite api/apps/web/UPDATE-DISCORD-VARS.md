# Update Discord OAuth Variables in Vercel

The variables already exist, so we need to **remove** them first, then **add** them again with the correct values.

## Quick Method: Use the Script

```powershell
cd apps/web
.\update-discord-vars.ps1
```

## Manual Method: Step-by-Step

### Step 1: Remove Existing Variables

Run these commands to remove the old variables:

```powershell
vercel env rm DISCORD_CLIENT_ID production --yes
vercel env rm DISCORD_CLIENT_SECRET production --yes
vercel env rm DISCORD_REDIRECT_URI production --yes
```

### Step 2: Add Variables with Correct Values

Now add them back with the correct values:

```powershell
# 1. DISCORD_CLIENT_ID (Not sensitive)
echo "1430744947732250726" | vercel env add DISCORD_CLIENT_ID production
# When prompted "Mark as sensitive?", type: n

# 2. DISCORD_CLIENT_SECRET (Sensitive - YES!)
echo "OjxmPipOHqCfVzZOIGqGVcHf3eUFXwWC" | vercel env add DISCORD_CLIENT_SECRET production
# When prompted "Mark as sensitive?", type: y

# 3. DISCORD_REDIRECT_URI (Not sensitive)
echo "https://pathgen.dev/setup.html" | vercel env add DISCORD_REDIRECT_URI production
# When prompted "Mark as sensitive?", type: n
```

### Step 3: Verify

```powershell
vercel env ls
```

You should see all three variables listed.

### Step 4: Redeploy

```powershell
vercel --prod
```

## Alternative: Update via Vercel Dashboard

If the CLI method doesn't work, you can update them in the Vercel Dashboard:

1. Go to: https://vercel.com/dashboard
2. Click your project
3. Go to **Settings** → **Environment Variables**
4. Find each `DISCORD_*` variable
5. Click the **...** menu → **Remove**
6. Then click **Add New** and add them again with the correct values:
   - `DISCORD_CLIENT_ID` = `1430744947732250726` (Not sensitive)
   - `DISCORD_CLIENT_SECRET` = `OjxmPipOHqCfVzZOIGqGVcHf3eUFXwWC` (Sensitive - YES!)
   - `DISCORD_REDIRECT_URI` = `https://pathgen.dev/setup.html` (Not sensitive)
7. Make sure to select **Production** environment
8. Redeploy your project

