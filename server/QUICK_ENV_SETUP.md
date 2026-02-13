# Quick .env Setup

## The Problem
You're missing the `.env` file with required environment variables.

## Quick Fix

### Option 1: Create File Manually

1. In the `server/` directory, create a new file named `.env`
2. Copy and paste this content:

```env
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_GUILD_ID=your_server_id_here
PODIA_API_TOKEN=your_podia_token_here
PORT=3001
NODE_ENV=development
```

3. Replace the placeholder values with your actual tokens/IDs

### Option 2: Use PowerShell

Run this command in the `server/` directory:

```powershell
@"
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_GUILD_ID=your_server_id_here
PODIA_API_TOKEN=your_podia_token_here
PORT=3001
NODE_ENV=development
"@ | Out-File -FilePath .env -Encoding utf8
```

Then edit the `.env` file with your actual values.

## What You Need

### 1. Discord Bot Token
- Go to https://discord.com/developers/applications
- Click your app → **Bot** section (NOT OAuth2)
- Copy the **Token** (click Reset/Copy button)
- This is your `DISCORD_BOT_TOKEN`

### 2. Discord Server ID
- Enable Developer Mode in Discord (User Settings → Advanced)
- Right-click your server → Copy Server ID
- This is your `DISCORD_GUILD_ID`

### 3. Podia API Token
- Log into Podia → Settings → Integrations → API
- Copy your API token
- This is your `PODIA_API_TOKEN`

## After Creating .env

1. Edit `.env` and replace all `your_*_here` with actual values
2. Make sure bot is invited to your server
3. Run `npm start`

