# PathGen Firebase Cloud Functions

Backend functions for PathGen — Fortnite AI Coach SaaS platform.

## Architecture

- **Firebase Firestore** for data storage
- **Firebase Auth** for authentication
- **Firebase Cloud Functions** (Node.js/TypeScript) for backend logic
- **Stripe** for payments and subscription management

## Setup

### Prerequisites

- Node.js 20+
- Firebase CLI installed (`npm install -g firebase-tools`)
- Firebase project initialized

### Installation

```bash
cd functions
npm install
```

### Configuration

Set Firebase config:

```bash
firebase use --add
# Select your project: pathgen-v2
```

Set Stripe configuration:

```bash
firebase functions:config:set stripe.secret_key="sk_test_..."
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET="whsec_..."
```

### Development

```bash
# Build TypeScript
npm run build

# Run emulator
npm run serve

# Watch mode
npm run build:watch
```

### Deployment

```bash
# Deploy all functions
npm run deploy

# Deploy specific function
firebase deploy --only functions:onUserSignup
```

## Functions

### Authentication

- **`onUserSignup`** — Triggered on new user signup
  - Creates user document
  - Creates usage document with free limits
  - Creates Stripe customer
  - Creates subscription document

### Messages

- **`sendMessage`** — Callable function to send messages
  - Checks usage limits
  - Increments message counter
  - Saves message to Firestore
  - Updates conversation

- **`pruneOldMessages`** — Scheduled function (daily)
  - Deletes messages older than 75 days for free users

### Conversations

- **`createConversation`** — Callable function to create new conversations

### Stripe

- **`stripeWebhook`** — HTTPS function for Stripe webhooks
  - Handles `customer.subscription.created`
  - Handles `customer.subscription.updated`
  - Handles `invoice.paid`
  - Handles `customer.subscription.deleted`
  - Updates subscriptions and user premium status

### Usage

- **`trackVoiceUsage`** — Callable function to track voice usage in seconds
- **`resetUsageOnRenewal`** — Callable function to reset usage on billing cycle

### Abuse Detection

- **`detectAbuse`** — Triggered on message creation
  - Detects jailbreak attempts
  - Flags non-Fortnite content
  - Detects excessive message frequency
  - Records in `/abuse/{uid}` collection

## Firestore Security Rules

Security rules are in `firestore.rules`. Deploy with:

```bash
firebase deploy --only firestore:rules
```

## Environment Variables

Required environment variables:

- `STRIPE_SECRET_KEY` — Stripe secret key
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing secret

## Data Model

See `src/types/firestore.ts` for complete type definitions matching the exact schema requirements.

## Testing

Test functions locally with Firebase Emulator Suite:

```bash
firebase emulators:start
```

Then call functions from your frontend pointing to the emulator endpoints.

## Monitoring

View function logs:

```bash
firebase functions:log
```

Or in Firebase Console: Functions → Logs
