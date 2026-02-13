# Script to add Discord OAuth variables to .env.local for local development

$envFile = ".env.local"

Write-Host "Adding Discord OAuth variables to .env.local..." -ForegroundColor Cyan
Write-Host ""

# Check if file exists
if (-not (Test-Path $envFile)) {
    Write-Host "Creating .env.local file..." -ForegroundColor Yellow
    New-Item -Path $envFile -ItemType File | Out-Null
}

# Read existing content
$existingContent = @()
if (Test-Path $envFile) {
    $existingContent = Get-Content $envFile -ErrorAction SilentlyContinue
}

# Variables to add
$variablesToAdd = @{
    "DISCORD_CLIENT_ID" = "1430744947732250726"
    "DISCORD_CLIENT_SECRET" = "OjxmPipOHqCfVzZOIGqGVcHf3eUFXwWC"
    "DISCORD_REDIRECT_URI" = "http://localhost:3000/setup.html"
}

# Check what already exists
$keysToAdd = @()
foreach ($key in $variablesToAdd.Keys) {
    $exists = $existingContent | Where-Object { $_ -match "^$key\s*=" }
    if ($exists) {
        Write-Host "⚠️  $key already exists in .env.local" -ForegroundColor Yellow
        $overwrite = Read-Host "Do you want to overwrite it? (y/N)"
        if ($overwrite -eq "y" -or $overwrite -eq "Y") {
            $keysToAdd += $key
            # Remove existing line
            $existingContent = $existingContent | Where-Object { $_ -notmatch "^$key\s*=" }
        }
    } else {
        $keysToAdd += $key
    }
}

# Add new variables
$newContent = $existingContent | Where-Object { $_ -notmatch "^\s*$" } # Remove empty lines
$newContent += ""

if ($keysToAdd.Count -gt 0) {
    $newContent += "# Discord OAuth Configuration"
    foreach ($key in $keysToAdd) {
        $value = $variablesToAdd[$key]
        $newContent += "$key=$value"
        Write-Host "✅ Adding: $key" -ForegroundColor Green
    }
}

# Write to file
$newContent | Set-Content $envFile

Write-Host ""
Write-Host "✅ Done! Variables added to .env.local" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: Restart your dev server for changes to take effect!" -ForegroundColor Yellow
Write-Host "   Stop the server (Ctrl+C) and run: npm run dev" -ForegroundColor White
Write-Host ""

