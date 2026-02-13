# Discord ↔ Website Masterclass Access System - Setup Guide

This guide will help you set up the complete Discord integration system for managing masterclass subscriptions and Friend Group access.

## Quick Start

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   - Copy the template from `server/ENV_TEMPLATE.md`
   - Create a `.env` file in the `server/` directory
   - Fill in all required values

4. **Start the server:**
   ```bash
   npm start
   ```

## Detailed Setup

### Step 1: Discord Bot Setup

1. **Create Discord Application:**
   - Go to https://discord.com/developers/applications
   - Click "New Application"
   - Give it a name (e.g., "Masterclass Access Bot")
   - Note the Application ID

2. **Create Bot:**
   - Go to "Bot" section in left sidebar
   - Click "Add Bot"
   - Copy the bot token (you'll need this for `DISCORD_BOT_TOKEN`)
   - Enable "Server Members Intent" (required for member management)
   - Optionally enable "Message Content Intent" if needed

3. **Get Server ID:**
   - Enable Developer Mode in Discord (User Settings → Advanced → Developer Mode)
   - Right-click your Discord server → Copy Server ID
   - Use this for `DISCORD_GUILD_ID`

4. **Get Role IDs:**
   - Right-click each role → Copy Role ID
   - Beginner Masterclass: `1444829030263165109`
   - Intermediate Masterclass: `1444829519964930088`
   - Advanced Masterclass: `1444829551984378027`

5. **Invite Bot to Server:**
   - Go to OAuth2 → URL Generator
   - Select scopes: `bot`
   - Select permissions:
     - Manage Roles
     - View Channels
     - Send Messages (optional)
     - Read Message History (optional)
   - Copy the generated URL and open in browser
   - Select your server and authorize

6. **Set Up Role Hierarchy:**
   - Ensure bot's role is placed ABOVE the masterclass roles in server settings
   - Bot cannot assign roles that are above its own role

### Step 2: Podia API Setup

1. **Get API Token:**
   - Log into Podia
   - Go to Settings → Integrations → API
   - Generate a new API token
   - Copy token (for `PODIA_API_TOKEN`)

2. **Get Product IDs:**
   - Go to Products in Podia dashboard
   - Click on each masterclass product
   - Check the URL or product details for the Product ID
   - Add to `.env`:
     - `PODIA_BEGINNER_PRODUCT_ID`
     - `PODIA_INTERMEDIATE_PRODUCT_ID`
     - `PODIA_ADVANCED_PRODUCT_ID`

3. **Set Up Webhook:**
   - Go to Settings → Integrations → Webhooks
   - Click "Add Webhook"
   - Set URL: `https://your-domain.com/api/discord/webhook/podia`
   - Select events:
     - `subscription.created`
     - `subscription.updated`
     - `subscription.canceled`
     - `subscription.expired`
     - `user.updated`
   - Copy the webhook secret (for `PODIA_WEBHOOK_SECRET`)

4. **Configure Discord Integration in Podia:**
   - Podia may have a Discord integration that stores Discord user IDs
   - If available, connect Discord accounts through Podia's interface
   - The system will read Discord IDs from Podia's user data

### Step 3: Friend Group Servers (Optional)

If you have separate Discord servers for Friend Groups:

1. Create/identify your FG servers
2. Get their Server IDs
3. Add to `.env`:
   - `DISCORD_FG_BEGINNER_SERVER_ID`
   - `DISCORD_FG_INTERMEDIATE_SERVER_ID`
   - `DISCORD_FG_ADVANCED_SERVER_ID`

**Note:** Adding members to separate servers requires either:
- OAuth2 flow with `guilds.join` scope
- Separate bot instances in each FG server
- Manual invite links

The current implementation includes placeholders - you'll need to implement the actual FG server access logic based on your setup.

### Step 4: Environment Configuration

Create `server/.env` file with all values from `ENV_TEMPLATE.md`:

```env
DISCORD_BOT_TOKEN=your_token_here
DISCORD_GUILD_ID=your_server_id_here
PODIA_API_TOKEN=your_token_here
# ... etc
```

### Step 5: Database Setup (Optional)

The default implementation uses in-memory storage. For production:

**Option A: MongoDB**
```bash
npm install mongodb
```
Update `server/models/user.js` to use MongoDB connection.

**Option B: PostgreSQL**
```bash
npm install pg
```
Update `server/models/user.js` to use PostgreSQL connection.

### Step 6: Start the Server

```bash
cd server
npm install
npm start
```

You should see:
```
✅ Discord bot logged in as YourBot#1234
✅ All services initialized successfully
🚀 Discord Integration Server running on port 3001
```

## Testing

### Test Health Check
```bash
curl http://localhost:3001/health
```

### Test User Sync
```bash
curl -X POST http://localhost:3001/api/discord/sync/user/YOUR_PODIA_USER_ID
```

### Test Power Ranking Update
```bash
curl -X POST http://localhost:3001/api/discord/user/YOUR_PODIA_USER_ID/pr \
  -H "Content-Type: application/json" \
  -d '{"powerRanking": 5000}'
```

## Deployment

### Production Deployment

1. **Use Process Manager (PM2):**
   ```bash
   npm install -g pm2
   cd server
   pm2 start index.js --name discord-integration
   pm2 save
   pm2 startup
   ```

2. **Set Up Reverse Proxy (nginx):**
   ```nginx
   location /api/discord {
       proxy_pass http://localhost:3001;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
   }
   ```

3. **Environment Variables:**
   - Use your hosting platform's environment variable system
   - Never commit `.env` file to version control

4. **Monitoring:**
   - Set up logging (Winston, Pino, etc.)
   - Monitor server health
   - Set up alerts for errors

## Troubleshooting

### Bot doesn't assign roles
- ✅ Check bot has "Manage Roles" permission
- ✅ Verify bot's role is above masterclass roles in hierarchy
- ✅ Confirm role IDs match your server

### Webhooks not working
- ✅ Verify webhook URL is publicly accessible
- ✅ Check webhook secret matches
- ✅ Review server logs for errors
- ✅ Test webhook endpoint manually

### Users not getting access
- ✅ Check user has active subscription in Podia
- ✅ Verify Discord account is linked in Podia
- ✅ Check user is in the Discord server
- ✅ Review server logs for errors

### Friend Group access not working
- ✅ Verify FG server IDs are configured
- ✅ Check if FG servers require separate setup
- ✅ Review FG access logic implementation

## Support

For issues or questions:
1. Check server logs for errors
2. Review API endpoint responses
3. Test webhook endpoints manually
4. Verify all environment variables are set correctly

## Next Steps

1. Set up proper database (MongoDB/PostgreSQL)
2. Add authentication to API endpoints
3. Implement FG server access logic
4. Set up monitoring and alerts
5. Add logging system
6. Create admin dashboard (optional)

