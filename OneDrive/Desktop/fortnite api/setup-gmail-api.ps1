# PathGen Gmail API Setup Script
# This script helps you set up Gmail API credentials

Write-Host "🚀 PathGen Gmail API Setup" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
$envFile = "apps\web\.env.local"
if (-not (Test-Path $envFile)) {
    Write-Host "📝 Creating .env.local file..." -ForegroundColor Yellow
    New-Item -Path $envFile -ItemType File -Force | Out-Null
}

Write-Host "📋 Setup Steps:" -ForegroundColor Green
Write-Host ""
Write-Host "1. Enable Gmail API:" -ForegroundColor White
Write-Host "   → Go to: https://console.cloud.google.com/apis/library/gmail.googleapis.com?project=pathgen-v2-479717" -ForegroundColor Gray
Write-Host "   → Click 'ENABLE' button" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Configure OAuth Consent Screen:" -ForegroundColor White
Write-Host "   → Go to: https://console.cloud.google.com/apis/credentials/consent?project=pathgen-v2-479717" -ForegroundColor Gray
Write-Host "   → Choose 'External'" -ForegroundColor Gray
Write-Host "   → App name: PathGen Email Reader" -ForegroundColor Gray
Write-Host "   → Support email: jlbender2005@gmail.com" -ForegroundColor Gray
Write-Host "   → Add scope: https://www.googleapis.com/auth/gmail.readonly" -ForegroundColor Gray
Write-Host "   → Add test user: jlbender2005@gmail.com" -ForegroundColor Gray
Write-Host "   → Save" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Create OAuth2 Credentials:" -ForegroundColor White
Write-Host "   → Go to: https://console.cloud.google.com/apis/credentials?project=pathgen-v2-479717" -ForegroundColor Gray
Write-Host "   → Click 'CREATE CREDENTIALS' → 'OAuth client ID'" -ForegroundColor Gray
Write-Host "   → Application type: Web application" -ForegroundColor Gray
Write-Host "   → Name: PathGen Email Reader" -ForegroundColor Gray
Write-Host "   → Authorized redirect URIs:" -ForegroundColor Gray
Write-Host "     - http://localhost:3000/api/email/gmail-callback" -ForegroundColor Gray
Write-Host "   → Click 'CREATE'" -ForegroundColor Gray
Write-Host ""
Write-Host "4. After creating credentials, you'll see:" -ForegroundColor White
Write-Host "   - Client ID (copy this)" -ForegroundColor Gray
Write-Host "   - Client Secret (copy this)" -ForegroundColor Gray
Write-Host ""

# Prompt for credentials
Write-Host "🔑 Enter your OAuth2 credentials:" -ForegroundColor Yellow
Write-Host ""

$clientId = Read-Host "Client ID"
$clientSecret = Read-Host "Client Secret" -AsSecureString
$clientSecretPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($clientSecret)
)

# Read existing .env.local
$envContent = ""
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw
}

# Update or add Gmail credentials
$lines = $envContent -split "`n"
$newLines = @()
$gmailClientIdSet = $false
$gmailClientSecretSet = $false
$gmailRedirectSet = $false

foreach ($line in $lines) {
    if ($line -match "^GMAIL_CLIENT_ID=") {
        $newLines += "GMAIL_CLIENT_ID=$clientId"
        $gmailClientIdSet = $true
    }
    elseif ($line -match "^GMAIL_CLIENT_SECRET=") {
        $newLines += "GMAIL_CLIENT_SECRET=$clientSecretPlain"
        $gmailClientSecretSet = $true
    }
    elseif ($line -match "^GMAIL_REDIRECT_URI=") {
        $newLines += "GMAIL_REDIRECT_URI=http://localhost:3000/api/email/gmail-callback"
        $gmailRedirectSet = $true
    }
    else {
        $newLines += $line
    }
}

# Add missing variables
if (-not $gmailClientIdSet) {
    $newLines += "GMAIL_CLIENT_ID=$clientId"
}
if (-not $gmailClientSecretSet) {
    $newLines += "GMAIL_CLIENT_SECRET=$clientSecretPlain"
}
if (-not $gmailRedirectSet) {
    $newLines += "GMAIL_REDIRECT_URI=http://localhost:3000/api/email/gmail-callback"
}

# Write to file
$newLines | Where-Object { $_ -ne "" } | Set-Content $envFile

Write-Host ""
Write-Host "✅ Credentials saved to .env.local" -ForegroundColor Green
Write-Host ""
Write-Host "5. Get OAuth2 Tokens:" -ForegroundColor White
Write-Host "   → Go to: https://developers.google.com/oauthplayground/" -ForegroundColor Gray
Write-Host "   → Click gear icon (⚙️) → Check 'Use your own OAuth credentials'" -ForegroundColor Gray
Write-Host "   → Enter Client ID: $clientId" -ForegroundColor Gray
Write-Host "   → Enter Client Secret: [your secret]" -ForegroundColor Gray
Write-Host "   → In left panel, find 'Gmail API v1'" -ForegroundColor Gray
Write-Host "   → Select: https://www.googleapis.com/auth/gmail.readonly" -ForegroundColor Gray
Write-Host "   → Click 'Authorize APIs'" -ForegroundColor Gray
Write-Host "   → Sign in with jlbender2005@gmail.com" -ForegroundColor Gray
Write-Host "   → Click 'Allow'" -ForegroundColor Gray
Write-Host "   → Click 'Exchange authorization code for tokens'" -ForegroundColor Gray
Write-Host "   → Copy the 'Refresh token'" -ForegroundColor Gray
Write-Host ""

$refreshToken = Read-Host "Paste your Refresh Token"

# Save refresh token (you might want to store this securely)
Write-Host ""
Write-Host "💾 Refresh token received!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Test the Gmail reader:" -ForegroundColor White
Write-Host "      curl -X POST http://localhost:3000/api/email/gmail-reader \`" -ForegroundColor Gray
Write-Host "        -H 'Content-Type: application/json' \`" -ForegroundColor Gray
Write-Host "        -d '{`"refresh_token`": `"$refreshToken`", `"query`": `"is:unread`", `"max_results`": 5}'" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. Or use the refresh token in your code" -ForegroundColor White
Write-Host ""
Write-Host "✅ Setup complete! Your refresh token is saved above." -ForegroundColor Green
Write-Host "   Keep it secure - you'll need it to access Gmail API." -ForegroundColor Yellow

