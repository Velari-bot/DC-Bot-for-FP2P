# Quick Environment Setup Guide

## Step 1: Get Discord Bot Token

You've created a Discord Application (Application ID: `1456801239194013819`), but you need to create the **Bot** and get the **Bot Token**.

### Get Bot Token:

1. In Discord Developer Portal, go to your application
2. Click **"Bot"** in the left sidebar (NOT OAuth2)
3. Click **"Add Bot"** (if you haven't created the bot yet)
4. Under **"Token"**, click **"Reset Token"** or **"Copy"**
5. **IMPORTANT**: Copy this token - it's your `DISCORD_BOT_TOKEN`

### Enable Required Intents:

While in the Bot section, scroll down to **"Privileged Gateway Intents"** and enable:
- ✅ **Server Members Intent** (REQUIRED for role management)
- ✅ **Message Content Intent** (optional, but recommended)

## Step 2: Get Discord Server (Guild) ID

1. Enable Developer Mode in Discord:
   - User Settings → Advanced → Enable Developer Mode
2. Right-click on your Discord server name
3. Click **"Copy Server ID"**
4. This is your `DISCORD_GUILD_ID`

## Step 3: Invite Bot to Server

1. In Discord Developer Portal, go to **OAuth2 → URL Generator**
2. Under **Scopes**, select:
   - ✅ `bot`
3. Under **Bot Permissions**, select:
   - ✅ **Manage Roles**
   - ✅ **View Channels**
   - ✅ **Send Messages** (optional)
   - ✅ **Read Message History** (optional)
4. Copy the generated URL at the bottom
5. Open the URL in your browser
6. Select your server and authorize

## Step 4: Get Podia API Token

1. Log into Podia
2. Go to **Settings → Integrations → API**
3. Generate a new API token
4. Copy the token - this is your `PODIA_API_TOKEN`

## Step 5: Update .env File

Edit `server/.env` file and fill in:

```env
DISCORD_BOT_TOKEN=paste_your_bot_token_here
DISCORD_GUILD_ID=paste_your_server_id_here
PODIA_API_TOKEN=paste_your_podia_token_here
```

**Note**: You can leave product IDs empty for now - you can add them later when testing.

## Step 6: Start Server

```bash
npm start
```

You should see:
```
✅ Discord bot logged in as YourBot#1234
✅ All services initialized successfully
🚀 Discord Integration Server running on port 3001
```

## Troubleshooting

### "Missing required environment variables"
- Make sure `.env` file exists in the `server/` directory
- Check that all three required variables are set (no empty values)

### "Invalid token" or "Unauthorized"
- Make sure you're using the **Bot Token** (from Bot section), NOT the Client Secret (from OAuth2)
- Bot token should start with something like `MTQ1Njgw...`

### "Missing Access" or permissions error
- Make sure bot is invited to the server
- Verify bot has "Manage Roles" permission
- Check bot's role is above the roles it needs to assign

## Quick Checklist

- [ ] Discord Application created
- [ ] Bot created (in Bot section)
- [ ] Bot token copied
- [ ] Server Members Intent enabled
- [ ] Bot invited to server with "Manage Roles" permission
- [ ] Server ID copied
- [ ] Podia API token obtained
- [ ] `.env` file created with all values
- [ ] Server starts without errors

