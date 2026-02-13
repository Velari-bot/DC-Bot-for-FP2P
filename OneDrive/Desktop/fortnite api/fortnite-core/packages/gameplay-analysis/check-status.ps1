# Script to check the status of an analysis job

param(
    [Parameter(Mandatory=$true)]
    [string]$JobId
)

$API_URL = "http://localhost:3001/api/analyze/$JobId"

Write-Host "🔍 Checking analysis status for job: $JobId" -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $API_URL -Method GET
    
    Write-Host "Status: $($response.status)" -ForegroundColor $(if ($response.status -eq "complete") { "Green" } else { "Yellow" })
    Write-Host ""
    
    if ($response.status -eq "complete") {
        Write-Host "✅ Analysis Complete!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Summary:" -ForegroundColor Cyan
        Write-Host $response.analysis.summary -ForegroundColor White
        Write-Host ""
        Write-Host "Insights:" -ForegroundColor Cyan
        foreach ($insight in $response.analysis.insights) {
            Write-Host "  • $insight" -ForegroundColor White
        }
        Write-Host ""
        Write-Host "Drills:" -ForegroundColor Cyan
        foreach ($drill in $response.analysis.drills) {
            Write-Host "  • $($drill.title) ($($drill.difficulty))" -ForegroundColor White
            Write-Host "    $($drill.description)" -ForegroundColor Gray
        }
        Write-Host ""
        Write-Host "Metrics:" -ForegroundColor Cyan
        $response.analysis.metrics | ConvertTo-Json | Write-Host -ForegroundColor White
    } elseif ($response.status -eq "processing") {
        Write-Host "⏳ Analysis is still processing..." -ForegroundColor Yellow
        Write-Host "Run this script again in a few seconds to check status." -ForegroundColor Gray
    } else {
        Write-Host "📋 Job is queued, waiting to be processed..." -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Error checking status:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

