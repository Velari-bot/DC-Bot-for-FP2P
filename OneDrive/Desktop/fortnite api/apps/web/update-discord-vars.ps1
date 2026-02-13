# Script to update Discord OAuth environment variables in Vercel
# This removes existing variables and adds them again with correct values

Write-Host "Updating Discord OAuth environment variables in Vercel..." -ForegroundColor Cyan
Write-Host ""

$CLIENT_ID = "1430744947732250726"
$CLIENT_SECRET = "OjxmPipOHqCfVzZOIGqGVcHf3eUFXwWC"
$REDIRECT_URI = "https://pathgen.dev/setup.html"

Write-Host "Step 1: Removing existing variables..." -ForegroundColor Yellow
Write-Host ""

# Remove existing variables
Write-Host "Removing DISCORD_CLIENT_ID..." -ForegroundColor Gray
vercel env rm DISCORD_CLIENT_ID production --yes

Write-Host "Removing DISCORD_CLIENT_SECRET..." -ForegroundColor Gray
vercel env rm DISCORD_CLIENT_SECRET production --yes

Write-Host "Removing DISCORD_REDIRECT_URI..." -ForegroundColor Gray
vercel env rm DISCORD_REDIRECT_URI production --yes

Write-Host ""
Write-Host "Step 2: Adding variables with correct values..." -ForegroundColor Yellow
Write-Host ""

# Add DISCORD_CLIENT_ID
Write-Host "Adding DISCORD_CLIENT_ID..." -ForegroundColor Cyan
Write-Host "Value: $CLIENT_ID" -ForegroundColor Gray
echo "1430744947732250726" | vercel env add DISCORD_CLIENT_ID production
Write-Host "When prompted 'Mark as sensitive?', type: n" -ForegroundColor Yellow
Write-Host ""

# Add DISCORD_CLIENT_SECRET
Write-Host "Adding DISCORD_CLIENT_SECRET..." -ForegroundColor Cyan
Write-Host "Value: [hidden]" -ForegroundColor Gray
echo "OjxmPipOHqCfVzZOIGqGVcHf3eUFXwWC" | vercel env add DISCORD_CLIENT_SECRET production
Write-Host "When prompted 'Mark as sensitive?', type: y" -ForegroundColor Yellow
Write-Host ""

# Add DISCORD_REDIRECT_URI
Write-Host "Adding DISCORD_REDIRECT_URI..." -ForegroundColor Cyan
Write-Host "Value: $REDIRECT_URI" -ForegroundColor Gray
echo "https://pathgen.dev/setup.html" | vercel env add DISCORD_REDIRECT_URI production
Write-Host "When prompted 'Mark as sensitive?', type: n" -ForegroundColor Yellow
Write-Host ""

Write-Host "Done! Variables updated." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Verify: vercel env ls" -ForegroundColor White
Write-Host "2. Redeploy: vercel --prod" -ForegroundColor White
Write-Host ""

