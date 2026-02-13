# PowerShell script to add email environment variables to Vercel
# Run this from the apps/web directory
# 
# NOTE: This script is deprecated. Use setup-vercel-email.ps1 instead.

Write-Host "[WARNING] This script is deprecated." -ForegroundColor Yellow
Write-Host "Use setup-vercel-email.ps1 instead for better functionality." -ForegroundColor Yellow
Write-Host ""
Write-Host "Running setup-vercel-email.ps1..." -ForegroundColor Cyan
Write-Host ""

& "$PSScriptRoot\setup-vercel-email.ps1"

