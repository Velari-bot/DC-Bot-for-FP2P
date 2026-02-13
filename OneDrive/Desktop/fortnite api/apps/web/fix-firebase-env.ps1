# Fix Firebase Admin credentials in .env.local
# Converts multi-line JSON to single-line or uses file path

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fix Firebase Admin Credentials" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$envLocalPath = Join-Path $PSScriptRoot ".env.local"
# Service account file is in the project root (one level up from apps/web)
$projectRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$serviceAccountFile = Join-Path $projectRoot "pathgen-v2-firebase-adminsdk-fbsvc-c0de8ef705.json"

# Check if service account file exists
if (-not (Test-Path $serviceAccountFile)) {
    Write-Host "[ERROR] Service account file not found at: $serviceAccountFile" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please ensure the Firebase service account JSON file is in the project root." -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path $envLocalPath)) {
    Write-Host "[ERROR] .env.local file not found at: $envLocalPath" -ForegroundColor Red
    exit 1
}

Write-Host "[INFO] Reading .env.local..." -ForegroundColor Yellow
$content = Get-Content $envLocalPath -Raw

# Remove existing GOOGLE_APPLICATION_CREDENTIALS_JSON
if ($content -match "(?s)GOOGLE_APPLICATION_CREDENTIALS_JSON=.*?(?=\n[A-Z_]|$)") {
    Write-Host "[INFO] Removing existing GOOGLE_APPLICATION_CREDENTIALS_JSON (multi-line format)" -ForegroundColor Yellow
    $content = $content -replace "(?s)GOOGLE_APPLICATION_CREDENTIALS_JSON=.*?(?=\n[A-Z_]|$)", ""
    $content = $content.Trim()
}

# Remove existing GOOGLE_APPLICATION_CREDENTIALS file path (if different)
# Use relative path from apps/web to project root
$relativePath = "..\..\pathgen-v2-firebase-adminsdk-fbsvc-c0de8ef705.json"

# Add file path approach (recommended for local dev)
$newLine = "GOOGLE_APPLICATION_CREDENTIALS=$relativePath"

# Check if it already exists
if ($content -match "GOOGLE_APPLICATION_CREDENTIALS=") {
    Write-Host "[INFO] GOOGLE_APPLICATION_CREDENTIALS already exists, updating..." -ForegroundColor Yellow
    $content = $content -replace "GOOGLE_APPLICATION_CREDENTIALS=.*", $newLine
} else {
    # Add new line
    if ($content -and -not $content.EndsWith("`n")) {
        $content += "`n"
    }
    $content += $newLine
}

# Write back
Set-Content -Path $envLocalPath -Value $content -NoNewline

Write-Host "[OK] Updated .env.local to use file path approach" -ForegroundColor Green
Write-Host ""
Write-Host "Added: GOOGLE_APPLICATION_CREDENTIALS=$relativePath" -ForegroundColor Gray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Restart your dev server (Ctrl+C then npm run dev)" -ForegroundColor White
Write-Host "2. Check for: [INFO] Firebase Admin initialized with service account file" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

