# Simple PowerShell script to send launch announcement email via AWS SES
# This script sends the email directly using SES credentials (no API authentication needed)
# Usage: .\send-launch-email-simple.ps1 [-TestEmail "test@example.com"] [-To "email1@example.com", "email2@example.com"]

param(
    [Parameter(Mandatory=$false)]
    [string]$TestEmail,
    
    [Parameter(Mandatory=$false)]
    [string[]]$To
)

# Load environment variables or set them here
$smtpUser = $env:EMAIL_SMTP_USER
$smtpPass = $env:EMAIL_SMTP_PASS
$fromEmail = $env:EMAIL_FROM
$fromName = $env:EMAIL_FROM_NAME

if (-not $smtpUser -or -not $smtpPass) {
    Write-Host "❌ Error: EMAIL_SMTP_USER and EMAIL_SMTP_PASS must be set as environment variables" -ForegroundColor Red
    Write-Host ""
    Write-Host "Set them in PowerShell:" -ForegroundColor Yellow
    Write-Host '  $env:EMAIL_SMTP_USER = "your_smtp_username"' -ForegroundColor Gray
    Write-Host '  $env:EMAIL_SMTP_PASS = "your_smtp_password"' -ForegroundColor Gray
    Write-Host '  $env:EMAIL_FROM = "no-reply@pathgen.dev"' -ForegroundColor Gray
    Write-Host '  $env:EMAIL_FROM_NAME = "PathGen"' -ForegroundColor Gray
    exit 1
}

if (-not $fromEmail) {
    $fromEmail = "no-reply@pathgen.dev"
}

if (-not $fromName) {
    $fromName = "PathGen"
}

# Load HTML email template
$templatePath = Join-Path $PSScriptRoot "public\launch-email.html"
if (-not (Test-Path $templatePath)) {
    Write-Host "❌ Error: Email template not found at: $templatePath" -ForegroundColor Red
    exit 1
}

$htmlContent = Get-Content $templatePath -Raw

# Extract body content from HTML (remove DOCTYPE, html, head tags for email clients)
# Keep the full HTML structure for better email client compatibility
if ($htmlContent -match '<body[^>]*>([\s\S]*?)</body>') {
    # Wrap in a simple HTML structure for email clients
    $bodyContent = $matches[1]
    $htmlContent = @"
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
$bodyContent
</body>
</html>
"@
}

# Determine recipients
$recipients = @()

if ($TestEmail) {
    $recipients = @($TestEmail)
    Write-Host "🧪 Test mode - sending to: $TestEmail" -ForegroundColor Yellow
} elseif ($To) {
    $recipients = $To
    Write-Host "📧 Sending to specific emails: $($To -join ', ')" -ForegroundColor Cyan
} else {
    Write-Host "❌ Error: Must specify either -TestEmail or -To parameter" -ForegroundColor Red
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host '  .\send-launch-email-simple.ps1 -TestEmail "test@example.com"' -ForegroundColor Gray
    Write-Host '  .\send-launch-email-simple.ps1 -To "email1@example.com", "email2@example.com"' -ForegroundColor Gray
    exit 1
}

# Create plain text version (simple conversion)
$textContent = $htmlContent -replace '<[^>]+>', '' -replace '\s+', ' ' -replace '&nbsp;', ' ' -replace '&amp;', '&' -replace '&lt;', '<' -replace '&gt;', '>'

# Send emails using .NET MailMessage and SmtpClient
Add-Type -AssemblyName System.Net
Add-Type -AssemblyName System.Net.Mail

$smtpHost = "email-smtp.us-east-2.amazonaws.com"
$smtpPort = 587

Write-Host ""
Write-Host "🚀 Sending launch announcement email via AWS SES..." -ForegroundColor Cyan
Write-Host "From: $fromName <$fromEmail>" -ForegroundColor Gray
Write-Host "Recipients: $($recipients.Count)" -ForegroundColor Gray
Write-Host ""

$sent = 0
$failed = 0
$errors = @()

foreach ($recipient in $recipients) {
    try {
        $mailMessage = New-Object System.Net.Mail.MailMessage
        $mailMessage.From = New-Object System.Net.Mail.MailAddress($fromEmail, $fromName)
        $mailMessage.To.Add($recipient)
        $mailMessage.Subject = "🚀 PathGen Launch Tomorrow! Get 1 Month FREE"
        $mailMessage.Body = $textContent
        $mailMessage.IsBodyHtml = $true
        $mailMessage.AlternateViews.Add([System.Net.Mail.AlternateView]::CreateAlternateViewFromString($textContent, $null, "text/plain"))
        $mailMessage.AlternateViews.Add([System.Net.Mail.AlternateView]::CreateAlternateViewFromString($htmlContent, $null, "text/html"))
        
        $smtpClient = New-Object System.Net.Mail.SmtpClient($smtpHost, $smtpPort)
        $smtpClient.EnableSsl = $true
        $smtpClient.Credentials = New-Object System.Net.NetworkCredential($smtpUser, $smtpPass)
        
        $smtpClient.Send($mailMessage)
        
        $sent++
        Write-Host "✅ Sent to: $recipient" -ForegroundColor Green
        
        # Small delay between emails
        Start-Sleep -Milliseconds 200
        
        $mailMessage.Dispose()
        $smtpClient.Dispose()
    } catch {
        $failed++
        $errorMsg = "Failed to send to $recipient : $($_.Exception.Message)"
        $errors += $errorMsg
        Write-Host "❌ $errorMsg" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✨ Done!" -ForegroundColor Green
Write-Host "Sent: $sent" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Gray" })

if ($errors.Count -gt 0) {
    Write-Host ""
    Write-Host "⚠️ Errors:" -ForegroundColor Yellow
    foreach ($errorItem in $errors) {
        Write-Host "  - $errorItem" -ForegroundColor Red
    }
}

