# Quick script to add Discord OAuth environment variables to Vercel
# Run this from the apps/web directory

Write-Host "Adding Discord OAuth environment variables to Vercel..." -ForegroundColor Cyan
Write-Host ""

$CLIENT_ID = "1430744947732250726"
$CLIENT_SECRET = "OjxmPipOHqCfVzZOIGqGVcHf3eUFXwWC"
$REDIRECT_URI = "https://pathgen.dev/setup.html"

# Check if Vercel CLI is installed
try {
    $null = vercel --version 2>&1
    Write-Host "Vercel CLI found" -ForegroundColor Green
} catch {
    Write-Host "Vercel CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "  npm install -g vercel" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Adding environment variables..." -ForegroundColor Yellow
Write-Host ""

# Remove existing variables first (if they exist)
Write-Host "Cleaning up existing variables (if any)..." -ForegroundColor Gray
vercel env rm DISCORD_CLIENT_ID production --yes 2>&1 | Out-Null
vercel env rm DISCORD_CLIENT_SECRET production --yes 2>&1 | Out-Null
vercel env rm DISCORD_REDIRECT_URI production --yes 2>&1 | Out-Null

Write-Host ""
Write-Host "1. Adding DISCORD_CLIENT_ID..." -ForegroundColor Cyan
Write-Host "   Value: $CLIENT_ID" -ForegroundColor Gray
echo $CLIENT_ID | vercel env add DISCORD_CLIENT_ID production
Write-Host ""

Write-Host "2. Adding DISCORD_CLIENT_SECRET..." -ForegroundColor Cyan
Write-Host "   Value: [hidden]" -ForegroundColor Gray
echo $CLIENT_SECRET | vercel env add DISCORD_CLIENT_SECRET production
Write-Host ""

Write-Host "3. Adding DISCORD_REDIRECT_URI..." -ForegroundColor Cyan
Write-Host "   Value: $REDIRECT_URI" -ForegroundColor Gray
echo $REDIRECT_URI | vercel env add DISCORD_REDIRECT_URI production
Write-Host ""

Write-Host "Done! Variables added to Vercel." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Verify variables: vercel env ls" -ForegroundColor White
Write-Host "2. Redeploy: vercel --prod" -ForegroundColor White
Write-Host ""

