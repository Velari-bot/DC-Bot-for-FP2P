# PathGen Email System - Send Bulk Announcement Email
# Sends the v2 announcement email to all recipients

Write-Host "PathGen v2 Bulk Announcement Email" -ForegroundColor Cyan
Write-Host ""

# Set your credentials
$env:EMAIL_SMTP_USER = "AKIA3TD2SDYDYSEBUZB4"
$env:EMAIL_SMTP_PASS = "BDQAfaz8PgjAHwDsdUUWXmTCDiaeX45WOyuzW9yUPuOa"
$env:EMAIL_FROM = "support@pathgen.dev"

Write-Host "Sending announcement email to all recipients..." -ForegroundColor Yellow
Write-Host "   Total recipients: 70" -ForegroundColor Gray
Write-Host "   From: $env:EMAIL_FROM" -ForegroundColor Gray
Write-Host ""

# Run the bulk send script
node send-bulk-announcement.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[SUCCESS] All emails sent successfully!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[WARNING] Some emails may have failed. Check the output above." -ForegroundColor Yellow
}

