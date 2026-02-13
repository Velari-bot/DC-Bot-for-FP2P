# PowerShell script to update Stripe webhook secret in Firebase Functions
Write-Host "Updating Stripe Webhook Secret in Firebase" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$WEBHOOK_SECRET = "whsec_KoLhF8L1SImCgnNRbhYvK28pRPa7MzKJ"

Write-Host "Setting STRIPE_WEBHOOK_SECRET..." -ForegroundColor Yellow
echo $WEBHOOK_SECRET | firebase functions:secrets:set STRIPE_WEBHOOK_SECRET

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[OK] Webhook secret updated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Redeploying stripeWebhook function..." -ForegroundColor Yellow
    firebase deploy --only functions:stripeWebhook
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "[OK] Webhook deployed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Stripe webhook is now fully connected!" -ForegroundColor Green
        Write-Host "Webhook URL: https://us-central1-pathgen-v2.cloudfunctions.net/stripeWebhook" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "[ERROR] Deployment failed. Check errors above." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host ""
    Write-Host "[ERROR] Failed to set webhook secret. Check errors above." -ForegroundColor Red
    exit 1
}

