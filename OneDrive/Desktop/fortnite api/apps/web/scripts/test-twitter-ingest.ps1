# Test Twitter Ingestion Worker
# Run from project root: .\apps\web\scripts\test-twitter-ingest.ps1

Write-Host "🔄 Testing Twitter Ingestion Worker..." -ForegroundColor Cyan

$baseUrl = "http://localhost:3000"

if ($env:NEXT_PUBLIC_APP_URL) {
    $baseUrl = $env:NEXT_PUBLIC_APP_URL
} elseif ($env:VERCEL_URL) {
    $baseUrl = "https://$($env:VERCEL_URL)"
}

$url = "$baseUrl/api/twitter/ingest"

Write-Host "📍 Endpoint: $url" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $url -Method Get -ContentType "application/json"
    
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Results:" -ForegroundColor Yellow
    $response | ConvertTo-Json -Depth 10
    
    Write-Host ""
    Write-Host "📊 Summary:" -ForegroundColor Cyan
    Write-Host "  Processed: $($response.summary.totalProcessed) tweets" -ForegroundColor Green
    Write-Host "  Errors: $($response.summary.totalErrors)" -ForegroundColor $(if ($response.summary.totalErrors -eq 0) { "Green" } else { "Red" })
    Write-Host "  Users: $($response.summary.users)" -ForegroundColor Gray
    
    if ($response.results) {
        Write-Host ""
        Write-Host "Per-user breakdown:" -ForegroundColor Yellow
        foreach ($user in $response.results.PSObject.Properties) {
            Write-Host "  $($user.Name): $($user.Value.processed) processed, $($user.Value.errors) errors"
        }
    }
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
    exit 1
}

Write-Host ""
Write-Host "💡 To verify in Firestore:" -ForegroundColor Cyan
Write-Host "  1. Check 'memories' collection for ingested tweets" -ForegroundColor Gray
Write-Host "  2. Check 'twitter_last_tweet' collection for last processed tweet ID" -ForegroundColor Gray

