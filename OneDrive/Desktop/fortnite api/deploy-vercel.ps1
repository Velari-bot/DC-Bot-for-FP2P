# PathGen - Deploy to Vercel Production
# Always deploy from root directory (Vercel Dashboard has Root Directory set to apps/web)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deploying to Vercel Production" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Ensure we're in the project root directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "[INFO] Current directory: $(Get-Location)" -ForegroundColor Gray
Write-Host "[INFO] Deploying from root directory (Vercel Dashboard has Root Directory = apps/web)" -ForegroundColor Yellow
Write-Host ""

# Deploy to Vercel production
Write-Host "Deploying to Vercel production..." -ForegroundColor Cyan
Write-Host "This may take 30-60 seconds..." -ForegroundColor Gray
Write-Host ""

$deployResult = vercel --prod 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ Deployment Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your changes are now live on:" -ForegroundColor Cyan
    Write-Host "  https://pathgen.dev" -ForegroundColor White
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  • Test the voice page: https://pathgen.dev/voice.html" -ForegroundColor White
    Write-Host "  • Check webhook deliveries in Stripe Dashboard" -ForegroundColor White
    Write-Host "  • Verify Firestore updates after purchase" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "❌ Deployment Failed!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error output:" -ForegroundColor Yellow
    Write-Host $deployResult -ForegroundColor Red
    Write-Host ""
    Write-Host "Common fixes:" -ForegroundColor Yellow
    Write-Host "  • Make sure you're logged in: vercel login" -ForegroundColor White
    Write-Host "  • Check Vercel Dashboard Root Directory setting" -ForegroundColor White
    Write-Host "  • Try deploying from root: cd 'C:\Users\bende\OneDrive\Desktop\fortnite api'" -ForegroundColor White
    Write-Host ""
    exit 1
}
