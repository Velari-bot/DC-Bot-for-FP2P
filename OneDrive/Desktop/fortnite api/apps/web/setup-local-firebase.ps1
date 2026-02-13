# Setup Firebase Admin Credentials for Local Development
# This script helps you add Firebase service account credentials to .env.local

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Firebase Admin Local Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
$envLocalPath = Join-Path $PSScriptRoot ".env.local"
$envLocalExists = Test-Path $envLocalPath

if (-not $envLocalExists) {
    Write-Host "[INFO] Creating .env.local file..." -ForegroundColor Yellow
    New-Item -Path $envLocalPath -ItemType File -Force | Out-Null
}

Write-Host "To set up Firebase Admin for local development, you need:" -ForegroundColor Yellow
Write-Host "1. Download your Firebase service account JSON file" -ForegroundColor White
Write-Host "2. Add it to .env.local as GOOGLE_APPLICATION_CREDENTIALS_JSON" -ForegroundColor White
Write-Host ""

# Prompt for service account file path
$serviceAccountPath = Read-Host "Enter the path to your Firebase service account JSON file (or press Enter to skip)"

if ($serviceAccountPath -and (Test-Path $serviceAccountPath)) {
    Write-Host "[INFO] Reading service account file..." -ForegroundColor Yellow
    
    try {
        $jsonContent = Get-Content $serviceAccountPath -Raw
        
        # Validate JSON
        $jsonObject = $jsonContent | ConvertFrom-Json
        Write-Host "[OK] Valid JSON format" -ForegroundColor Green
        
        # Escape the JSON for .env.local (single line)
        $escapedJson = $jsonContent -replace "`r`n", "`n" -replace "`n", "\n" -replace '"', '\"'
        
        # Read existing .env.local
        $existingContent = ""
        if ($envLocalExists) {
            $existingContent = Get-Content $envLocalPath -Raw
        }
        
        # Check if GOOGLE_APPLICATION_CREDENTIALS_JSON already exists
        if ($existingContent -match "GOOGLE_APPLICATION_CREDENTIALS_JSON") {
            Write-Host "[WARNING] GOOGLE_APPLICATION_CREDENTIALS_JSON already exists in .env.local" -ForegroundColor Yellow
            $overwrite = Read-Host "Do you want to overwrite it? (y/n)"
            
            if ($overwrite -eq "y" -or $overwrite -eq "Y") {
                # Remove old line
                $existingContent = $existingContent -replace "GOOGLE_APPLICATION_CREDENTIALS_JSON=.*", ""
                $existingContent = $existingContent.Trim()
            } else {
                Write-Host "[SKIP] Keeping existing credentials" -ForegroundColor Yellow
                exit 0
            }
        }
        
        # Add the new credentials
        $newLine = "GOOGLE_APPLICATION_CREDENTIALS_JSON=$jsonContent"
        
        if ($existingContent) {
            $newContent = $existingContent.Trim() + "`n`n" + $newLine
        } else {
            $newContent = $newLine
        }
        
        # Write to .env.local
        Set-Content -Path $envLocalPath -Value $newContent -NoNewline
        
        Write-Host "[OK] Added GOOGLE_APPLICATION_CREDENTIALS_JSON to .env.local" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Restart your dev server (npm run dev)" -ForegroundColor White
        Write-Host "2. Check the console for '[INFO] Firebase Admin initialized...'" -ForegroundColor White
        
    } catch {
        Write-Host "[ERROR] Failed to process service account file: $_" -ForegroundColor Red
        exit 1
    }
} else {
    if ($serviceAccountPath) {
        Write-Host "[ERROR] File not found: $serviceAccountPath" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Manual setup instructions:" -ForegroundColor Cyan
    Write-Host "1. Download service account JSON from:" -ForegroundColor White
    Write-Host "   https://console.firebase.google.com/project/pathgen-v2/settings/serviceaccounts/adminsdk" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Add to .env.local:" -ForegroundColor White
    Write-Host "   GOOGLE_APPLICATION_CREDENTIALS_JSON={...paste entire JSON here...}" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Restart dev server" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

