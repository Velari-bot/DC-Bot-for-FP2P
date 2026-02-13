# Admin Panel Documentation

## Overview

The admin panel provides comprehensive management tools for the PathGen Fortnite AI Coach platform. It includes all essential features for user management, subscription control, monitoring, analytics, and more.

## Access

The admin panel is accessible at `/admin` and requires admin privileges. Users must have:
- `role: 'owner'` or `role: 'admin'` in their user document
- OR `isAdmin: true` flag set

## Features

### ✅ TIER 1 - Absolute Essentials

#### 1. User Management (`/admin` → Users tab)
- **Search users** by email or UID
- **View user profile** with full details (email, UID, signup date, last login)
- **View subscription status** (active, expired, canceled)
- **View usage stats** (chat usage, voice usage)
- **Manually update subscription** (extend, cancel, grant free premium)
- **Ban/unban users**

**API Routes:**
- `GET /api/admin/users/search?q={query}` - Search users
- `GET /api/admin/users/[uid]` - Get user details
- `PATCH /api/admin/users/[uid]` - Update user (ban, grant premium, etc.)

#### 2. Subscription Controls (`/admin` → Subscriptions tab)
- **View all active subscriptions**
- **Cancel subscriptions**
- **Refund recent invoices**
- **Manually grant "Premium"**
- **View payment history**
- **See next billing date**

**API Routes:**
- `GET /api/admin/subscriptions?status={status}` - List subscriptions
- `GET /api/admin/subscriptions/[uid]` - Get payment history
- `POST /api/admin/subscriptions/[uid]` - Cancel or refund

### ✅ TIER 2 - Operational Features

#### 3. Email / Notifications (`/admin` → Notifications tab)
- **Send push notifications** to all users
- **Send account-specific messages**
- **Trigger "renewal failed" reminders**
- **Trigger marketing email sequences**

**API Routes:**
- `POST /api/admin/notifications` - Send notification
- `GET /api/admin/notifications` - View notification history

**Note:** Brevo API integration is placeholder - implement actual email sending in production.

#### 4. System Monitoring (`/admin` → Monitoring tab)
- **Live usage graph**
- **Active users** in past 5 mins
- **Chat requests per minute**
- **Voice requests per minute**
- **API quota tracking**
- **Error logs**
- **Latency monitoring**

**API Routes:**
- `GET /api/admin/monitoring/stats?range={1h|24h|7d|30d}` - Get monitoring stats

### ✅ TIER 3 - Security & Staff Tools

#### 5. Admin Roles / Permissions (`/admin` → Roles tab)
- **Make other users admins**
- **Roles:**
  - `owner` - Full control (you)
  - `admin` - Full control
  - `support` - View users, manage subs
  - `readonly` - Analytics only

**API Routes:**
- `GET /api/admin/roles` - List all admins
- `PATCH /api/admin/roles` - Update user role

#### 6. Audit Logs (`/admin` → Audit Logs tab)
- Tracks every important action:
  - When someone changes a subscription
  - When someone gives free premium
  - When emails are sent
  - Role changes
  - User bans/unbans

**API Routes:**
- `GET /api/admin/audit-logs?action={action}&adminId={id}` - Get audit logs

### ✅ TIER 4 - Money Features

#### 7. Affiliate Management (`/admin` → Affiliates tab)
- **Create affiliate codes**
- **Set commission %**
- **View clicks, signups, conversions**
- **Export reports**
- **Pay out affiliates**

**API Routes:**
- `GET /api/admin/affiliates` - List affiliates
- `POST /api/admin/affiliates` - Create affiliate
- `GET /api/admin/affiliates/[code]` - Get conversions
- `PATCH /api/admin/affiliates/[code]` - Update affiliate

#### 8. Promo Codes / Free Trials (`/admin` → Promo Codes tab)
- **Create discount codes**
- **Set:**
  - % off
  - duration (1 month / forever)
  - usage limit
  - max redemptions

**API Routes:**
- `GET /api/admin/promo-codes` - List promo codes
- `POST /api/admin/promo-codes` - Create promo code

### ✅ TIER 5 - Product & A.I. Controls

#### 9. AI Model Usage Controls (`/admin` → AI Controls tab)
- **Adjust max messages per day**
- **Adjust voice usage limits**
- **Enable/disable GPT models**
- **Switch "GameKnowledge Mode" on/off**
- **Push new Fortnite patch knowledge updates**

**API Routes:**
- `GET /api/admin/ai/controls` - Get AI controls
- `PATCH /api/admin/ai/controls` - Update AI controls

#### 10. Content Editor for AI Training (`/admin` → AI Controls tab)
- **Add patch notes**
- **Add gameplay tips**
- **Add common Fortnite questions**
- **Add new weapons info**

**API Routes:**
- `GET /api/admin/ai/content?type={type}` - Get content
- `POST /api/admin/ai/content` - Add/update content

#### 11. Behavior Controls
- **Set strictness** (prevents off-topic convos)
- **Set allowed topics**
- **Filter inappropriate prompts**

## Analytics Dashboard

The Analytics Dashboard (`/admin` → Analytics tab) provides:
- **Live user count**
- **Chat/voice usage per hour**
- **Revenue MRR**
- **Refund rate**
- **Signups per day**

**API Routes:**
- `GET /api/admin/analytics/dashboard` - Get analytics data

## Authentication

All admin API routes require:
1. `x-user-id` or `user-id` header with the current user's ID
2. User must have admin privileges (checked via `checkAdmin()` helper)

## Firestore Collections Used

- `/users/{uid}` - User data
- `/subscriptions/{uid}` - Subscription data
- `/usage/{uid}` - Usage tracking
- `/abuse/{uid}` - Ban records
- `/affiliates/{code}` - Affiliate codes
- `/affiliateConversions` - Conversion tracking
- `/promoCodes/{code}` - Promo codes
- `/promoRedemptions` - Redemption tracking
- `/notifications` - Notification queue
- `/auditLogs` - Audit trail
- `/config/global` - Global configuration
- `/aiContent` - AI training content

## Setting Up Admin Access

To grant admin access to a user:

1. **Via Firestore Console:**
   ```javascript
   // Update user document
   db.collection('users').doc('USER_ID').update({
     role: 'admin', // or 'owner', 'support', 'readonly'
     isAdmin: true
   });
   ```

2. **Via Admin Panel:**
   - Go to Roles tab
   - Search for user
   - Update their role

## Security Notes

- All admin routes check for admin privileges
- Audit logs track all admin actions
- Owner role cannot be removed from yourself
- Stripe operations require valid API keys

## Next Steps

1. **Integrate Brevo API** for email notifications
2. **Add real-time updates** using Firestore listeners
3. **Add export functionality** for reports
4. **Add charts/graphs** for analytics visualization
5. **Add bulk operations** for user management
6. **Add webhook monitoring** for Stripe events

## Development

To test the admin panel locally:

1. Set admin role on your user:
   ```javascript
   // In Firebase Console or via script
   db.collection('users').doc('YOUR_UID').update({
     role: 'owner',
     isAdmin: true
   });
   ```

2. Make sure `userId` is stored in localStorage (from your auth system)

3. Navigate to `/admin` in your app

## API Error Handling

All admin API routes return:
- `401` - Unauthorized (no user ID)
- `403` - Forbidden (not admin)
- `404` - Not found
- `500` - Server error

Error responses include:
```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

