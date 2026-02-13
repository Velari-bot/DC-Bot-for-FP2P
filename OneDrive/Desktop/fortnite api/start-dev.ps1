# PathGen v2 - Development Startup Script
# Starts both API and Web servers in separate PowerShell windows

Write-Host "🚀 Starting PathGen v2 Development Servers..." -ForegroundColor Green

# Start API Server
Write-Host "📡 Starting API server on port 4000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\packages\papi'; `$env:PORT='4000'; Write-Host 'API Server starting on http://localhost:4000' -ForegroundColor Green; npm run dev"

# Wait a moment for API to start
Start-Sleep -Seconds 2

# Start Web Server
Write-Host "🌐 Starting Web server on port 3000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\apps\web'; `$env:NEXT_PUBLIC_API_URL='http://localhost:4000'; Write-Host 'Web Server starting on http://localhost:3000' -ForegroundColor Green; npx next dev -p 3000"

Write-Host "✅ Both servers are starting in separate windows!" -ForegroundColor Green
Write-Host "📡 API: http://localhost:4000" -ForegroundColor Yellow
Write-Host "🌐 Web: http://localhost:3000" -ForegroundColor Yellow

