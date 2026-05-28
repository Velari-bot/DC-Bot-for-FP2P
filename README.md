# FP2P Discord Bot (Railway)

Keeps Discord roles in sync with **Fortnite Path To Pro** website purchases (Firebase Firestore). Deploy this repo to Railway as a **long-running service** — separate from the Vercel website.

## Railway setup

1. **New Project** → Deploy from this GitHub repo.
2. **Root directory:** `/` (this folder is the repo root).
3. **Start command:** `npm start` (set in `railway.toml`).
4. **Health check:** path `/` on `PORT` (Railway injects `PORT` automatically).
5. Add **environment variables** from [`.env.example`](.env.example) — same Firebase + Discord values as production Vercel.

After first deploy, register slash commands once (locally or Railway shell):

```bash
npm run register-commands
# or globally:
npm run register-commands-global
```

## Required env

| Variable | Description |
|----------|-------------|
| `DISCORD_TOKEN` | Bot token |
| `DISCORD_CLIENT_ID` | Application client ID |
| `PUBLIC_SERVER_ID` | Discord server (guild) ID |
| `FIREBASE_SERVICE_ACCOUNT_B64` | Base64 service account JSON (see below) |
| `SITE_URL` | `https://www.fortnitepathtopro.com` |

### Firebase on Railway (fixes `DECODER routines::unsupported`)

**Do not** wrap the value in quotes in Railway. **Do not** base64-encode pretty-printed JSON by hand — the private key often gets corrupted.

From your machine (with the downloaded `service-account.json` from Firebase Console):

```bash
cd discord-bot
node scripts/encode-service-account.js ../fp2p-bcd48-firebase-adminsdk-fbsvc-e1b437bed5.json
```

Copy the **single line** of output into Railway → Variables → `FIREBASE_SERVICE_ACCOUNT_B64` (no `"` quotes).

Verify locally:

```bash
# PowerShell
$env:FIREBASE_SERVICE_ACCOUNT_B64 = "paste-line-here"
node scripts/test-firebase-b64.js
# Should print: OK: credential.cert accepted
```

If an old key was leaked or corrupted, Firebase Console → Project settings → Service accounts → **Generate new private key**, then run the encode script again.

## Commands

- `/sync` — Reconcile roles from Firestore
- `/status`, `/subscriptions`, `/credits`, `/link`, `/support`, `/live`
- Admin: `/admin-lookup`, `/admin-sync`, `/admin-grant`, `/admin-ban`, `/admin-unban`

Role mapping lives in [`shared/discordBot.js`](shared/discordBot.js) — keep in sync with the website repo’s `utils/discordBot.js` when adding products.

## Local run

```bash
cp .env.example .env
npm install
npm start
```

Optional: place `service-account.json` in this folder for local Firebase, or use `FIREBASE_SERVICE_ACCOUNT_B64`.
