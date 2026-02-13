# PowerShell script to create placeholder secrets for Firebase Functions
# This allows deployment before webhook is set up

Write-Host "Creating placeholder secrets for Firebase Functions" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Firebase CLI is installed
try {
    $null = firebase --version 2>&1
} catch {
    Write-Host "[ERROR] Firebase CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   npm install -g firebase-tools" -ForegroundColor Yellow
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
firebase use pathgen-v2

Write-Host ""
Write-Host "Creating placeholder STRIPE_WEBHOOK_SECRET..." -ForegroundColor Yellow
Write-Host "This is a temporary placeholder that you'll update after creating the Stripe webhook." -ForegroundColor Gray
Write-Host ""
Write-Host "When prompted 'Enter a value for STRIPE_WEBHOOK_SECRET:', paste: placeholder_update_after_webhook_creation" -ForegroundColor Yellow
Write-Host "When asked 'Mark as sensitive?', type: y" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Enter to continue..." -ForegroundColor Yellow
$null = Read-Host

$PLACEHOLDER_SECRET = "placeholder_update_after_webhook_creation"

echo $PLACEHOLDER_SECRET | firebase functions:secrets:set STRIPE_WEBHOOK_SECRET

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[OK] Placeholder secret created!" -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANT: After deploying functions and creating Stripe webhook:" -ForegroundColor Yellow
    Write-Host "1. Get webhook secret from Stripe Dashboard" -ForegroundColor White
    Write-Host "2. Update the secret:" -ForegroundColor White
    Write-Host "   firebase functions:secrets:set STRIPE_WEBHOOK_SECRET" -ForegroundColor Gray
    Write-Host "3. Redeploy webhook:" -ForegroundColor White
    Write-Host "   firebase deploy --only functions:stripeWebhook" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "[ERROR] Failed to create placeholder secret" -ForegroundColor Red
    Write-Host "You may need to create it manually:" -ForegroundColor Yellow
    Write-Host "   firebase functions:secrets:set STRIPE_WEBHOOK_SECRET" -ForegroundColor Gray
    exit 1
}

