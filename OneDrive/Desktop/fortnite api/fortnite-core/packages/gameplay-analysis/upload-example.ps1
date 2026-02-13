# Example script to upload a replay file to the Gameplay Analysis service

# Configuration
$API_URL = "http://localhost:3001/api/analyze"
$REPLAY_FILE = "C:\path\to\your\replay.replay"  # Change this to your replay file path
$PLAYER_ID = "player123"  # Change this to your player ID
$TYPE = "replay"  # or "clip" for video files

# Check if file exists
if (-not (Test-Path $REPLAY_FILE)) {
    Write-Host "Error: File not found: $REPLAY_FILE" -ForegroundColor Red
    Write-Host "Please update the `$REPLAY_FILE variable with the correct path." -ForegroundColor Yellow
    exit 1
}

Write-Host "Uploading replay file..." -ForegroundColor Cyan
Write-Host "   File: $REPLAY_FILE" -ForegroundColor Gray
Write-Host "   Player: $PLAYER_ID" -ForegroundColor Gray
Write-Host "   Type: $TYPE" -ForegroundColor Gray
Write-Host ""

try {
    # Upload the file
    $response = Invoke-RestMethod -Uri $API_URL -Method POST -Form @{
        file = Get-Item $REPLAY_FILE
        playerId = $PLAYER_ID
        type = $TYPE
    }
    
    Write-Host "Upload successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Job ID: $($response.job_id)" -ForegroundColor Yellow
    Write-Host "Status: $($response.status)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To check the analysis status, run:" -ForegroundColor Cyan
    Write-Host "  Invoke-RestMethod -Uri http://localhost:3001/api/analyze/$($response.job_id)" -ForegroundColor White
    Write-Host ""
    
    # Save job ID for later use
    $response | ConvertTo-Json | Out-File -FilePath "job-info.json" -Encoding UTF8
    Write-Host "Job info saved to job-info.json" -ForegroundColor Gray
    
} catch {
    Write-Host "Error uploading file:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}
