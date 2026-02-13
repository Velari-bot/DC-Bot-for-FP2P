# PowerShell script to set Discord OAuth environment variables in Vercel
# Run this from the apps/web directory

Write-Host "🔐 Setting Discord OAuth Environment Variables in Vercel..." -ForegroundColor Cyan
Write-Host ""

$CLIENT_ID = "1430744947732250726"
$CLIENT_SECRET = "OjxmPipOHqCfVzZOIGqGVcHf3eUFXwWC"
$REDIRECT_URI = "https://pathgen.dev/setup.html"

Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "  Client ID: $CLIENT_ID" -ForegroundColor White
Write-Host "  Client Secret: $($CLIENT_SECRET.Substring(0, 8))..." -ForegroundColor White
Write-Host "  Redirect URI: $REDIRECT_URI" -ForegroundColor White
Write-Host ""

# Check if Vercel CLI is installed
try {
    $vercelVersion = vercel --version 2>&1
    Write-Host "✅ Vercel CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "  npm install -g vercel" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🔄 Updating environment variables..." -ForegroundColor Cyan
Write-Host ""

Write-Host "⚠️  Note: Vercel CLI will prompt you interactively for each variable" -ForegroundColor Yellow
Write-Host "   When prompted, copy and paste the values shown below" -ForegroundColor Gray
Write-Host ""

# Remove existing variables first (optional - won't error if they don't exist)
Write-Host "🧹 Cleaning up existing variables (if any)..." -ForegroundColor Yellow
vercel env rm DISCORD_CLIENT_ID production --yes 2>&1 | Out-Null
vercel env rm DISCORD_CLIENT_SECRET production --yes 2>&1 | Out-Null
vercel env rm DISCORD_REDIRECT_URI production --yes 2>&1 | Out-Null

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🔐 Setting DISCORD_CLIENT_ID" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "When prompted:" -ForegroundColor White
Write-Host "  Value: $CLIENT_ID" -ForegroundColor Cyan
Write-Host "  Mark as sensitive? NO (press n or just Enter)" -ForegroundColor Gray
Write-Host "  Environments: Production" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Enter to continue..." -ForegroundColor Yellow
Read-Host

$env:DISCORD_CLIENT_ID_VALUE = $CLIENT_ID
echo $CLIENT_ID | vercel env add DISCORD_CLIENT_ID production

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🔐 Setting DISCORD_CLIENT_SECRET" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "When prompted:" -ForegroundColor White
Write-Host "  Value: $CLIENT_SECRET" -ForegroundColor Cyan
Write-Host "  Mark as sensitive? YES (press y)" -ForegroundColor Gray
Write-Host "  Environments: Production" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Enter to continue..." -ForegroundColor Yellow
Read-Host

echo $CLIENT_SECRET | vercel env add DISCORD_CLIENT_SECRET production

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🔐 Setting DISCORD_REDIRECT_URI" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "When prompted:" -ForegroundColor White
Write-Host "  Value: $REDIRECT_URI" -ForegroundColor Cyan
Write-Host "  Mark as sensitive? NO (press n or just Enter)" -ForegroundColor Gray
Write-Host "  Environments: Production" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Enter to continue..." -ForegroundColor Yellow
Read-Host

echo $REDIRECT_URI | vercel env add DISCORD_REDIRECT_URI production

Write-Host ""
Write-Host "📝 Summary:" -ForegroundColor Yellow
Write-Host "  ✅ DISCORD_CLIENT_ID = $CLIENT_ID" -ForegroundColor White
Write-Host "  ✅ DISCORD_CLIENT_SECRET = [hidden]" -ForegroundColor White
Write-Host "  ✅ DISCORD_REDIRECT_URI = $REDIRECT_URI" -ForegroundColor White

Write-Host ""
Write-Host "⚠️  IMPORTANT: Verify Discord Developer Portal" -ForegroundColor Yellow
Write-Host "  1. Go to: https://discord.com/developers/applications" -ForegroundColor White
Write-Host "  2. Select your app (Client ID: $CLIENT_ID)" -ForegroundColor White
Write-Host "  3. Go to OAuth2 → Redirects" -ForegroundColor White
Write-Host "  4. Make sure this EXACT URL is added:" -ForegroundColor White
Write-Host "     $REDIRECT_URI" -ForegroundColor Cyan
Write-Host "     - No trailing slash" -ForegroundColor Gray
Write-Host "     - Must be https (not http)" -ForegroundColor Gray
Write-Host "     - Must be pathgen.dev (not www.pathgen.dev)" -ForegroundColor Gray

Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Green
Write-Host "  1. Redeploy your Vercel project:" -ForegroundColor White
Write-Host "     vercel --prod" -ForegroundColor Cyan
Write-Host ""
Write-Host "  2. Or redeploy from Vercel dashboard:" -ForegroundColor White
Write-Host "     - Go to your Vercel project" -ForegroundColor Gray
Write-Host "     - Click 'Deployments'" -ForegroundColor Gray
Write-Host "     - Click '...' on latest deployment → 'Redeploy'" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Test the Discord login flow" -ForegroundColor White

Write-Host ""
Write-Host "✨ Done!" -ForegroundColor Green

