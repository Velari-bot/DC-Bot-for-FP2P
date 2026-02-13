# Quick Start Guide

## Installation

```bash
cd server
npm install
```

## Configuration

1. Create `.env` file in `server/` directory
2. Copy configuration from `ENV_TEMPLATE.md`
3. Fill in your values:
   - Discord Bot Token
   - Discord Server ID
   - Podia API Token
   - Product IDs

## Start Server

```bash
npm start
```

## Test

```bash
# Health check
curl http://localhost:3001/health

# Sync a user (replace USER_ID with actual Podia user ID)
curl -X POST http://localhost:3001/api/discord/sync/user/USER_ID
```

## Key Files

- `index.js` - Main server file
- `discord-bot.js` - Discord bot service
- `podia-service.js` - Podia API integration
- `models/user.js` - User data model
- `routes/discord-routes.js` - API routes

## Next Steps

See `DISCORD_INTEGRATION_SETUP.md` for complete setup instructions.

