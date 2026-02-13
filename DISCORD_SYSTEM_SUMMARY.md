# Discord ↔ Website Masterclass Access System - Summary

## System Overview

This system automatically manages Discord role assignments and Friend Group access based on:
1. **Masterclass subscription level** (Beginner, Intermediate, Advanced)
2. **Power Ranking (PR)** - determines additional FG access tiers

## How It Works

### User Flow

1. User purchases a masterclass on Podia
2. User connects their Discord account to Podia profile
3. User joins the main Discord server
4. User verifies through Yunite (your existing verification system)
5. System automatically:
   - Detects active subscription from Podia
   - Assigns appropriate Discord role
   - Grants Friend Group access based on PR + masterclass level

### Automatic Processing

- **Webhooks**: Podia sends webhooks when subscriptions change
- **Cron Jobs**: System checks for expired subscriptions hourly
- **Real-time**: Access is granted/revoked immediately when subscriptions change

## File Structure

```
server/
├── index.js                  # Main server entry point
├── discord-bot.js            # Discord bot service (role management)
├── podia-service.js          # Podia API integration
├── models/
│   └── user.js              # User data model
├── routes/
│   └── discord-routes.js    # API endpoints and webhook handlers
├── package.json             # Dependencies
├── README.md                # Technical documentation
├── ENV_TEMPLATE.md          # Environment variables template
└── QUICK_START.md           # Quick setup guide
```

## Key Components

### 1. Discord Bot Service (`discord-bot.js`)
- Manages Discord bot connection
- Assigns/removes masterclass roles
- Calculates FG access based on PR + masterclass
- Handles role hierarchy

### 2. Podia Service (`podia-service.js`)
- Fetches subscription data from Podia API
- Gets Discord user IDs from Podia
- Handles webhook verification
- Maps product IDs to masterclass levels

### 3. User Model (`models/user.js`)
- Stores user associations (Podia ↔ Discord)
- Tracks subscription status
- Stores Power Ranking
- Currently in-memory (should use database in production)

### 4. API Routes (`routes/discord-routes.js`)
- Webhook endpoint for Podia events
- Manual sync endpoints
- User management endpoints
- Health check

## Friend Group Access Rules

### Advanced Masterclass
- **PR ≥ 10,000**: Advanced FG + Intermediate FG + Beginner FG
- **PR 1,000-9,999**: Intermediate FG + Beginner FG
- **PR < 1,000**: Beginner FG only

### Intermediate Masterclass
- **PR ≥ 1,000**: Intermediate FG + Beginner FG
- **PR < 1,000**: Beginner FG only

### Beginner Masterclass
- **Any PR**: Beginner FG only

## Discord Roles

- Beginner Masterclass: `1444829030263165109`
- Intermediate Masterclass: `1444829519964930088`
- Advanced Masterclass: `1444829551984378027`

## API Endpoints

### Webhooks
- `POST /api/discord/webhook/podia` - Receives Podia webhook events

### User Management
- `POST /api/discord/sync/user/:podiaUserId` - Manually sync user
- `POST /api/discord/user/:podiaUserId/pr` - Update power ranking
- `POST /api/discord/user/:podiaUserId/link-discord` - Link Discord account
- `GET /api/discord/user/:podiaUserId/status` - Get user status
- `POST /api/discord/revoke/:podiaUserId` - Revoke all access

### System
- `GET /health` - Health check
- `GET /api/discord/health` - Discord bot status

## Configuration Required

### Environment Variables
- `DISCORD_BOT_TOKEN` - Discord bot token
- `DISCORD_GUILD_ID` - Main Discord server ID
- `PODIA_API_TOKEN` - Podia API token
- `PODIA_WEBHOOK_SECRET` - Podia webhook secret
- Product IDs for each masterclass level

### Discord Setup
- Bot with "Manage Roles" permission
- Bot role above masterclass roles in hierarchy
- Roles created in Discord server

### Podia Setup
- API token generated
- Webhook configured
- Product IDs identified
- Discord integration configured (for storing Discord user IDs)

## Production Considerations

### ⚠️ Important Notes

1. **Database**: Current implementation uses in-memory storage. **Must** switch to real database (PostgreSQL/MongoDB) for production.

2. **Friend Group Servers**: The FG access logic is implemented but may need customization depending on:
   - Whether FG servers are separate Discord servers
   - How members are added to FG servers (OAuth2, invites, separate bots)
   - Current implementation has placeholders for FG server management

3. **Security**:
   - Add authentication to API endpoints
   - Use HTTPS in production
   - Validate all webhook signatures
   - Never expose tokens/secrets

4. **Error Handling**:
   - Add comprehensive logging
   - Set up error monitoring
   - Implement retry logic for API calls

5. **Scaling**:
   - Use process manager (PM2)
   - Set up reverse proxy (nginx)
   - Consider queue system for processing

## Testing

### Manual Testing
```bash
# Health check
curl http://localhost:3001/health

# Sync user
curl -X POST http://localhost:3001/api/discord/sync/user/YOUR_USER_ID

# Update PR
curl -X POST http://localhost:3001/api/discord/user/YOUR_USER_ID/pr \
  -H "Content-Type: application/json" \
  -d '{"powerRanking": 5000}'
```

### Webhook Testing
Use Podia's webhook test feature or a tool like ngrok to test webhooks locally.

## Next Steps

1. ✅ Set up environment variables
2. ✅ Configure Discord bot and roles
3. ✅ Set up Podia webhooks
4. ⚠️ Implement database (replace in-memory storage)
5. ⚠️ Implement FG server access (customize based on your setup)
6. ⚠️ Add authentication to API endpoints
7. ⚠️ Set up production deployment
8. ⚠️ Add monitoring and logging

## Support

- See `server/README.md` for technical documentation
- See `DISCORD_INTEGRATION_SETUP.md` for detailed setup guide
- See `server/QUICK_START.md` for quick reference

