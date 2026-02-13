# Environment Variables Template

Copy these to your `.env` file in the `server/` directory:

```env
# Discord Configuration
DISCORD_BOT_TOKEN=your_discord_bot_token_here
DISCORD_GUILD_ID=your_main_discord_server_id_here

# Discord Role IDs (Masterclasses)
DISCORD_ROLE_BEGINNER=1444829030263165109
DISCORD_ROLE_INTERMEDIATE=1444829519964930088
DISCORD_ROLE_ADVANCED=1444829551984378027

# Discord Role IDs (Coaching - Already configured in code)
# Deckzee VOD Review: 1456799809666154584
# 1-on-1 Coaching: 1456799859108479190
# Seasonal Coaching (2 Months): 1456799883519594680
# Advanced Seasonal Coaching: 1456799919238025358

# Discord Channel IDs for Coaching Products (optional)
DISCORD_VOD_REVIEW_CHANNEL_ID=
DISCORD_ONE_ON_ONE_CHANNEL_ID=
DISCORD_SEASONAL_BASIC_CHANNEL_ID=
DISCORD_SEASONAL_ADVANCED_CHANNEL_ID=

# Friend Group Server IDs (optional - depends on your setup)
DISCORD_FG_BEGINNER_SERVER_ID=
DISCORD_FG_INTERMEDIATE_SERVER_ID=
DISCORD_FG_ADVANCED_SERVER_ID=

# Podia Configuration
PODIA_API_TOKEN=your_podia_api_token_here
PODIA_WEBHOOK_SECRET=your_webhook_secret_here

# Podia Product IDs - Masterclasses
PODIA_BEGINNER_PRODUCT_ID=
PODIA_INTERMEDIATE_PRODUCT_ID=
PODIA_ADVANCED_PRODUCT_ID=

# Podia Product IDs - Coaching
PODIA_VOD_REVIEW_PRODUCT_ID=
PODIA_ONE_ON_ONE_PRODUCT_ID=
PODIA_SEASONAL_BASIC_PRODUCT_ID=
PODIA_SEASONAL_ADVANCED_PRODUCT_ID=

# Server Configuration
PORT=3001
NODE_ENV=production

# Database Configuration (if using database)
# DATABASE_URL=mongodb://localhost:27017/discord-integration
# DATABASE_URL=postgresql://user:password@localhost:5432/discord-integration
```

## Coaching Product Details

Based on your website (https://fortnitepathtopro.com/coaching):

- **Deckzee VOD Review Membership**: $20/month, Role: `1456799809666154584`
- **1-on-1 Coaching**: $150/hour, Role: `1456799859108479190`
- **Seasonal Coaching (2 Months)**: $500/season, Role: `1456799883519594680`
- **Advanced Seasonal Coaching**: $2,500/season, Role: `1456799919238025358`

These role IDs are already hardcoded in the system. You just need to add the corresponding Podia product IDs.
