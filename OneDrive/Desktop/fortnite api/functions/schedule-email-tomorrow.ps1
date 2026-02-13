# PathGen Email System - Schedule Bulk Email for Tomorrow at 4pm EST
# This script calculates the delay and waits until tomorrow at 4pm EST, then sends the emails

Write-Host "PathGen v2 Bulk Email Scheduler" -ForegroundColor Cyan
Write-Host ""

# Calculate tomorrow at 4pm EST
$now = Get-Date
$tomorrow = $now.AddDays(1)
$targetTime = Get-Date -Year $tomorrow.Year -Month $tomorrow.Month -Day $tomorrow.Day -Hour 16 -Minute 0 -Second 0

# EST is UTC-5, but we need to account for the current timezone
# For simplicity, we'll use the local time and assume it's EST
$targetTimeEST = $targetTime

$delay = ($targetTimeEST - $now).TotalMilliseconds

if ($delay -lt 0) {
    Write-Host "[ERROR] Target time is in the past!" -ForegroundColor Red
    exit 1
}

$hours = [math]::Floor($delay / 3600000)
$minutes = [math]::Floor(($delay % 3600000) / 60000)
$seconds = [math]::Floor(($delay % 60000) / 1000)

Write-Host "Scheduled send time: $($targetTimeEST.ToString('yyyy-MM-dd HH:mm:ss')) EST" -ForegroundColor Yellow
Write-Host "Current time: $($now.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Gray
Write-Host ""
Write-Host "Waiting: $hours hours, $minutes minutes, $seconds seconds" -ForegroundColor Cyan
Write-Host ""
Write-Host "The script will send emails automatically at the scheduled time." -ForegroundColor Green
Write-Host "Keep this window open until then, or use Windows Task Scheduler instead." -ForegroundColor Yellow
Write-Host ""

# Wait until target time
Start-Sleep -Milliseconds $delay

Write-Host ""
Write-Host "[TIME REACHED] Sending emails now..." -ForegroundColor Green
Write-Host ""

# Set credentials
$env:EMAIL_SMTP_USER = "AKIA3TD2SDYDYSEBUZB4"
$env:EMAIL_SMTP_PASS = "BDQAfaz8PgjAHwDsdUUWXmTCDiaeX45WOyuzW9yUPuOa"
$env:EMAIL_FROM = "support@pathgen.dev"

# Run the bulk send script
node send-bulk-announcement.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[SUCCESS] All emails sent!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[WARNING] Some emails may have failed." -ForegroundColor Yellow
}

