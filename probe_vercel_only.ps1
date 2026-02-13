$headers = @{ "Content-Type" = "application/json" }
$body = '{"videoId": "verifier_vercel_ONLY", "videoUrl": "https://pub-939e6a256df8497fa52331518e22780e.r2.dev/videos/test.mp4", "language": "en"}'

try {
    Write-Host "Probing Vercel API..."
    $r = Invoke-RestMethod -Uri "https://www.fortnitepathtopro.com/api/captions?action=start" -Method POST -Headers $headers -Body $body -TimeoutSec 15
    Write-Host "SUCCESS: $($r | ConvertTo-Json -Depth 5)"
} catch {
    Write-Host "FAILED: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "ERROR BODY: $($reader.ReadToEnd())"
    } else {
        Write-Host "NO RESPONSE BODY"
    }
}
