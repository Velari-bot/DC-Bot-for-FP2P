# Discord ↔ Website Masterclass Access System

Automated system that connects Discord accounts to Podia subscriptions and manages role assignments and Friend Group access based on masterclass purchases and Power Ranking (PR).

## Overview

This system automatically:
- Assigns Discord roles based on active masterclass subscriptions
- Grants access to Friend Group Discord servers based on subscription level and PR
- Removes roles and revokes access when subscriptions expire or are canceled

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Podia     │────────▶│  Integration │────────▶│   Discord   │
│  (Webhooks) │         │    Server    │         │    Bot      │
└─────────────┘         └──────────────┘         └─────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │   Database   │
                        │ (User Data)  │
                        └──────────────┘
```

## Features

- ✅ Automatic role assignment based on masterclass subscription
- ✅ Friend Group access based on subscription level + Power Ranking
- ✅ Webhook support for real-time subscription updates
- ✅ Automatic cleanup of expired subscriptions
- ✅ Manual sync endpoints for troubleshooting
- ✅ Health check endpoints

## Installation

### 1. Prerequisites

- Node.js v18+ 
- npm or yarn
- Discord Bot Token
- Podia API Token
- Discord Server with configured roles

### 2. Install Dependencies

```bash
cd server
npm install
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `DISCORD_BOT_TOKEN` - Your Discord bot token
- `DISCORD_GUILD_ID` - Your main Discord server ID
- `PODIA_API_TOKEN` - Your Podia API token
- Product IDs for each masterclass level

### 4. Discord Bot Setup

1. Create a Discord Application at https://discord.com/developers/applications
2. Create a bot and copy the token
3. Enable these intents in the Bot settings:
   - Server Members Intent
   - Message Content Intent (if needed)
4. Invite bot to your server with these permissions:
   - Manage Roles
   - View Channels
   - Manage Channels (if needed for FG servers)

### 5. Discord Roles Setup

Ensure these roles exist in your Discord server:
- Beginner Masterclass Role ID: `1444829030263165109`
- Intermediate Masterclass Role ID: `1444829519964930088`
- Advanced Masterclass Role ID: `1444829551984378027`

### 6. Podia Webhook Setup

1. Go to Podia Settings → Integrations → Webhooks
2. Add webhook endpoint: `https://your-domain.com/api/discord/webhook/podia`
3. Select events to subscribe to:
   - `subscription.created`
   - `subscription.updated`
   - `subscription.canceled`
   - `subscription.expired`
   - `user.updated`
4. Copy the webhook secret to `.env`

## Usage

### Start the Server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

### API Endpoints

#### Health Check
```
GET /health
```

#### Sync User Manually
```
POST /api/discord/sync/user/:podiaUserId
```

#### Update Power Ranking
```
POST /api/discord/user/:podiaUserId/pr
Body: { "powerRanking": 5000 }
```

#### Link Discord Account
```
POST /api/discord/user/:podiaUserId/link-discord
Body: { "discordUserId": "123456789" }
```

#### Get User Status
```
GET /api/discord/user/:podiaUserId/status
```

#### Revoke Access
```
POST /api/discord/revoke/:podiaUserId
```

### Webhook Endpoint

Podia webhooks are automatically received at:
```
POST /api/discord/webhook/podia
```

## Friend Group Access Logic

### Advanced Masterclass
- **10,000+ PR**: Advanced FG + Intermediate FG + Beginner FG
- **1,000 - 9,999 PR**: Intermediate FG + Beginner FG
- **< 1,000 PR**: Beginner FG only

### Intermediate Masterclass
- **1,000+ PR**: Intermediate FG + Beginner FG
- **< 1,000 PR**: Beginner FG only

### Beginner Masterclass
- **Any PR**: Beginner FG only

## Database

The current implementation uses an in-memory store for development. For production, you should:

1. Choose a database (PostgreSQL, MongoDB, etc.)
2. Update `server/models/user.js` to use your database
3. Add database connection configuration

Example MongoDB integration:
```javascript
const { MongoClient } = require('mongodb');
const client = new MongoClient(process.env.DATABASE_URL);
await client.connect();
const db = client.db('discord-integration');
const userModel = new UserModel(db);
```

## Deployment

### Production Considerations

1. **Use a proper database** instead of in-memory storage
2. **Set up process manager** (PM2, systemd, etc.)
3. **Configure reverse proxy** (nginx) for webhook endpoints
4. **Set up monitoring** and logging
5. **Use environment-specific configs**

### PM2 Example

```bash
pm2 start server/index.js --name discord-integration
pm2 save
pm2 startup
```

## Troubleshooting

### Bot not assigning roles
- Check bot has "Manage Roles" permission
- Verify role hierarchy (bot's role must be above roles it assigns)
- Check role IDs in `.env` match your server

### Webhooks not received
- Verify webhook URL is publicly accessible
- Check webhook secret matches
- Review server logs for errors

### Users not getting FG access
- Verify FG server IDs are configured
- Check if FG servers require separate bot instances
- Review FG access logic in `discord-bot.js`

## Security Notes

- Never commit `.env` file
- Use strong webhook secrets
- Validate webhook signatures
- Restrict API endpoints (add authentication if needed)
- Use HTTPS in production

## License

ISC

