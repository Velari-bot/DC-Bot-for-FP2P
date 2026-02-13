# Ingest Osirion Tweets

This script ingests specific tweets from @osirion_gg into the AI memory system.

## Usage

### Option 1: PowerShell Script (Recommended)

From the `apps/web` directory:

```powershell
cd apps/web
.\scripts\ingest-osirion-tweets.ps1
```

Or from the root directory:

```powershell
.\apps\web\scripts\ingest-osirion-tweets.ps1
```

### Option 2: API Endpoint

If your server is running, you can call the API endpoint directly:

```powershell
# PowerShell
Invoke-RestMethod -Uri "http://localhost:3000/api/twitter/ingest-osirion" -Method POST

# Or using curl (if available)
curl -X POST http://localhost:3000/api/twitter/ingest-osirion
```

### Option 3: TypeScript Script

```powershell
cd apps/web
node -r ts-node/register scripts/ingest-osirion-tweets.ts
```

## What It Does

1. **Processes 15 tweets** from @osirion_gg containing:
   - Storm/zone updates
   - Weapon vault/unvault changes
   - Gameplay mechanic updates
   - Map updates
   - Boss location information

2. **Applies safety checks**:
   - Filters out unsafe content
   - Removes duplicates
   - Strips usernames for privacy
   - Validates long-term relevance

3. **Ingests to memory**:
   - Stores in Firestore `memories` collection
   - Makes content available to AI assistant
   - Tags with source: `twitter` and author: `osirion_gg`

## Tweets Included

- **Dec 5**: Comp reload update (storm changes, glider deploy heights, zone radii, shrink/wait times)
- **Dec 5**: Dropmap generator note
- **Dec 5**: Reload weapon changes (vault/unvault)
- **Dec 5**: BR hotfix (self revives, grenades, sniper ammo, vehicles, etc.)
- **Dec 4**: New modes supported (surf city, starfall island)
- **Dec 3**: Comp storm update (zone pull distances)
- **Dec 2**: Chest spawn rate increase
- **Dec 1**: Storms fixed and net surge back
- **Nov 30**: BR comp storm updates
- **Dec 1**: Boss locations and mechanics
- **Nov 30**: Chaos champion surfing update

## Output

The script will show:
- Total tweets processed
- Number successfully ingested
- Number filtered out (if any)
- Any errors encountered

## Requirements

- Next.js server running (for API endpoint)
- Firebase credentials configured
- Access to Firestore database

## Notes

- All tweets are processed through the comprehensive Twitter ingestion pipeline
- Usernames are stripped before storage for privacy
- Only long-term relevant, factual content is stored
- Personal data is automatically filtered out

