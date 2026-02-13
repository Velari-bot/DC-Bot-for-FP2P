# Add TWEX_API_KEY to apps/web/.env.local

$envFile = ".env.local"
$keyName = "TWEX_API_KEY"
$keyValue = "twitterx_cff31709d075f6e12fa6960e281728c81f8a74a471b680c3"

Write-Host "Adding $keyName to $envFile..." -ForegroundColor Cyan

$exists = $false

if (Test-Path $envFile) {
    $lines = Get-Content $envFile
    $newLines = @()
    
    foreach ($line in $lines) {
        if ($line -like "$keyName=*") {
            $newLines += "$keyName=$keyValue"
            $exists = $true
            Write-Host "$keyName already exists, updating..." -ForegroundColor Yellow
        } else {
            $newLines += $line
        }
    }
    
    if (-not $exists) {
        $newLines += "$keyName=$keyValue"
        Write-Host "Adding $keyName..." -ForegroundColor Green
    }
    
    Set-Content $envFile -Value $newLines
} else {
    Write-Host "Creating new $envFile..." -ForegroundColor Green
    Set-Content $envFile -Value "$keyName=$keyValue"
}

Write-Host ""
Write-Host "Done! $keyName has been added to $envFile" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT: Restart your dev server for changes to take effect!" -ForegroundColor Yellow
Write-Host "   Press Ctrl+C to stop, then run: npm run dev" -ForegroundColor Gray
