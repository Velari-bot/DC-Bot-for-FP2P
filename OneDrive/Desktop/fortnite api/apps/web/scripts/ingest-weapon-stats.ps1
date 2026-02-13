# PowerShell script to ingest weapon stats
# This script calls the API endpoint to ingest weapon statistics

Write-Host "Starting weapon stats ingestion..." -ForegroundColor Green
Write-Host ""

# Get the base URL
$baseUrl = $env:NEXT_PUBLIC_APP_URL
if (-not $baseUrl) {
    if ($env:VERCEL_URL) {
        $baseUrl = "https://$env:VERCEL_URL"
    } else {
        $baseUrl = "http://localhost:3000"
    }
}

Write-Host "Calling API endpoint: $baseUrl/api/weapons/stats" -ForegroundColor Cyan
Write-Host ""

try
{
    $response = Invoke-RestMethod -Uri "$baseUrl/api/weapons/stats" -Method POST -ContentType "application/json"
    
    Write-Host "Ingestion completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Summary:" -ForegroundColor Cyan
    Write-Host "   Total weapons: $($response.summary.total)" -ForegroundColor White
    Write-Host "   Processed: $($response.summary.processed)" -ForegroundColor Green
    
    $errorColor = "White"
    if ($response.summary.errors -gt 0)
    {
        $errorColor = "Red"
    }
    Write-Host "   Errors: $($response.summary.errors)" -ForegroundColor $errorColor
    Write-Host ""
    Write-Host $response.message -ForegroundColor Green
}
catch
{
    Write-Host "Ingestion failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message)
    {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    exit 1
}
