# PathGen Email System - Send Announcement Test Email
# Sends the v2 announcement email to test address

# Set your credentials
$env:EMAIL_SMTP_USER = "AKIA3TD2SDYDYSEBUZB4"
$env:EMAIL_SMTP_PASS = "BDQAfaz8PgjAHwDsdUUWXmTCDiaeX45WOyuzW9yUPuOa"
$env:EMAIL_FROM = "support@pathgen.dev"

Write-Host "Sending PathGen v2 Announcement Email..." -ForegroundColor Cyan
Write-Host ""

# Run the test
node send-announcement-test.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[SUCCESS] Announcement email sent!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[ERROR] Failed to send email. Check errors above." -ForegroundColor Red
}

