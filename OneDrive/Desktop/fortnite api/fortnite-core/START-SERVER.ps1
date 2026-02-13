# Start Fortnite API Server
# Simple script to start the server

Write-Host ""
Write-Host "=" * 70 -ForegroundColor Green
Write-Host "STARTING FORTNITE AI SYSTEM" -ForegroundColor Green
Write-Host "=" * 70
Write-Host ""

# Kill any existing Node processes
Write-Host "Stopping any existing servers..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Navigate to API directory
Set-Location "C:\Users\bende\OneDrive\Desktop\fortnite api\fortnite-core\packages\api"

Write-Host ""
Write-Host "Starting API server on port 3000..." -ForegroundColor Cyan
Write-Host ""

# Start the server
npm start

# This will keep running until you press Ctrl+C

