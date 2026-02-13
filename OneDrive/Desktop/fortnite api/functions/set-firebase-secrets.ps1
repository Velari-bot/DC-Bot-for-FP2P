# PathGen Email System - Set Firebase Secrets
# This script helps you set Firebase secrets for email configuration

Write-Host "Setting Firebase Secrets for Email System" -ForegroundColor Cyan
Write-Host ""

# SMTP Username
Write-Host "Setting EMAIL_SMTP_USER..." -ForegroundColor Yellow
Write-Host "Value: AKIA3TD2SDYDYSEBUZB4" -ForegroundColor Gray
firebase functions:secrets:set EMAIL_SMTP_USER
Write-Host ""

# SMTP Password
Write-Host "Setting EMAIL_SMTP_PASS..." -ForegroundColor Yellow
Write-Host "Value: BDQAfaz8PgjAHwDsdUUWXmTCDiaeX45WOyuzW9yUPuOa" -ForegroundColor Gray
firebase functions:secrets:set EMAIL_SMTP_PASS
Write-Host ""

# From Address
Write-Host "Setting EMAIL_FROM..." -ForegroundColor Yellow
Write-Host "Value: support@pathgen.dev" -ForegroundColor Gray
firebase functions:secrets:set EMAIL_FROM
Write-Host ""

Write-Host "[SUCCESS] All secrets set!" -ForegroundColor Green
Write-Host ""
Write-Host "To verify, run: firebase functions:secrets:access EMAIL_SMTP_USER" -ForegroundColor Cyan

