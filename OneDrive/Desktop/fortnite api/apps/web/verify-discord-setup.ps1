# Quick script to verify Discord OAuth setup

Write-Host "Verifying Discord OAuth Configuration..." -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Checking Vercel Environment Variables..." -ForegroundColor Yellow
Write-Host ""
vercel env ls | Select-String "DISCORD"

Write-Host ""
Write-Host "2. Expected Values:" -ForegroundColor Yellow
Write-Host "   DISCORD_CLIENT_ID: 1430744947732250726" -ForegroundColor White
Write-Host "   DISCORD_CLIENT_SECRET: OjxmPipOHqCfVzZOIGqGVcHf3eUFXwWC" -ForegroundColor White
Write-Host "   DISCORD_REDIRECT_URI: https://pathgen.dev/setup.html" -ForegroundColor White

Write-Host ""
Write-Host "3. Discord Developer Portal Checklist:" -ForegroundColor Yellow
Write-Host "   Go to: https://discord.com/developers/applications" -ForegroundColor White
Write-Host "   Select app (Client ID: 1430744947732250726)" -ForegroundColor White
Write-Host "   Go to OAuth2 -> Redirects" -ForegroundColor White
Write-Host "   Make sure BOTH are added:" -ForegroundColor White
Write-Host "     - https://pathgen.dev/setup.html" -ForegroundColor Cyan
Write-Host "     - https://www.pathgen.dev/setup.html" -ForegroundColor Cyan

Write-Host ""
Write-Host "4. Next Steps:" -ForegroundColor Yellow
Write-Host "   - Update environment variables if needed (see UPDATE-DISCORD-VARS.md)" -ForegroundColor White
Write-Host "   - Add both redirect URIs to Discord" -ForegroundColor White
Write-Host "   - Redeploy: vercel --prod" -ForegroundColor White
Write-Host "   - Check logs after deployment" -ForegroundColor White

Write-Host ""

