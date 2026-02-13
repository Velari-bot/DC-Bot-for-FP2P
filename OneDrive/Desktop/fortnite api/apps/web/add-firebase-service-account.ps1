# Add Firebase Service Account JSON to Vercel
# Run this after downloading the service account JSON file

param(
    [Parameter(Mandatory=$true)]
    [string]$ServiceAccountPath
)

Write-Host "Adding Firebase Service Account to Vercel..." -ForegroundColor Cyan
Write-Host "Service Account File: $ServiceAccountPath" -ForegroundColor Gray

# Check if file exists
if (-not (Test-Path $ServiceAccountPath)) {
    Write-Host "[ERROR] Service account file not found: $ServiceAccountPath" -ForegroundColor Red
    exit 1
}

# Read the JSON file
try {
    $jsonContent = Get-Content $ServiceAccountPath -Raw
    Write-Host "[OK] Read service account JSON file" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to read service account file: $_" -ForegroundColor Red
    exit 1
}

# Validate JSON
try {
    $jsonObject = $jsonContent | ConvertFrom-Json
    Write-Host "[OK] Valid JSON format" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Invalid JSON format: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`nAdding GOOGLE_APPLICATION_CREDENTIALS_JSON to Vercel..." -ForegroundColor Yellow
Write-Host "This will add it for Production, Preview, and Development environments." -ForegroundColor Gray
Write-Host ""

# Add to Vercel
echo $jsonContent | vercel env add GOOGLE_APPLICATION_CREDENTIALS_JSON production

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Added to Production environment" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to add to Production" -ForegroundColor Red
    exit 1
}

# Also add to preview and development
echo $jsonContent | vercel env add GOOGLE_APPLICATION_CREDENTIALS_JSON preview
echo $jsonContent | vercel env add GOOGLE_APPLICATION_CREDENTIALS_JSON development

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Firebase Service Account Added!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Redeploy to apply changes:" -ForegroundColor White
Write-Host "   vercel --prod" -ForegroundColor Blue
Write-Host ""
Write-Host "2. Test by creating a new account" -ForegroundColor White
Write-Host "3. Check Firestore to verify user document was created" -ForegroundColor White
Write-Host ""

