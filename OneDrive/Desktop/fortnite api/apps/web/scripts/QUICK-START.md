# Quick Start Guide for Ingestion Scripts

## Prerequisites

1. **Start the Next.js development server**:
   ```powershell
   cd apps/web
   npm run dev
   ```
   
   The server should be running on `http://localhost:3000`

2. **Ensure Firebase is configured**:
   - Make sure `GOOGLE_APPLICATION_CREDENTIALS_JSON` is set in your environment
   - Or run the Firebase setup script if needed

## Running Ingestion Scripts

### From `apps/web` directory:

```powershell
cd apps/web

# Ingest Osirion tweets
.\scripts\ingest-osirion-tweets.ps1

# Ingest weapon stats
.\scripts\ingest-weapon-stats.ps1
```

### From root directory:

```powershell
# Ingest Osirion tweets
.\apps\web\scripts\ingest-osirion-tweets.ps1

# Ingest weapon stats
.\apps\web\scripts\ingest-weapon-stats.ps1
```

## Troubleshooting

### "Unable to connect to the remote server"
- **Solution**: Make sure the Next.js dev server is running
- Run `npm run dev` in the `apps/web` directory first

### "Unexpected token '}' in expression or statement"
- **Solution**: Fixed in latest version - make sure you have the updated scripts
- If still occurring, try running PowerShell as Administrator

### "Firebase credentials not configured"
- **Solution**: Set up Firebase credentials
- Run: `.\setup-local-firebase.ps1` or add `GOOGLE_APPLICATION_CREDENTIALS_JSON` to `.env.local`

### Script not found
- **Solution**: Make sure you're in the correct directory
- Use full path: `.\apps\web\scripts\ingest-weapon-stats.ps1` from root
- Or `.\scripts\ingest-weapon-stats.ps1` from `apps/web`

## Alternative: Direct API Calls

If scripts don't work, you can call the API directly:

```powershell
# Ingest Osirion tweets
Invoke-RestMethod -Uri "http://localhost:3000/api/twitter/ingest-osirion" -Method POST

# Ingest weapon stats
Invoke-RestMethod -Uri "http://localhost:3000/api/weapons/stats" -Method POST
```

## Verification

After ingestion, verify the data was stored:

```powershell
# Check memories
Invoke-RestMethod -Uri "http://localhost:3000/api/memory/list?limit=5"

# Check weapon stats
Invoke-RestMethod -Uri "http://localhost:3000/api/weapons/stats"
```

