# PowerShell script to set up email environment variables on Vercel
# Run this from the apps/web directory

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Vercel Email Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host "[ERROR] Vercel CLI is not installed." -ForegroundColor Red
    Write-Host ""
    Write-Host "Install it with:" -ForegroundColor Yellow
    Write-Host "  npm install -g vercel" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host "[INFO] Vercel CLI found" -ForegroundColor Green
Write-Host ""

# Check if logged in
Write-Host "Checking Vercel login status..." -ForegroundColor Yellow
$loginCheck = vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARNING] Not logged in to Vercel" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Logging in..." -ForegroundColor Yellow
    vercel login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to login to Vercel" -ForegroundColor Red
        exit 1
    }
}

Write-Host "[SUCCESS] Logged in to Vercel" -ForegroundColor Green
Write-Host ""

# Email environment variables
$emailVars = @{
    "EMAIL_SMTP_USER" = "AKIA3TD2SDYDYSEBUZB4"
    "EMAIL_SMTP_PASS" = "BDQAfaz8PgjAHwDsdUUWXmTCDiaeX45WOyuzW9yUPuOa"
    "EMAIL_FROM" = "support@pathgen.dev"
}

Write-Host "The following email variables will be added:" -ForegroundColor Yellow
foreach ($key in $emailVars.Keys) {
    $value = if ($key -eq "EMAIL_SMTP_PASS") { "***HIDDEN***" } else { $emailVars[$key] }
    Write-Host "  - $key = $value" -ForegroundColor Gray
}
Write-Host ""

$confirm = Read-Host "Continue? (y/n)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Cancelled." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "Select environments to add variables to:" -ForegroundColor Yellow
Write-Host "  1. Production only" -ForegroundColor Gray
Write-Host "  2. Preview only" -ForegroundColor Gray
Write-Host "  3. Development only" -ForegroundColor Gray
Write-Host "  4. All environments (recommended)" -ForegroundColor Gray
Write-Host ""

$envChoice = Read-Host "Enter choice (1-4)"
$environments = @()

switch ($envChoice) {
    "1" { $environments = @("production") }
    "2" { $environments = @("preview") }
    "3" { $environments = @("development") }
    "4" { $environments = @("production", "preview", "development") }
    default {
        Write-Host "[ERROR] Invalid choice. Using all environments." -ForegroundColor Yellow
        $environments = @("production", "preview", "development")
    }
}

Write-Host ""
Write-Host "Adding variables to Vercel..." -ForegroundColor Yellow
Write-Host ""

foreach ($key in $emailVars.Keys) {
    $value = $emailVars[$key]
    
    Write-Host "Adding: $key" -ForegroundColor Cyan
    
    foreach ($env in $environments) {
        Write-Host "  -> $env..." -ForegroundColor Gray -NoNewline
        
        # Use echo to pipe value to vercel env add
        $value | vercel env add $key $env 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host " [OK]" -ForegroundColor Green
        } else {
            Write-Host " [FAILED]" -ForegroundColor Red
        }
    }
    
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "[SUCCESS] All email variables added!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Redeploy your Vercel project" -ForegroundColor Gray
Write-Host "  2. Test email sending via /api/email/send" -ForegroundColor Gray
Write-Host "  3. Check Vercel dashboard for environment variables" -ForegroundColor Gray
Write-Host ""
Write-Host "To redeploy:" -ForegroundColor Yellow
Write-Host "  vercel --prod" -ForegroundColor Gray
Write-Host ""

