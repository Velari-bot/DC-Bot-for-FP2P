# PowerShell script to deploy Firebase Functions
# Run this from the project root directory

Write-Host "Deploying Firebase Functions for PathGen" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if Firebase CLI is installed
try {
    $null = firebase --version 2>&1
} catch {
    Write-Host "[ERROR] Firebase CLI not found. Please run setup-firebase-functions.ps1 first" -ForegroundColor Red
    exit 1
}

# Check if logged in
Write-Host "Checking Firebase login..." -ForegroundColor Yellow
$loginCheck = firebase projects:list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Not logged in to Firebase. Please run: firebase login" -ForegroundColor Red
    exit 1
}

# Set project
Write-Host "Setting Firebase project to pathgen-v2..." -ForegroundColor Yellow
firebase use pathgen-v2
if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARNING] Project might not be set correctly" -ForegroundColor Yellow
}

# Build functions
Write-Host ""
Write-Host "Building functions..." -ForegroundColor Yellow
Push-Location functions
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Build failed. Please fix errors and try again." -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location

# Check if STRIPE_WEBHOOK_SECRET exists
Write-Host ""
Write-Host "Checking if STRIPE_WEBHOOK_SECRET exists..." -ForegroundColor Yellow
$secretCheck = firebase functions:secrets:access STRIPE_WEBHOOK_SECRET 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARNING] STRIPE_WEBHOOK_SECRET not found!" -ForegroundColor Yellow
    Write-Host "Creating placeholder secret to allow deployment..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Run this script first: .\create-placeholder-secrets.ps1" -ForegroundColor Yellow
    Write-Host "Or create the secret manually and try again." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Deploy
Write-Host ""
Write-Host "Deploying functions to Firebase..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray
Write-Host ""

firebase deploy --only functions

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[OK] Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your functions are now live:" -ForegroundColor Cyan
    Write-Host "- Stripe Webhook: https://us-central1-pathgen-v2.cloudfunctions.net/stripeWebhook" -ForegroundColor White
    Write-Host ""
    Write-Host "Next: Set up Stripe webhook in Stripe Dashboard" -ForegroundColor Yellow
    Write-Host "See FIREBASE-FUNCTIONS-SETUP.md for instructions" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "[ERROR] Deployment failed. Check the errors above." -ForegroundColor Red
    exit 1
}

