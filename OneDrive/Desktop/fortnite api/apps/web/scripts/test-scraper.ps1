# Test Twitter Scraper
# Run from project root: .\apps\web\scripts\test-scraper.ps1

Write-Host "Testing Python Twitter Scraper..." -ForegroundColor Cyan
Write-Host ""

$scriptPath = Join-Path $PSScriptRoot "simple_scraper.py"

if (-not (Test-Path $scriptPath)) {
    Write-Host "❌ Scraper script not found: $scriptPath" -ForegroundColor Red
    exit 1
}

Write-Host "Running: python $scriptPath" -ForegroundColor Gray
Write-Host ""

try {
    $output = python $scriptPath 2>&1
    Write-Host $output
    
    # Try to parse JSON output
    $jsonOutput = $output | Select-String -Pattern '\{.*\}' | ForEach-Object { $_.Matches.Value }
    if ($jsonOutput) {
        Write-Host ""
        Write-Host "✅ Scraper completed!" -ForegroundColor Green
        $result = $jsonOutput | ConvertFrom-Json
        if ($result.success) {
            Write-Host "Tweets scraped:" -ForegroundColor Cyan
            foreach ($user in $result.tweets.PSObject.Properties) {
                Write-Host "  $($user.Name): $($user.Value.Count) tweets" -ForegroundColor Gray
            }
        } else {
            Write-Host "❌ Error: $($result.error)" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "❌ Error running scraper: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "💡 Next: Test via API endpoint:" -ForegroundColor Cyan
Write-Host "  http://localhost:3000/api/twitter/scrape" -ForegroundColor Gray

