# PathGen Backend Architecture

## Overview

Complete Firebase Cloud Functions backend for PathGen — Fortnite AI Coach SaaS platform, following the exact specifications provided.

## Architecture Stack

- **Firebase Firestore** — Primary database
- **Firebase Auth** — User authentication
- **Firebase Cloud Functions** (Node.js/TypeScript) — Serverless backend
- **Stripe** — Payment processing and subscription management

## Directory Structure

```
functions/
├── src/
│   ├── auth/
│   │   └── onUserSignup.ts          # User signup trigger
│   ├── messages/
│   │   ├── sendMessage.ts           # Message send endpoint
│   │   └── pruneMessages.ts         # Scheduled message cleanup
│   ├── conversations/
│   │   └── createConversation.ts    # Conversation creation
│   ├── stripe/
│   │   └── webhook.ts               # Stripe webhook handler
│   ├── subscriptions/
│   │   └── resetUsage.ts            # Usage reset on renewal
│   ├── usage/
│   │   └── trackVoiceUsage.ts       # Voice usage tracking
│   ├── abuse/
│   │   └── detectAbuse.ts           # Abuse detection trigger
│   ├── types/
│   │   └── firestore.ts             # TypeScript type definitions
│   ├── utils/
│   │   ├── constants.ts             # Constants and defaults
│   │   └── firestore.ts             # Firestore helpers
│   └── index.ts                     # Main exports
├── scripts/
│   └── initGlobalConfig.ts          # Global config initialization
├── package.json
├── tsconfig.json
└── README.md

firestore.rules              # Security rules
firestore.indexes.json       # Required indexes
firebase.json                # Firebase configuration
```

## Firestore Data Model

All collections follow the exact schema specified:

### `/users/{uid}`
- User profile and authentication data
- Stripe customer ID
- Premium status (cached)

### `/subscriptions/{uid}`
- Stripe subscription details
- Plan ID and status
- Billing period dates

### `/usage/{uid}`
- Message and voice usage counters
- Tier limits (free/premium)
- Period start/end dates

### `/conversations/{uid}/{conversationId}`
- Conversation metadata
- Last message snippet
- Type (text/voice)

### `/messages/{uid}/{conversationId}/{messageId}`
- Message content and metadata
- Tokens used
- Audio URL (for voice messages)

### `/config/global`
- Global app configuration
- Pricing
- Fortnite patch version

### `/webhooks/stripe/{eventId}`
- Webhook event log
- For debugging and audit

### `/abuse/{uid}`
- Flagged messages
- Ban status
- Abuse history

## Cloud Functions

### Authentication Functions

#### `onUserSignup`
- **Trigger**: Firebase Auth user creation
- **Actions**:
  1. Creates user document in `/users/{uid}`
  2. Creates usage document with free tier limits
  3. Creates Stripe customer
  4. Creates subscription document (free tier)
- **Atomic**: Uses batch writes

### Message Functions

#### `sendMessage`
- **Type**: Callable function (v2)
- **Purpose**: Send message with usage checking
- **Validation**:
  - User authenticated
  - Usage limits checked
  - Period expiration handled
- **Actions**:
  1. Checks premium status
  2. Validates usage against limits
  3. Increments message counter
  4. Saves message to Firestore
  5. Updates conversation metadata
- **Error Handling**: Returns `resource-exhausted` if limit reached

#### `pruneOldMessages`
- **Type**: Scheduled function (daily)
- **Purpose**: Clean up old messages for free users
- **Logic**: Deletes messages older than 75 days
- **Scope**: Only free tier users

### Conversation Functions

#### `createConversation`
- **Type**: Callable function (v2)
- **Purpose**: Create new conversation
- **Returns**: Conversation ID

### Stripe Functions

#### `stripeWebhook`
- **Type**: HTTPS function (v2)
- **Purpose**: Handle Stripe webhook events
- **Events Handled**:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.paid`
- **Actions**:
  - Updates subscription document
  - Updates user premium status
  - Resets usage on billing cycle renewal
  - Handles plan upgrades/downgrades

### Usage Functions

#### `trackVoiceUsage`
- **Type**: Callable function (v2)
- **Purpose**: Track voice usage in seconds
- **Validation**: Checks voice seconds limit
- **Increments**: `voiceSecondsThisPeriod`

#### `resetUsageOnRenewal`
- **Type**: Callable function
- **Purpose**: Reset usage counters manually
- **Use Case**: Backup reset if webhook fails

### Abuse Detection

#### `detectAbuse`
- **Type**: Firestore trigger (on message create)
- **Purpose**: Detect and flag abuse
- **Detection**:
  - Jailbreak attempts
  - Non-Fortnite content
  - Excessive message frequency (>100/hour)
- **Actions**:
  - Records flags in `/abuse/{uid}`
  - Temporary ban after 10 flags

## Security Rules

Firestore security rules enforce:

1. **User Data Isolation**
   - Users can only read/write their own data
   - Sub-collections follow parent permissions

2. **Read-Only Collections**
   - `/subscriptions` — Only backend can modify
   - `/usage` — Only backend can modify
   - `/webhooks` — Only backend can access

3. **Admin Access**
   - Requires `admin` custom claim
   - Access to `/admin/*` and `/abuse/*`

4. **Ban Enforcement**
   - Checks `/abuse/{uid}.bannedUntil`
   - Blocks message creation if banned

## Usage Limits

### Free Tier
- Messages: 50 per period (30 days)
- Voice: 300 seconds per period

### Premium Tier
- Messages: 999,999 per period
- Voice: 999,999 seconds per period

## Billing Cycle

- Free tier: 30-day rolling period
- Premium: Billing period from Stripe subscription
- Usage resets:
  - On billing cycle renewal (via webhook)
  - Automatically if period expired (checked on each request)

## Error Handling

All functions use proper error handling:
- Authentication errors: `unauthenticated`
- Validation errors: `invalid-argument`
- Resource limits: `resource-exhausted`
- Not found: `not-found`
- Server errors: `internal`

Errors are logged with context for debugging.

## Transactions and Batches

Critical operations use:
- **Transactions**: For atomic read-modify-write (usage checks)
- **Batches**: For multiple document updates (user signup)

## Type Safety

All data types are defined in `src/types/firestore.ts`:
- Matches exact Firestore schema
- TypeScript interfaces for all collections
- Prevents schema drift

## Deployment

See `functions/DEPLOYMENT.md` for detailed deployment instructions.

### Quick Deploy

```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

### Environment Setup

```bash
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
```

## Testing

### Local Development

```bash
firebase emulators:start
```

Functions available at:
- `http://localhost:5001/pathgen-v2/us-central1/{functionName}`

### Stripe Webhook Testing

```bash
stripe listen --forward-to localhost:5001/pathgen-v2/us-central1/stripeWebhook
```

## Monitoring

- **Logs**: `firebase functions:log`
- **Console**: Firebase Console → Functions → Logs
- **Metrics**: Firebase Console → Functions → Metrics

## Future Enhancements

Potential additions:
1. Message search/indexing
2. Advanced abuse detection (ML-based)
3. Usage analytics dashboard
4. Automated customer support
5. A/B testing framework

## Compliance

- No sensitive payment data stored in Firestore
- Only Stripe IDs and statuses stored
- PCI DSS compliant (via Stripe)
- GDPR-ready data structure

## Support

For issues or questions:
1. Check function logs
2. Review Firestore security rules
3. Verify Stripe webhook configuration
4. Check usage limits in Firestore

---

**Last Updated**: 2024
**Version**: 1.0.0
