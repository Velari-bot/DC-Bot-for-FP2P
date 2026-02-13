# Add Twitter API v2 credentials to .env.local
# Run from project root: .\apps\web\add-twitter-v2-env.ps1

$envFile = ".env.local"

if (-not (Test-Path $envFile)) {
    New-Item -Path $envFile -ItemType File -Force | Out-Null
}

Write-Host "Adding Twitter API v2 credentials to .env.local..." -ForegroundColor Cyan
Write-Host ""

# Read existing content
$content = Get-Content $envFile -Raw -ErrorAction SilentlyContinue
if (-not $content) {
    $content = ""
}

# Remove existing Twitter credentials
$content = $content -replace 'TWITTER_BEARER_TOKEN=.*\r?\n?', ''
$content = $content -replace 'TWITTER_API_KEY=.*\r?\n?', ''
$content = $content -replace 'TWITTER_API_KEY_SECRET=.*\r?\n?', ''
$content = $content -replace 'TWITTER_ACCESS_TOKEN=.*\r?\n?', ''
$content = $content -replace 'TWITTER_ACCESS_TOKEN_SECRET=.*\r?\n?', ''
$content = $content.TrimEnd()
if ($content) {
    $content += "`n"
}

Write-Host "Enter your Twitter API credentials:" -ForegroundColor Yellow
Write-Host "(Press Enter to skip any field)" -ForegroundColor Gray
Write-Host ""

# Bearer Token (required for read-only access)
$bearerToken = Read-Host "Bearer Token (REQUIRED - for fetching tweets)"
if ($bearerToken) {
    # URL decode if needed (remove % encoding)
    try {
        $bearerToken = [System.Uri]::UnescapeDataString($bearerToken)
    } catch {
        # If decoding fails, use as-is (might already be decoded)
    }
    $bearerToken = $bearerToken.Trim()
    $content += "TWITTER_BEARER_TOKEN=$bearerToken`n"
}

# API Key (optional - for authenticated requests)
$apiKey = Read-Host "API Key (optional)"
if ($apiKey) {
    $apiKey = $apiKey.Trim()
    $content += "TWITTER_API_KEY=$apiKey`n"
}

# API Key Secret (optional)
$apiKeySecret = Read-Host "API Key Secret (optional)"
if ($apiKeySecret) {
    $apiKeySecret = $apiKeySecret.Trim()
    $content += "TWITTER_API_KEY_SECRET=$apiKeySecret`n"
}

# Access Token (optional)
$accessToken = Read-Host "Access Token (optional)"
if ($accessToken) {
    $accessToken = $accessToken.Trim()
    $content += "TWITTER_ACCESS_TOKEN=$accessToken`n"
}

# Access Token Secret (optional)
$accessTokenSecret = Read-Host "Access Token Secret (optional)"
if ($accessTokenSecret) {
    $accessTokenSecret = $accessTokenSecret.Trim()
    $content += "TWITTER_ACCESS_TOKEN_SECRET=$accessTokenSecret`n"
}

# Write to file
Set-Content -Path $envFile -Value $content -NoNewline

Write-Host ""
Write-Host "✅ Twitter credentials added to .env.local" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  Note: Your Bearer Token was URL-decoded if needed" -ForegroundColor Yellow
Write-Host ""
Write-Host "Test the endpoint:" -ForegroundColor Cyan
Write-Host "  http://localhost:3000/api/twitter/v2-ingest" -ForegroundColor Yellow
Write-Host ""
Write-Host "Or run:" -ForegroundColor Cyan
Write-Host "  .\scripts\test-twitter-v2.ps1" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  Remember: Free tier is limited to 100 tweets/month" -ForegroundColor Yellow
Write-Host ""
Write-Host "IMPORTANT: Restart your dev server for changes to take effect!" -ForegroundColor Red
