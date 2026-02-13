# Quick script to fix Discord OAuth "invalid_client" error
# This script will guide you through setting the environment variables in Vercel

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Discord OAuth Configuration Fix" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

$CLIENT_ID = "1430744947732250726"
$CLIENT_SECRET = "OjxmPipOHqCfVzZOIGqGVcHf3eUFXwWC"
$REDIRECT_URI = "https://pathgen.dev/setup.html"

Write-Host "Configuration Values:" -ForegroundColor Green
Write-Host ""
Write-Host "  Client ID:      $CLIENT_ID" -ForegroundColor White
Write-Host "  Client Secret:  $($CLIENT_SECRET.Substring(0, 10))..." -ForegroundColor White
Write-Host "  Redirect URI:   $REDIRECT_URI" -ForegroundColor White
Write-Host ""

# Check if Vercel CLI is installed
Write-Host "Checking Vercel CLI..." -ForegroundColor Cyan
try {
    $vercelVersion = vercel --version 2>&1
    Write-Host "  Vercel CLI found: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "  Vercel CLI not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Please install it first:" -ForegroundColor Yellow
    Write-Host "    npm install -g vercel" -ForegroundColor White
    Write-Host ""
    Write-Host "  Or use the Vercel Dashboard instead:" -ForegroundColor Yellow
    Write-Host "    https://vercel.com/dashboard" -ForegroundColor Cyan
    Write-Host "    -> Your Project -> Settings -> Environment Variables" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Option 1: Use Vercel Dashboard (Easiest)" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Go to: https://vercel.com/dashboard" -ForegroundColor White
Write-Host "2. Click your project -> Settings -> Environment Variables" -ForegroundColor White
Write-Host "3. Add these 3 variables:" -ForegroundColor White
Write-Host ""
Write-Host "   Variable: DISCORD_CLIENT_ID" -ForegroundColor Cyan
Write-Host "   Value:    $CLIENT_ID" -ForegroundColor White
Write-Host "   Sensitive: No" -ForegroundColor Gray
Write-Host ""
Write-Host "   Variable: DISCORD_CLIENT_SECRET" -ForegroundColor Cyan
Write-Host "   Value:    $CLIENT_SECRET" -ForegroundColor White
Write-Host "   Sensitive: Yes" -ForegroundColor Gray
Write-Host ""
Write-Host "   Variable: DISCORD_REDIRECT_URI" -ForegroundColor Cyan
Write-Host "   Value:    $REDIRECT_URI" -ForegroundColor White
Write-Host "   Sensitive: No" -ForegroundColor Gray
Write-Host ""

$useCLI = Read-Host "Do you want to set them via CLI instead? (y/N)"
if ($useCLI -ne "y" -and $useCLI -ne "Y") {
    Write-Host ""
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host "  Next Steps:" -ForegroundColor Yellow
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Set the environment variables (see above)" -ForegroundColor White
    Write-Host "2. Verify Discord redirect URI (see below)" -ForegroundColor White
    Write-Host "3. Redeploy your project" -ForegroundColor White
    Write-Host ""
    Write-Host "See DISCORD-OAUTH-SETUP.md for complete instructions." -ForegroundColor Gray
    exit 0
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Option 2: Using Vercel CLI" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "The CLI will prompt you interactively for each variable." -ForegroundColor Yellow
Write-Host "Just copy and paste the values when prompted." -ForegroundColor Gray
Write-Host ""

# Remove existing variables first
Write-Host "Removing existing variables (if any)..." -ForegroundColor Cyan
vercel env rm DISCORD_CLIENT_ID production --yes 2>&1 | Out-Null
vercel env rm DISCORD_CLIENT_SECRET production --yes 2>&1 | Out-Null
vercel env rm DISCORD_REDIRECT_URI production --yes 2>&1 | Out-Null

Write-Host ""
Write-Host "1. Setting DISCORD_CLIENT_ID..." -ForegroundColor Yellow
Write-Host "   When prompted, paste: $CLIENT_ID" -ForegroundColor White
Write-Host "   Mark as sensitive? NO" -ForegroundColor Gray
Write-Host ""
Read-Host "Press Enter to continue"

Write-Host "   Running: vercel env add DISCORD_CLIENT_ID production" -ForegroundColor Gray
Start-Process -FilePath "vercel" -ArgumentList "env", "add", "DISCORD_CLIENT_ID", "production" -NoNewWindow -Wait

Write-Host ""
Write-Host "2. Setting DISCORD_CLIENT_SECRET..." -ForegroundColor Yellow
Write-Host "   When prompted, paste: $CLIENT_SECRET" -ForegroundColor White
Write-Host "   Mark as sensitive? YES" -ForegroundColor Gray
Write-Host ""
Read-Host "Press Enter to continue"

Write-Host "   Running: vercel env add DISCORD_CLIENT_SECRET production" -ForegroundColor Gray
Start-Process -FilePath "vercel" -ArgumentList "env", "add", "DISCORD_CLIENT_SECRET", "production" -NoNewWindow -Wait

Write-Host ""
Write-Host "3. Setting DISCORD_REDIRECT_URI..." -ForegroundColor Yellow
Write-Host "   When prompted, paste: $REDIRECT_URI" -ForegroundColor White
Write-Host "   Mark as sensitive? NO" -ForegroundColor Gray
Write-Host ""
Read-Host "Press Enter to continue"

Write-Host "   Running: vercel env add DISCORD_REDIRECT_URI production" -ForegroundColor Gray
Start-Process -FilePath "vercel" -ArgumentList "env", "add", "DISCORD_REDIRECT_URI", "production" -NoNewWindow -Wait

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  CRITICAL: Verify Discord Developer Portal" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Go to: https://discord.com/developers/applications" -ForegroundColor White
Write-Host "2. Select your app (Client ID: $CLIENT_ID)" -ForegroundColor White
Write-Host "3. Go to OAuth2 -> Redirects" -ForegroundColor White
Write-Host "4. Make sure this EXACT URL is in the list:" -ForegroundColor White
Write-Host ""
Write-Host "   $REDIRECT_URI" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Requirements:" -ForegroundColor Yellow
Write-Host "   - NO trailing slash" -ForegroundColor White
Write-Host "   - Must be https:// (not http://)" -ForegroundColor White
Write-Host "   - Must be pathgen.dev (NOT www.pathgen.dev)" -ForegroundColor White
Write-Host ""

$discordDone = Read-Host "Have you verified the Discord redirect URI? (y/N)"
if ($discordDone -ne "y" -and $discordDone -ne "Y") {
    Write-Host ""
    Write-Host "Please verify the Discord redirect URI before proceeding!" -ForegroundColor Yellow
    Write-Host "The OAuth will fail if the redirect URI doesn't match exactly." -ForegroundColor Red
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Final Step: Redeploy" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Environment variables are only applied after redeploy!" -ForegroundColor Yellow
Write-Host ""

$redeploy = Read-Host "Do you want to redeploy now? (y/N)"
if ($redeploy -eq "y" -or $redeploy -eq "Y") {
    Write-Host ""
    Write-Host "Redeploying to production..." -ForegroundColor Cyan
    vercel --prod
} else {
    Write-Host ""
    Write-Host "To redeploy later, run:" -ForegroundColor Yellow
    Write-Host "   vercel --prod" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Or redeploy from Vercel dashboard:" -ForegroundColor Yellow
    Write-Host "   Deployments -> ... -> Redeploy" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Done! After redeploy, test at:" -ForegroundColor Green
Write-Host "   https://pathgen.dev/login.html" -ForegroundColor Cyan
Write-Host ""
