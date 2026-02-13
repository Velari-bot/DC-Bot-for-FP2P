# PowerShell script to send launch announcement email
# Usage: .\send-launch-email.ps1 -Token "YOUR_FIREBASE_TOKEN" [-TestMode] [-To "email1@example.com", "email2@example.com"]

param(
    [Parameter(Mandatory=$true)]
    [string]$Token,
    
    [Parameter(Mandatory=$false)]
    [switch]$TestMode,
    
    [Parameter(Mandatory=$false)]
    [string[]]$To
)

$url = "https://pathgen.dev/api/email/send-launch-announcement"

# Build request body
$body = @{}

if ($TestMode) {
    $body.testMode = $true
    Write-Host "🧪 Test mode enabled - will send to test email only" -ForegroundColor Yellow
} elseif ($To) {
    $body.to = $To
    Write-Host "📧 Sending to specific emails: $($To -join ', ')" -ForegroundColor Cyan
} else {
    Write-Host "📬 Sending to ALL users with email addresses" -ForegroundColor Green
}

$bodyJson = $body | ConvertTo-Json

# Set headers
$headers = @{
    "Authorization" = "Bearer $Token"
    "Content-Type" = "application/json"
}

Write-Host ""
Write-Host "🚀 Sending launch announcement email..." -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $bodyJson -ContentType "application/json"
    
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Message: $($response.message)" -ForegroundColor White
    Write-Host "Total recipients: $($response.stats.total)" -ForegroundColor White
    Write-Host "Sent: $($response.stats.sent)" -ForegroundColor Green
    Write-Host "Failed: $($response.stats.failed)" -ForegroundColor $(if ($response.stats.failed -gt 0) { "Red" } else { "Gray" })
    
    if ($response.errors -and $response.errors.Count -gt 0) {
        Write-Host ""
        Write-Host "⚠️ Errors:" -ForegroundColor Yellow
        foreach ($errorItem in $response.errors) {
            Write-Host "  - $errorItem" -ForegroundColor Red
        }
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error sending email:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "Details: $($errorDetails.error)" -ForegroundColor Red
    }
    
    exit 1
}

Write-Host ""
Write-Host "✨ Done!" -ForegroundColor Green

