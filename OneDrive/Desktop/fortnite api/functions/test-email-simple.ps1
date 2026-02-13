# PathGen Email System - Simple Test Script (PowerShell)
# Tests email sending with your AWS SES credentials

# Set your credentials
$env:EMAIL_SMTP_USER = "AKIA3TD2SDYDYSEBUZB4"
$env:EMAIL_SMTP_PASS = "BDQAfaz8PgjAHwDsdUUWXmTCDiaeX45WOyuzW9yUPuOa"
$env:EMAIL_FROM = "support@pathgen.dev"
$env:TEST_EMAIL = "benderaiden826@gmail.com"

Write-Host "PathGen Email System Test" -ForegroundColor Cyan
Write-Host "Sending test email to: $env:TEST_EMAIL" -ForegroundColor Yellow
Write-Host ""

# Run the test
node test-email.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[SUCCESS] Test completed successfully!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[ERROR] Test failed. Check the error messages above." -ForegroundColor Red
}

