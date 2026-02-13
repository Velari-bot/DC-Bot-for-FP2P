# Test Twitter Ingestion Worker
# Run from project root: .\scripts\test-twitter-ingest.ps1

Write-Host "Testing Twitter Ingestion Worker..." -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"

if ($env:NEXT_PUBLIC_APP_URL) {
    $baseUrl = $env:NEXT_PUBLIC_APP_URL
} elseif ($env:VERCEL_URL) {
    $baseUrl = "https://$($env.VERCEL_URL)"
}

$url = "$baseUrl/api/twitter/ingest"

Write-Host "Endpoint: $url" -ForegroundColor Gray
Write-Host ""
Write-Host "This will:" -ForegroundColor Yellow
Write-Host "  1. Start Apify actor to fetch tweets" -ForegroundColor Gray
Write-Host "  2. Wait for completion (~30-60 seconds)" -ForegroundColor Gray
Write-Host "  3. Process new tweets" -ForegroundColor Gray
Write-Host "  4. Save to Firestore memories collection" -ForegroundColor Gray
Write-Host ""
Write-Host "Starting..." -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $url -Method Get -ContentType "application/json"
    
    Write-Host "Success!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Results:" -ForegroundColor Yellow
    $response | ConvertTo-Json -Depth 10
    
    Write-Host ""
    Write-Host "Summary:" -ForegroundColor Cyan
    Write-Host "  Tweets fetched from Apify: $($response.summary.tweetsFetched)" -ForegroundColor Gray
    Write-Host "  New tweets processed: $($response.summary.totalProcessed)" -ForegroundColor Green
    Write-Host "  Errors: $($response.summary.totalErrors)" -ForegroundColor $(if ($response.summary.totalErrors -eq 0) { "Green" } else { "Red" })
    Write-Host "  Users tracked: $($response.summary.users)" -ForegroundColor Gray
    
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
    Write-Host "View ingested tweets:" -ForegroundColor Cyan
    Write-Host "  http://localhost:3000/api/memory/list?source=twitter`&limit=20" -ForegroundColor Gray
    Write-Host ""
    Write-Host "View tweets by user:" -ForegroundColor Cyan
    Write-Host "  osirion_gg: http://localhost:3000/api/memory/list?source=twitter`&author=osirion_gg`&limit=10" -ForegroundColor Gray
    Write-Host "  KinchAnalytics: http://localhost:3000/api/memory/list?source=twitter`&author=KinchAnalytics`&limit=10" -ForegroundColor Gray
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
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

Write-Host ""
Write-Host "Check Firestore (if you have access):" -ForegroundColor Cyan
Write-Host "  1. Go to: https://console.firebase.google.com/project/pathgen-v2/firestore" -ForegroundColor Gray
Write-Host "  2. Check 'memories' collection for ingested tweets" -ForegroundColor Gray
Write-Host "  3. Check 'twitter_last_tweet' collection for last processed tweet IDs" -ForegroundColor Gray
