# Create .env File - Step by Step

## Step 1: Create the File

In the `server/` directory, create a new file called `.env` (no extension, just `.env`)

## Step 2: Get Your Discord Bot Token

You've created a Discord Application, but you need to create the **Bot** and get its token:

1. Go to https://discord.com/developers/applications
2. Click on your application "Fortnite Path To Pro"
3. In the left sidebar, click **"Bot"** (NOT OAuth2)
4. If you see "Add Bot" button, click it
5. Under "Token", click **"Reset Token"** or **"Copy"**
6. **Copy this token** - this is your `DISCORD_BOT_TOKEN`

⚠️ **IMPORTANT**: This is different from the Client Secret in OAuth2. You need the Bot Token!

### Enable Intents:
While in the Bot section, scroll down to "Privileged Gateway Intents" and enable:
- ✅ **Server Members Intent** (REQUIRED)

## Step 3: Get Your Discord Server ID

1. In Discord, enable Developer Mode:
   - User Settings → Advanced → Developer Mode
2. Right-click on your Discord server name
3. Click "Copy Server ID"
4. This is your `DISCORD_GUILD_ID`

## Step 4: Get Podia API Token

1. Log into Podia
2. Go to Settings → Integrations → API
3. Generate/Copy your API token
4. This is your `PODIA_API_TOKEN`

## Step 5: Copy This Template

Copy the content below into your `.env` file and replace the placeholder values:

```env
# Discord Configuration
DISCORD_BOT_TOKEN=paste_your_bot_token_here
DISCORD_GUILD_ID=paste_your_server_id_here

# Podia Configuration (required to start, but can use placeholder for testing)
PODIA_API_TOKEN=paste_your_podia_token_here
PODIA_WEBHOOK_SECRET=

# Server Configuration
PORT=3001
NODE_ENV=development
```

## Step 6: Minimum to Start

For now, you only need these three to start the server:

```env
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_GUILD_ID=your_server_id_here
PODIA_API_TOKEN=your_podia_token_here
```

The product IDs and other settings can be added later.

## Step 7: Invite Bot to Server

Before starting, make sure the bot is invited to your server:

1. In Discord Developer Portal, go to **OAuth2 → URL Generator**
2. Select scopes: `bot`
3. Select permissions: **Manage Roles**, **View Channels**
4. Copy the URL and open it in browser
5. Select your server and authorize

## Step 8: Start Server

```bash
npm start
```

## Quick Command to Create File (Windows PowerShell)

```powershell
cd server
@"
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_GUILD_ID=your_server_id_here
PODIA_API_TOKEN=your_podia_token_here
PORT=3001
NODE_ENV=development
"@ | Out-File -FilePath .env -Encoding utf8
```

Then edit `.env` with your actual values.

