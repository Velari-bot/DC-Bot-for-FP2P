# Start dev server and test Twitter ingestion

Write-Host "Starting Next.js dev server..." -ForegroundColor Cyan
Write-Host ""

$job = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npm run dev 2>&1 | ForEach-Object { Write-Output $_ }
}

Write-Host "Waiting for server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

$maxWait = 30
$waited = 0
$serverReady = $false

while ($waited -lt $maxWait) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -ErrorAction Stop
        $serverReady = $true
        break
    } catch {
        Start-Sleep -Seconds 2
        $waited += 2
        Write-Host "." -NoNewline -ForegroundColor Gray
    }
}

Write-Host ""

if ($serverReady) {
    Write-Host "✅ Server is ready!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Now testing Twitter ingestion..." -ForegroundColor Cyan
    Write-Host ""
    
    & "C:\Users\bende\OneDrive\Desktop\fortnite api\scripts\test-twitter-ingest.ps1"
} else {
    Write-Host "❌ Server did not start in time" -ForegroundColor Red
    Write-Host "Check the job output:" -ForegroundColor Yellow
    Receive-Job $job
    Stop-Job $job
    Remove-Job $job
}

