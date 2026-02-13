$headers = @{
    "Content-Type" = "application/json"
    "X-Worker-Secret" = "fp2p_super_secret_2026"
}
$body1 = '{"videoId": "verifier_direct_03", "videoUrl": "https://pub-939e6a256df8497fa52331518e22780e.r2.dev/videos/test.mp4", "language": "en"}'
$body2 = '{"videoId": "verifier_vercel_03", "videoUrl": "https://pub-939e6a256df8497fa52331518e22780e.r2.dev/videos/test.mp4", "language": "en"}'

Write-Host "--- TEST 1: Direct Worker Probe CHECK ---"
try {
    $r = Invoke-RestMethod -Uri "http://66.135.7.53:3000/process" -Method POST -Headers $headers -Body $body1 -TimeoutSec 10
    Write-Host "DIRECT SUCCESS: $($r | ConvertTo-Json -Depth 2)"
} catch {
    Write-Host "DIRECT FAILED: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "BODY: $($reader.ReadToEnd())"
    }
}

Write-Host "`n--- TEST 2: Vercel API Probe CHECK ---"
try {
    $r = Invoke-RestMethod -Uri "https://www.fortnitepathtopro.com/api/captions?action=start" -Method POST -ContentType "application/json" -Body $body2 -TimeoutSec 15
    Write-Host "VERCEL SUCCESS: $($r | ConvertTo-Json -Depth 2)"
} catch {
    Write-Host "VERCEL FAILED: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "VERCEL ERROR BODY: $($reader.ReadToEnd())"
    }
}
