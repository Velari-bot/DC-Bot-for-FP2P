# Test Chat Endpoint
# Simple PowerShell script to test the AI chat

Write-Host "Testing Fortnite AI Chat Endpoint" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if server is running
Write-Host "1. Checking server status..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3000/health"
    Write-Host "   [OK] Server is running ($($health.status))" -ForegroundColor Green
} catch {
    Write-Host "   [ERROR] Server is not running! Start it with: npm start" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Check tweet data
Write-Host "2. Checking tweet data..." -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "http://localhost:3000/api/tweet-stats"
    Write-Host "   [OK] Found $($stats.total) tweets" -ForegroundColor Green
    Write-Host "   Data by user:" -ForegroundColor Cyan
    $stats.byUser.PSObject.Properties | ForEach-Object {
        Write-Host "      - $($_.Name): $($_.Value) tweets" -ForegroundColor Gray
    }
} catch {
    Write-Host "   [WARN] Could not load tweet stats: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# Test 3: Test data endpoint
Write-Host "3. Testing /api/data endpoint..." -ForegroundColor Yellow
try {
    $data = Invoke-RestMethod -Uri "http://localhost:3000/api/data?limit=5"
    if ($data.data.Count -gt 0) {
        Write-Host "   [OK] Found $($data.total) total ingested records" -ForegroundColor Green
        Write-Host "   Latest 3:" -ForegroundColor Cyan
        $data.data | Select-Object -First 3 | ForEach-Object {
            Write-Host "      - [$($_.source)] $($_.title)" -ForegroundColor Gray
        }
    } else {
        Write-Host "   [INFO] No ingested data yet. Run: npm run ingest" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   [INFO] Data endpoint not ready: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# Test 4: Test chat endpoint
Write-Host "4. Testing AI chat endpoint..." -ForegroundColor Yellow

$queries = @(
    "What tournaments are scheduled?",
    "What did Osirion tweet about weapon changes?"
)

foreach ($query in $queries) {
    Write-Host ""
    Write-Host "   Query: $query" -ForegroundColor Cyan
    
    $body = @{
        query = $query
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3000/api/chat" `
            -Method POST `
            -ContentType "application/json" `
            -Body $body `
            -TimeoutSec 30
        
        Write-Host "   [OK] Response received!" -ForegroundColor Green
        Write-Host ""
        Write-Host "   AI Response:" -ForegroundColor White
        Write-Host "   $($response.response)" -ForegroundColor Gray
        
        if ($response.sources -and $response.sources.Count -gt 0) {
            Write-Host ""
            Write-Host "   Sources ($($response.sources.Count)):" -ForegroundColor Cyan
            $response.sources | Select-Object -First 3 | ForEach-Object {
                $score = [math]::Round($_.relevance_score, 2)
                Write-Host "      - @$($_.author) (score: $score)" -ForegroundColor Gray
                $preview = $_.content.Substring(0, [Math]::Min(80, $_.content.Length))
                Write-Host "        $preview..." -ForegroundColor DarkGray
            }
        }
    } catch {
        Write-Host "   [ERROR] $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            $errorObj = $_.ErrorDetails.Message | ConvertFrom-Json
            Write-Host "   Details: $($errorObj.error)" -ForegroundColor DarkRed
        }
    }
    
    Write-Host ""
    Write-Host "   ------------------------------------------------------------" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "Testing complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Tip: If you see limited AI responses, add OPENAI_API_KEY to your .env file" -ForegroundColor Yellow
Write-Host "Tip: Run data ingestion: cd packages/data-ingestion && npm run ingest:once" -ForegroundColor Yellow
