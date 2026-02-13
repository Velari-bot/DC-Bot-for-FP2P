# PowerShell script to set users as admin by UID
# Run from the root directory

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Set Users as Admin" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# User IDs to set as admin
$userIds = @("saltyzfn", "crl_coach")

Write-Host "Setting the following users as admin:" -ForegroundColor Yellow
foreach ($userId in $userIds) {
    Write-Host "  - $userId" -ForegroundColor Gray
}
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "apps/web/scripts/set-multiple-admins.ts")) {
    Write-Host "[ERROR] Script not found. Make sure you're in the project root." -ForegroundColor Red
    exit 1
}

# Change to apps/web directory
Push-Location "apps/web"

try {
    Write-Host "Running admin setup script..." -ForegroundColor Yellow
    Write-Host ""
    
    # Check if .env.local exists and load it
    if (Test-Path ".env.local") {
        Write-Host "[INFO] Loading environment variables from .env.local..." -ForegroundColor Yellow
        Get-Content ".env.local" | ForEach-Object {
            if ($_ -match '^([^#][^=]+)=(.*)$') {
                $key = $matches[1].Trim()
                $value = $matches[2].Trim()
                [Environment]::SetEnvironmentVariable($key, $value, "Process")
            }
        }
    } else {
        Write-Host "[WARNING] .env.local not found. Firebase credentials may not be loaded." -ForegroundColor Yellow
        Write-Host "[INFO] If you see credential errors, run: apps/web/setup-local-firebase.ps1" -ForegroundColor Gray
        Write-Host ""
    }
    
    # Run the Node.js script
    # Pass each UID as a separate argument
    node scripts/set-multiple-admins.js $userIds
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "[SUCCESS] Admin setup completed!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "[ERROR] Admin setup failed. Check the output above." -ForegroundColor Red
        exit 1
    }
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Users should log out and log back in" -ForegroundColor Gray
Write-Host "  2. They can now access /admin dashboard" -ForegroundColor Gray
Write-Host "  3. Check Firestore to verify isAdmin: true and role: 'owner'" -ForegroundColor Gray
Write-Host ""

