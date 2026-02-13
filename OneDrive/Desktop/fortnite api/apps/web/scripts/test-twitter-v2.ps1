# Test Twitter API v2 Ingestion
# Run from project root: .\apps\web\scripts\test-twitter-v2.ps1

Write-Host "Testing Twitter API v2 Ingestion..." -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"

if ($env:NEXT_PUBLIC_APP_URL) {
    $baseUrl = $env:NEXT_PUBLIC_APP_URL
} elseif ($env:VERCEL_URL) {
    $baseUrl = "https://$($env.VERCEL_URL)"
}

$url = "$baseUrl/api/twitter/v2-ingest"

Write-Host "Endpoint: $url" -ForegroundColor Gray
Write-Host ""
Write-Host "This will:" -ForegroundColor Yellow
Write-Host "  1. Fetch latest tweets from Twitter API v2" -ForegroundColor Gray
Write-Host "  2. Filter retweets and replies (API does this)" -ForegroundColor Gray
Write-Host "  3. Process new tweets" -ForegroundColor Gray
Write-Host "  4. Save to Firestore memories collection" -ForegroundColor Gray
Write-Host ""
Write-Host "Starting..." -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $url -Method Get -ContentType "application/json"
    
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Results:" -ForegroundColor Yellow
    $response | ConvertTo-Json -Depth 10
    
    Write-Host ""
    Write-Host "📊 Summary:" -ForegroundColor Cyan
    Write-Host "  Tweets fetched: $($response.summary.tweetsFetched)" -ForegroundColor Gray
    Write-Host "  New tweets processed: $($response.summary.totalProcessed)" -ForegroundColor Green
    
    if ($response.summary.totalErrors -eq 0) {
        Write-Host "  Errors: $($response.summary.totalErrors)" -ForegroundColor Green
    } else {
        Write-Host "  Errors: $($response.summary.totalErrors)" -ForegroundColor Red
    }
    
    Write-Host "  Users tracked: $($response.summary.users)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Note: $($response.summary.note)" -ForegroundColor Gray
    
    if ($response.results) {
        Write-Host ""
        Write-Host "Per-user breakdown:" -ForegroundColor Yellow
        foreach ($user in $response.results.PSObject.Properties) {
            $color = if ($user.Value.errors -eq 0) { "Green" } else { "Red" }
            Write-Host "  $($user.Name):" -ForegroundColor $color
            Write-Host "    Processed: $($user.Value.processed) tweets" -ForegroundColor Green
            Write-Host "    Errors: $($user.Value.errors)" -ForegroundColor $(if ($user.Value.errors -eq 0) { "Green" } else { "Red" })
        }
    }
    
    Write-Host ""
    Write-Host "💡 View ingested tweets:" -ForegroundColor Cyan
    Write-Host "  http://localhost:3000/api/memory/list?source=twitter&limit=20" -ForegroundColor Gray
    Write-Host ""
    Write-Host "⚠️  Free tier limit: 100 tweets/month" -ForegroundColor Yellow
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host ""
            Write-Host "Error Response:" -ForegroundColor Red
            Write-Host $responseBody -ForegroundColor Red
        } catch {
            Write-Host "Could not read error response" -ForegroundColor Red
        }
    }
    exit 1
}

