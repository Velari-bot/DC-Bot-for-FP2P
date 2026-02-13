# Coaching Products Integration - Update Summary

## Overview

The Discord integration system has been updated to support both **Masterclass** and **Coaching** products as described on [your coaching page](https://fortnitepathtopro.com/coaching).

## New Products Added

### Coaching Products

1. **Deckzee VOD Review Membership**
   - Price: $20/month
   - Discord Role ID: `1456799809666154584`
   - Type: Subscription-based coaching

2. **1-on-1 Coaching**
   - Price: $150/hour
   - Discord Role ID: `1456799859108479190`
   - Type: One-time/coaching product

3. **Seasonal Coaching (2 Months)**
   - Price: $500/season
   - Discord Role ID: `1456799883519594680`
   - Type: Time-limited coaching subscription

4. **Advanced Seasonal Coaching**
   - Price: $2,500/season
   - Discord Role ID: `1456799919238025358`
   - Type: Premium coaching subscription

## System Updates

### 1. Product Configuration (`server/config/products.js`)

A new configuration file centralizes all product mappings:
- Maps Podia product IDs to Discord role IDs
- Distinguishes between masterclass and coaching products
- Supports channel access for coaching products

### 2. Enhanced Discord Bot (`server/discord-bot.js`)

New capabilities:
- `processProductAccess()` - Handles any product type (masterclass or coaching)
- `assignRoleByProduct()` - Assigns roles based on product ID
- `grantChannelAccess()` - Grants access to private Discord channels (for coaching)
- `revokeChannelAccess()` - Revokes channel access
- `revokeProductAccess()` - Revokes access for specific products

### 3. Updated Podia Service (`server/podia-service.js`)

New methods:
- `getActiveSubscriptions()` - Returns ALL active subscriptions (not just masterclasses)
- Uses product configuration to identify product types

### 4. Enhanced Routes (`server/routes/discord-routes.js`)

Updated webhook handler:
- Processes ALL subscriptions (masterclasses + coaching)
- Handles multiple concurrent subscriptions per user
- Assigns roles for each active subscription

## Key Differences: Masterclasses vs Coaching

### Masterclasses
- ✅ Assigns Discord role
- ✅ Grants Friend Group access (based on PR + level)
- ✅ One role per user (highest level)

### Coaching Products
- ✅ Assigns Discord role
- ✅ Grants access to private Discord channels (if configured)
- ✅ Multiple roles possible (users can have multiple coaching products)
- ❌ No Friend Group access (coaching products don't grant FG access)

## Configuration

### Environment Variables Needed

Add these to your `.env` file:

```env
# Podia Product IDs - Coaching
PODIA_VOD_REVIEW_PRODUCT_ID=your_product_id_here
PODIA_ONE_ON_ONE_PRODUCT_ID=your_product_id_here
PODIA_SEASONAL_BASIC_PRODUCT_ID=your_product_id_here
PODIA_SEASONAL_ADVANCED_PRODUCT_ID=your_product_id_here

# Discord Channel IDs (optional - for private coaching channels)
DISCORD_VOD_REVIEW_CHANNEL_ID=
DISCORD_ONE_ON_ONE_CHANNEL_ID=
DISCORD_SEASONAL_BASIC_CHANNEL_ID=
DISCORD_SEASONAL_ADVANCED_CHANNEL_ID=
```

### Role IDs

The coaching role IDs are **hardcoded** in `server/config/products.js`:
- VOD Review: `1456799809666154584`
- 1-on-1 Coaching: `1456799859108479190`
- Seasonal Basic: `1456799883519594680`
- Seasonal Advanced: `1456799919238025358`

No configuration needed for these - just ensure the roles exist in your Discord server.

## Private Discord Channels

If you want coaching products to grant access to private Discord channels:

1. Create private channels in your Discord server
2. Set channel permissions to be private (only accessible to specific roles)
3. Add channel IDs to `.env` file
4. The system will automatically grant channel access when users purchase coaching products

## How It Works

### Purchase Flow

1. User purchases a coaching product on Podia
2. Podia sends webhook to `/api/discord/webhook/podia`
3. System:
   - Fetches all active subscriptions for the user
   - Identifies product type (masterclass or coaching)
   - Assigns appropriate Discord role(s)
   - Grants channel access (if configured for coaching)
   - Grants FG access (if masterclass)

### Multiple Subscriptions

Users can have multiple active subscriptions simultaneously:
- Multiple coaching products (e.g., VOD Review + 1-on-1)
- One masterclass + multiple coaching products
- All roles are assigned independently

### Cancellation/Expiration

When a subscription expires or is canceled:
- The specific role is removed
- Channel access is revoked (if applicable)
- Other subscriptions remain active
- Masterclass FG access is recalculated if masterclass expires

## Testing

### Test Single Product
```bash
# Sync user (processes all subscriptions)
curl -X POST http://localhost:3001/api/discord/sync/user/PODIA_USER_ID
```

### Test Channel Access

If you've configured channel IDs, users with coaching products should automatically get access to private channels.

## Notes

1. **Product IDs**: You need to get the Podia product IDs for each coaching product and add them to `.env`

2. **Channel Access**: Private channel access is optional. If not configured, users will still get roles but no channel access.

3. **Multiple Roles**: Unlike masterclasses (where users get the highest level), coaching products can stack - users can have multiple coaching roles simultaneously.

4. **Webhook Events**: The system handles all Podia webhook events automatically - no changes needed to your Podia setup.

## Next Steps

1. ✅ Get Podia product IDs for coaching products
2. ✅ Add product IDs to `.env` file
3. ✅ Verify Discord roles exist and match the IDs
4. ⚠️ (Optional) Create private channels and configure channel IDs
5. ✅ Test with a purchase
6. ✅ Monitor logs to ensure everything works

## Backward Compatibility

All existing masterclass functionality remains unchanged:
- Masterclass role assignment still works
- Friend Group access logic unchanged
- Legacy methods still supported
- New system extends, doesn't replace, existing functionality

