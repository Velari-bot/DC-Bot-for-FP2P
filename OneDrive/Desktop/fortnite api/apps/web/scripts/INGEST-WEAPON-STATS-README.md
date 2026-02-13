# Ingest Weapon Stats

This script ingests Fortnite Chapter 6 Season 1 weapon statistics into the AI memory system.

## Usage

### PowerShell Script (Recommended)

From the `apps/web` directory:

```powershell
cd apps/web
.\scripts\ingest-weapon-stats.ps1
```

Or from the root directory:

```powershell
.\apps\web\scripts\ingest-weapon-stats.ps1
```

### API Endpoint

If your server is running, you can call the API endpoint directly:

```powershell
# PowerShell
Invoke-RestMethod -Uri "http://localhost:3000/api/weapons/stats" -Method POST

# Or using curl (if available)
curl -X POST http://localhost:3000/api/weapons/stats
```

## What It Does

1. **Processes 9 weapons** from Chapter 6 Season 1:
   - Deadeye Assault Rifle
   - Enforcer AR
   - Arc-Lightning Gun (including Human Bill's Mythic variant)
   - Dual Micro SMGs
   - Tactical Pistol
   - Twin Hammer Shotguns
   - Iron Pump Shotgun
   - Holo Rush SMG
   - Vengeful Sniper Rifle

2. **Stores comprehensive stats** for each weapon:
   - Damage, headshot damage, structure damage
   - Fire rate, DPS, clip size, reload time
   - Recoil (vertical/horizontal, ADS)
   - Spread (hipfire/ADS)
   - ADS timing
   - Special stats (projectile speed, bullet width, etc.)

3. **Creates two types of documents**:
   - Individual weapon documents (one per weapon)
   - Comprehensive document (all weapons together)

## Data Structure

Each weapon is stored with:
- `source: 'weapon-stats'`
- `weaponName`: Name of the weapon
- `chapter`: Chapter number (6)
- `season`: Season number (1)
- `stats`: Array of stat objects with rarity values
- `specialVariants`: Array of special weapon variants (if any)

## Retrieving Weapon Stats

### Get All Weapons

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/weapons/stats"
```

### Get Specific Weapon

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/weapons/stats?weapon=Enforcer AR"
```

### Filter by Chapter/Season

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/weapons/stats?chapter=6&season=1"
```

## Output

The script will show:
- Total weapons processed
- Number successfully ingested
- Any errors encountered

## Requirements

- Next.js server running (for API endpoint)
- Firebase credentials configured
- Access to Firestore database

## Notes

- All weapon stats are stored in a structured format
- Stats are formatted for easy AI consumption
- The AI assistant can query specific weapons or compare stats
- Special variants (like Human Bill's Arc-Lightning Gun) are stored separately

## Example Query

The AI can now answer questions like:
- "What's the DPS of the Enforcer AR?"
- "Compare the Tactical Pistol and Dual Micro SMGs"
- "What are the stats for Human Bill's Arc-Lightning Gun?"
- "Which weapon has the highest headshot damage?"

