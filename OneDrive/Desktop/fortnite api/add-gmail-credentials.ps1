# Quick script to add Gmail Client ID to .env.local

$envFile = "apps\web\.env.local"
$clientId = "113289613392-1dcak30a8s610evbgr1hf8jnu1tm10vk.apps.googleusercontent.com"

Write-Host "🔧 Adding Gmail Client ID to .env.local..." -ForegroundColor Cyan

# Read existing content
$content = ""
if (Test-Path $envFile) {
    $content = Get-Content $envFile -Raw
}

# Check if GMAIL_CLIENT_ID already exists
if ($content -match "GMAIL_CLIENT_ID=") {
    # Update existing
    $content = $content -replace "GMAIL_CLIENT_ID=.*", "GMAIL_CLIENT_ID=$clientId"
    Write-Host "✅ Updated existing GMAIL_CLIENT_ID" -ForegroundColor Green
} else {
    # Add new
    if ($content -and -not $content.EndsWith("`n")) {
        $content += "`n"
    }
    $content += "GMAIL_CLIENT_ID=$clientId`n"
    Write-Host "✅ Added GMAIL_CLIENT_ID" -ForegroundColor Green
}

# Ensure redirect URI is set
if (-not ($content -match "GMAIL_REDIRECT_URI=")) {
    $content += "GMAIL_REDIRECT_URI=http://localhost:3000/api/email/gmail-callback`n"
    Write-Host "✅ Added GMAIL_REDIRECT_URI" -ForegroundColor Green
}

# Write back
$content | Set-Content $envFile

Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Add Redirect URI to OAuth Client:" -ForegroundColor White
Write-Host "   → Go to: https://console.cloud.google.com/apis/credentials?project=pathgen-v2-479717" -ForegroundColor Gray
Write-Host "   → Click 'PathGen Email Reader'" -ForegroundColor Gray
Write-Host "   → Add redirect URI: https://developers.google.com/oauthplayground" -ForegroundColor Gray
Write-Host "   → Also add: http://localhost:3000/api/email/gmail-callback" -ForegroundColor Gray
Write-Host "   → Click SAVE" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Get Client Secret:" -ForegroundColor White
Write-Host "   → In the same OAuth client page, click 'SHOW' next to Client secret" -ForegroundColor Gray
Write-Host "   → Copy the secret" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Get Refresh Token:" -ForegroundColor White
Write-Host "   → Go to: https://developers.google.com/oauthplayground/" -ForegroundColor Gray
Write-Host "   → Click gear icon → Check 'Use your own OAuth credentials'" -ForegroundColor Gray
Write-Host "   → Enter Client ID and Secret" -ForegroundColor Gray
Write-Host "   → Select Gmail API v1 → gmail.readonly scope" -ForegroundColor Gray
Write-Host "   → Authorize → Exchange for tokens" -ForegroundColor Gray
Write-Host "   → Copy Refresh Token" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ Client ID saved to .env.local" -ForegroundColor Green

