# Test if the API server is responding
Write-Host "Testing API server on port 4000..." -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri "http://localhost:4000/health" -Method GET -TimeoutSec 5
    Write-Host "✅ Server is responding!" -ForegroundColor Green
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Server is NOT responding" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure the server is running:" -ForegroundColor Yellow
    Write-Host "  cd packages/papi" -ForegroundColor Yellow
    Write-Host "  npm run dev" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Testing chat endpoint..." -ForegroundColor Cyan
try {
    $body = @{
        query = "test"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "http://localhost:4000/api/chat" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 10
    Write-Host "✅ Chat endpoint is working!" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Chat endpoint failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

