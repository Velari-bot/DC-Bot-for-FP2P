# Railway deploy checklist (DC-Bot-for-FP2P)

## 1. Firebase — working if logs show

```text
Firebase Admin initialized for project: fp2p-bcd48
```

If not, see [RAILWAY_FIREBASE.md](RAILWAY_FIREBASE.md).

## 2. Discord token — `TokenInvalid` / healthcheck failure

Railway diagnosis is correct: **Firebase is fine; `DISCORD_TOKEN` is wrong.**

### Fix

1. Open [Discord Developer Portal](https://discord.com/developers/applications) → your bot application.
2. **Bot** tab → **Reset Token** → copy the new token.
3. Railway → service **DC-Bot-for-FP2P** → **Variables**:
   - Name: `DISCORD_TOKEN`
   - Value: paste token only (**no** `"` quotes, no `Bot ` prefix)
4. Also set (if missing):
   - `DISCORD_CLIENT_ID` — Application → General Information → Application ID
   - `PUBLIC_SERVER_ID` — your Discord server ID (right-click server → Copy Server ID)
5. **Redeploy**

### Verify locally before Railway

```powershell
cd discord-bot
$env:DISCORD_TOKEN = "paste-token-here"
npm run discord:validate-token
```

Expected: `Discord API: OK — bot user ...`

### Common mistakes

| Mistake | Symptom |
|---------|---------|
| Client **Secret** instead of Bot **Token** | `TokenInvalid` |
| Old token after reset | `TokenInvalid` |
| Quotes in Railway value | `TokenInvalid` |
| Placeholder from `.env.example` | Startup warns "placeholder" |

The bot no longer crashes on bad login (healthcheck stays up), but it will not connect until the token is valid.
