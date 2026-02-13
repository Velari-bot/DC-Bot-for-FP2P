# Quick Fix Firebase Admin JSON - Auto-setup from Downloads folder

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Quick Fix Firebase Admin JSON" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$envLocalPath = Join-Path $PSScriptRoot ".env.local"

# Check Downloads folder for Firebase JSON
$downloadsPath = Join-Path $env:USERPROFILE "Downloads"
$jsonFiles = Get-Item (Join-Path $downloadsPath "pathgen-v2-firebase-adminsdk*.json") -ErrorAction SilentlyContinue

if (-not $jsonFiles) {
    Write-Host "[ERROR] Firebase service account JSON not found in Downloads folder" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please download it from:" -ForegroundColor Yellow
    Write-Host "https://console.firebase.google.com/project/pathgen-v2/settings/serviceaccounts/adminsdk" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Save it to your Downloads folder as: pathgen-v2-firebase-adminsdk-*.json" -ForegroundColor White
    exit 1
}

$jsonFile = $jsonFiles[0]
Write-Host "[OK] Found Firebase JSON: $($jsonFile.Name)" -ForegroundColor Green
Write-Host ""

# Read and validate JSON
try {
    $jsonContent = Get-Content $jsonFile.FullName -Raw
    $jsonObject = $jsonContent | ConvertFrom-Json
    
    if ($jsonObject.type -ne "service_account") {
        Write-Host "[ERROR] Invalid service account file" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "[OK] Valid Firebase service account JSON" -ForegroundColor Green
    Write-Host "   Project ID: $($jsonObject.project_id)" -ForegroundColor Gray
    Write-Host "   Client Email: $($jsonObject.client_email)" -ForegroundColor Gray
    Write-Host ""
    
} catch {
    Write-Host "[ERROR] Failed to read/validate JSON file: $_" -ForegroundColor Red
    exit 1
}

# Read existing .env.local or create new
$envContent = ""
if (Test-Path $envLocalPath) {
    $envContent = Get-Content $envLocalPath -Raw
    Write-Host "[INFO] Found existing .env.local" -ForegroundColor Yellow
} else {
    Write-Host "[INFO] Creating new .env.local" -ForegroundColor Yellow
}

# Remove existing GOOGLE_APPLICATION_CREDENTIALS_JSON line if present
if ($envContent -match "GOOGLE_APPLICATION_CREDENTIALS_JSON") {
    Write-Host "[INFO] Removing existing GOOGLE_APPLICATION_CREDENTIALS_JSON entry" -ForegroundColor Yellow
    $envContent = $envContent -replace "(?m)^GOOGLE_APPLICATION_CREDENTIALS_JSON=.*$", ""
    $envContent = $envContent.Trim()
}

# Add new line - JSON as single line (no escaping needed, just remove newlines)
$singleLineJson = $jsonContent -replace "`r`n", " " -replace "`n", " " -replace '\s+', ' '
$newLine = "GOOGLE_APPLICATION_CREDENTIALS_JSON=$jsonContent"

# Combine
if ($envContent) {
    $envContent = $envContent.Trim() + "`n`n" + $newLine
} else {
    $envContent = $newLine
}

# Write to file
Set-Content -Path $envLocalPath -Value $envContent -NoNewline -Encoding UTF8

Write-Host "[OK] Updated .env.local with Firebase credentials" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Restart your dev server:" -ForegroundColor White
Write-Host "   Press Ctrl+C to stop, then run: npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "2. You should see in the console:" -ForegroundColor White
Write-Host "   [INFO] Firebase Admin initialized with GOOGLE_APPLICATION_CREDENTIALS_JSON" -ForegroundColor Gray
Write-Host ""
Write-Host "3. The voice page should now work correctly!" -ForegroundColor White
Write-Host ""

