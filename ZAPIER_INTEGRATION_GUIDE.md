# Zapier Integration Guide for Advanced Logic (PR-Based Role Assignment)

This guide explains how to set up Zapier as an intermediary for PR-based logic that assigns additional Discord roles based on conditions.

## Overview

If you want to implement PR (Power Ranking) based logic for assigning additional Discord roles, you can use Zapier as an intermediary between your data sources and Discord.

## Architecture

```
Power Ranking Data Source (Google Sheets/DB) 
    ↓
Zapier (Triggers + Logic)
    ↓
Discord Bot API / Webhook
    ↓
Discord Server (Role Assignment)
```

## Option 1: Google Sheets as Data Source

### Setup Steps

1. **Create Google Sheet**
   - Create a new Google Sheet
   - Columns: `Discord User ID`, `Power Ranking`, `Product Type`, `Status`
   - Share with service account or make it accessible

2. **Create Zapier Zaps**

   **Zap 1: Update PR from Source**
   - Trigger: Webhook (when PR is updated)
   - Action: Google Sheets → Update Row
   - Match: Discord User ID

   **Zap 2: Assign Roles Based on PR**
   - Trigger: Google Sheets → New Row or Updated Row
   - Filter: Check PR value and conditions
   - Action: Webhook → POST to your Discord bot API
     - URL: `https://your-domain.com/api/discord/user/{user_id}/pr`
     - Method: POST
     - Body: `{ "powerRanking": {{PR_Value}}, "productId": "{{Product_ID}}" }`

### Zapier Configuration Example

**Trigger: Google Sheets - New Spreadsheet Row**
- Account: Connect your Google account
- Spreadsheet: Your PR tracking sheet
- Worksheet: Sheet1

**Filter by Zapier (Optional):**
- Only continue if PR >= 5000
- Only continue if Product Type = "Advanced Masterclass"

**Action: Webhook by Zapier**
- Method: POST
- URL: `https://api.fortnitepathtopro.com/api/discord/user/{{Discord_User_ID}}/pr`
- Headers:
  - `Content-Type: application/json`
  - `Authorization: Bearer YOUR_API_TOKEN` (if needed)
- Data:
```json
{
  "powerRanking": "{{PR_Value}}",
  "productId": "{{Product_ID}}"
}
```

## Option 2: Database as Data Source

### Setup Steps

1. **Use Your Existing Database**
   - Store PR data in your database (MongoDB, PostgreSQL, etc.)
   - Include Discord User ID mapping

2. **Create Zapier Zaps**

   **Option A: Database Webhook Trigger**
   - Trigger: Webhook (from your app when PR updates)
   - Action: Webhook → POST to Discord bot API

   **Option B: Scheduled Check**
   - Trigger: Schedule → Every hour/day
   - Action: Webhook → GET from your API endpoint
   - Action: Filter by Zapier → Check PR conditions
   - Action: Webhook → POST to Discord bot API

### Example: Scheduled PR Check Zap

**Trigger: Schedule by Zapier**
- Trigger Event: Every Hour

**Action: Webhook by Zapier - GET**
- Method: GET
- URL: `https://api.fortnitepathtopro.com/api/users/pr-check`

**Filter by Zapier:**
- Only continue if PR >= 5000
- Only continue if user has active subscription

**Action: Webhook by Zapier - POST**
- Method: POST
- URL: `https://api.fortnitepathtopro.com/api/discord/user/{{user_id}}/pr`
- Body: `{ "powerRanking": {{pr}}, "assignRole": true }`

## Option 3: Direct Integration (Recommended for Simple Cases)

If you already have a backend server, you may not need Zapier. Instead:

1. **Store PR in Your Database**
   - Update PR when users submit it
   - Store mapping: Discord User ID → PR Value

2. **Backend Logic**
   - When subscription is active AND PR meets criteria
   - Automatically assign additional roles via Discord bot

3. **API Endpoint** (Example)
```javascript
// POST /api/discord/user/:userId/pr
async function updateUserPR(userId, pr) {
  // 1. Store PR in database
  await db.updateUserPR(userId, pr);
  
  // 2. Get user's active subscriptions
  const subscriptions = await podiaService.getActiveSubscriptions(userId);
  
  // 3. Check PR thresholds
  if (pr >= 5000 && hasAdvancedSubscription(subscriptions)) {
    await discordBot.assignRole(userId, 'HIGH_PR_ROLE_ID');
  }
  
  // 4. Return success
  return { success: true };
}
```

## Discord Bot API Endpoints Needed

Your Discord bot/server should expose these endpoints:

### Update User PR
```
POST /api/discord/user/:userId/pr
Body: { "powerRanking": 5000 }
```

### Assign Role Based on Conditions
```
POST /api/discord/user/:userId/roles/assign
Body: { "roleId": "ROLE_ID", "condition": "pr>=5000" }
```

### Check User Status
```
GET /api/discord/user/:userId/status
Response: { "pr": 5000, "roles": [...], "subscriptions": [...] }
```

## Example Zapier Workflow: PR-Based Role Assignment

### Scenario: Assign "High PR" role if PR >= 5000 and user has Advanced Masterclass

**Step 1: Trigger**
- Google Sheets → New or Updated Row

**Step 2: Filter**
- Only continue if PR >= 5000
- Only continue if Subscription Status = "Active"

**Step 3: Action 1 - Check Subscription**
- Webhook → GET `https://api.fortnitepathtopro.com/api/discord/user/{{Discord_User_ID}}/status`

**Step 4: Filter**
- Only continue if response includes "Advanced Masterclass"

**Step 5: Action 2 - Assign Role**
- Webhook → POST `https://api.fortnitepathtopro.com/api/discord/user/{{Discord_User_ID}}/roles`
- Body: `{ "roleId": "HIGH_PR_ROLE_ID" }`

## Testing Your Zap

1. **Test Mode**: Use Zapier's test mode to see what data flows through
2. **Sample Data**: Create test rows in Google Sheets with known values
3. **Check Logs**: Review Zapier task history to see successes/failures
4. **Discord Verification**: Check Discord server to confirm roles are assigned

## Troubleshooting

### Zap Not Triggering
- ✅ Check trigger conditions
- ✅ Verify data format matches expected format
- ✅ Check Zapier task history for errors

### Role Not Assigning
- ✅ Verify Discord bot has permissions
- ✅ Check API endpoint is accessible
- ✅ Review Discord bot logs
- ✅ Verify role ID is correct

### PR Data Not Updating
- ✅ Check Google Sheets permissions
- ✅ Verify webhook data format
- ✅ Review Zapier filter conditions

## Alternative: Built-in Backend Logic (No Zapier)

If you prefer to keep logic in your backend:

1. **Store PR in Database** (when users submit PR)
2. **Backend Job** (runs periodically):
   - Fetch all active subscriptions
   - Check PR for each user
   - Assign/remove roles based on conditions
3. **Webhook Handler** (when PR is updated):
   - Immediately check conditions
   - Assign roles if criteria met

This avoids Zapier complexity and keeps everything in one place.

## Conclusion

Zapier is useful if:
- ✅ You want no-code automation
- ✅ You're using external data sources (Google Sheets)
- ✅ You need complex conditional logic without coding

Your existing backend is better if:
- ✅ You already have a server
- ✅ You want everything in one place
- ✅ You need more control over logic
- ✅ You want faster execution (no Zapier delays)

For most cases, implementing PR logic directly in your backend server is recommended.
