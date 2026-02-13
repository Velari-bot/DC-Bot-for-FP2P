$headers = @{
    "Content-Type" = "application/json"
    "X-Worker-Secret" = "fp2p_super_secret_2026"
}
$body = '{"videoId": "probe_id_verification", "videoUrl": "https://pub-939e6a256df8497fa52331518e22780e.r2.dev/videos/test.mp4", "language": "en"}'

Write-Host "--- TEST 1: Direct Worker Probe ---"
try {
    $r = Invoke-RestMethod -Uri "http://66.135.7.53:3000/process" -Method POST -Headers $headers -Body $body -TimeoutSec 10
    Write-Host "DIRECT SUCCESS: $($r | ConvertTo-Json -Depth 2)"
} catch {
    Write-Host "DIRECT FAILED: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "BODY: $($reader.ReadToEnd())"
    }
}

Write-Host "`n--- TEST 2: Vercel API Probe ---"
try {
    $r = Invoke-RestMethod -Uri "https://www.fortnitepathtopro.com/api/captions?action=start" -Method POST -ContentType "application/json" -Body $body -TimeoutSec 15
    Write-Host "VERCEL SUCCESS: $($r | ConvertTo-Json -Depth 2)"
} catch {
    Write-Host "VERCEL FAILED: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "BODY: $($reader.ReadToEnd())"
    }
}
