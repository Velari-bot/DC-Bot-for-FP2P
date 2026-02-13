# Setup Email Environment Variables for Support System
# Run this script from the apps/web directory

Write-Host "📧 Setting up email environment variables..." -ForegroundColor Cyan
Write-Host ""

$envFile = ".env.local"
$envPath = Join-Path $PSScriptRoot $envFile

# Check if file exists
if (Test-Path $envPath) {
    Write-Host "✅ Found existing .env.local file" -ForegroundColor Green
    $existing = Get-Content $envPath -Raw
    
    # Check if EMAIL variables already exist
    if ($existing -match "EMAIL_SMTP_USER") {
        Write-Host "⚠️  EMAIL_SMTP_USER already exists in .env.local" -ForegroundColor Yellow
        Write-Host "   Current value: $($existing -match 'EMAIL_SMTP_USER=([^\r\n]+)')" -ForegroundColor Gray
    }
} else {
    Write-Host "📝 Creating new .env.local file..." -ForegroundColor Yellow
}

# Email SMTP credentials
$emailVars = @"
EMAIL_SMTP_USER=AKIA3TD2SDYDRX7JH5O2
EMAIL_SMTP_PASS=BIA8EpW3glT0UdqrYmmifVHvTd6JIRI/S+pwqPUkKrqo
EMAIL_FROM=support@pathgen.dev
EMAIL_FROM_NAME=PathGen Support
"@

# Read existing file if it exists
$existingContent = ""
if (Test-Path $envPath) {
    $existingContent = Get-Content $envPath -Raw
}

# Remove old EMAIL variables if they exist
$lines = if ($existingContent) { $existingContent -split "`r?`n" } else { @() }
$filteredLines = $lines | Where-Object { 
    $_ -notmatch "^EMAIL_SMTP_USER=" -and 
    $_ -notmatch "^EMAIL_SMTP_PASS=" -and 
    $_ -notmatch "^EMAIL_FROM=" -and 
    $_ -notmatch "^EMAIL_FROM_NAME=" 
}

# Combine filtered content with new email vars
$newContent = ($filteredLines | Where-Object { $_.Trim() -ne "" }) -join "`n"
if ($newContent) {
    $newContent += "`n`n"
}
$newContent += $emailVars

# Write to file
$newContent | Out-File -FilePath $envPath -Encoding utf8 -NoNewline

Write-Host ""
Write-Host "✅ Email environment variables configured!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Variables set:" -ForegroundColor Cyan
Write-Host "   EMAIL_SMTP_USER=AKIA3TD2SDYDRX7JH5O2" -ForegroundColor Gray
Write-Host "   EMAIL_SMTP_PASS=*** (hidden)" -ForegroundColor Gray
Write-Host "   EMAIL_FROM=support@pathgen.dev" -ForegroundColor Gray
Write-Host "   EMAIL_FROM_NAME=PathGen Support" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  IMPORTANT: Restart your Next.js dev server for changes to take effect!" -ForegroundColor Yellow
Write-Host "   1. Stop the server (Ctrl+C)" -ForegroundColor White
Write-Host "   2. Run: npm run dev" -ForegroundColor White
Write-Host ""
