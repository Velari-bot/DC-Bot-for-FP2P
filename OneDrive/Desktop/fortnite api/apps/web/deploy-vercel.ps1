# PowerShell script to deploy to Vercel
# Run this from the apps/web directory

Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
try {
    $vercelVersion = vercel --version 2>&1
    Write-Host "✅ Vercel CLI found: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel
}

Write-Host ""
Write-Host "📋 Deployment Checklist:" -ForegroundColor Yellow
Write-Host "  1. Root Directory set to 'apps/web' in Vercel Dashboard" -ForegroundColor Gray
Write-Host "  2. Environment variables configured" -ForegroundColor Gray
Write-Host "  3. Firebase Admin credentials set (GOOGLE_APPLICATION_CREDENTIALS_JSON)" -ForegroundColor Gray
Write-Host ""

$confirm = Read-Host "Continue with deployment? (y/n)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "🔨 Building project..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed. Please fix errors before deploying." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Cyan
vercel --prod

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Verify deployment in Vercel Dashboard" -ForegroundColor Gray
    Write-Host "  2. Test the chat API endpoint" -ForegroundColor Gray
    Write-Host "  3. Check Firestore rules are deployed" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed. Check the errors above." -ForegroundColor Red
    exit 1
}

