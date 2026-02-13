# Fortnite API Integration Setup

This guide explains how to set up and use the Fortnite API integrations for the AI model.

## APIs Integrated

### 1. Fortnite-API.com
**Dashboard:** https://dash.fortnite-api.com/about  
**Documentation:** https://fortnite-api.com/

**Endpoints Used:**
- `/v2/news` - Battle Royale news and updates
- `/v2/shop/br` - Daily item shop data
- `/v2/events` - Tournament and event information

**Features:**
- News articles and announcements
- Item shop updates (featured and daily items)
- Tournament/event listings with prize pools
- Cosmetic item information

### 2. FortniteAPI.io
**Dashboard:** https://dashboard.fortniteapi.io/  
**Documentation:** https://api.fortniteapi.io/

**Endpoints Used:**
- `/v2/shop` - Item shop data
- `/v2/challenges` - Weekly and daily challenges
- `/v2/items/list` - Cosmetics database

**Features:**
- Item shop with pricing
- Weekly challenges and quests
- Comprehensive cosmetics database
- Battle Pass information

## Setup

### 1. Get API Keys

**Fortnite-API.com:**
1. Visit https://dash.fortnite-api.com/about
2. Register for an account
3. Get your API key from the dashboard
4. Add to `.env.local`:
   ```
   FORTNITE_API_KEY=your_api_key_here
   ```

**FortniteAPI.io:**
1. Visit https://dashboard.fortniteapi.io/
2. Register for an account
3. Get your API key from the dashboard
4. Add to `.env.local`:
   ```
   FORTNITEAPI_IO_KEY=your_api_key_here
   ```

### 2. Run Ingestion

**PowerShell Script:**
```powershell
cd apps/web
.\scripts\ingest-fortnite-apis.ps1
```

**Direct API Call:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/fortnite-api/ingest" -Method POST
```

## Data Collected

### From Fortnite-API.com:
- **News**: Battle Royale news articles and announcements
- **Shop**: Daily item shop with featured and daily items
- **Events**: Tournament listings, prize pools, formats

### From FortniteAPI.io:
- **Shop**: Item shop with pricing information
- **Challenges**: Weekly and daily challenges/quests
- **Cosmetics**: Summary of cosmetics database

## Storage

All data is stored in Firestore `memories` collection with:
- `source`: 'fortnite-api-com' or 'fortniteapi-io'
- `type`: 'news', 'shop', 'event', 'challenges', 'cosmetics'
- `content`: Formatted text content for AI
- `metadata`: Structured data (items, prices, etc.)
- `tags`: Relevant tags for filtering

## AI Access

The AI assistant can now answer questions like:
- "What's in the item shop today?"
- "What are the weekly challenges?"
- "Are there any tournaments coming up?"
- "What new cosmetics were added?"
- "What's the prize pool for the next event?"

## Rate Limits

**Fortnite-API.com:**
- Free tier: Limited requests
- Premium: Higher limits
- Check dashboard for your plan limits

**FortniteAPI.io:**
- Free tier: Limited requests
- Premium: Higher limits and additional features
- Check dashboard for your plan limits

## Troubleshooting

### "API key not set"
- Make sure you've added the API keys to `.env.local`
- Restart the dev server after adding keys
- Check that variable names match exactly

### "Rate limit exceeded"
- Wait before trying again
- Consider upgrading to premium plans
- Reduce ingestion frequency

### "No data collected"
- Check API keys are valid
- Verify API endpoints are accessible
- Check server logs for specific errors

## Manual Testing

Test individual endpoints:

```powershell
# Test Fortnite-API.com (replace YOUR_KEY)
$headers = @{ "Authorization" = "YOUR_KEY" }
Invoke-RestMethod -Uri "https://fortnite-api.com/v2/news" -Headers $headers

# Test FortniteAPI.io (replace YOUR_KEY)
$headers = @{ "Authorization" = "YOUR_KEY" }
Invoke-RestMethod -Uri "https://fortniteapi.io/v2/shop" -Headers $headers
```

## Notes

- Data is cached for 1 hour (news/shop) or 24 hours (cosmetics)
- Both APIs are optional - the system works with one or both
- Data is automatically deduplicated
- Only new/updated data is stored

