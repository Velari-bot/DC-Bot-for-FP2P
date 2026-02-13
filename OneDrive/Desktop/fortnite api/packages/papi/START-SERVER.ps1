# PowerShell script to start the API server on port 4000
$env:PORT = '4000'
Write-Host "🚀 Starting API server on port 4000..." -ForegroundColor Green
npm run dev

