# Upload to Correct Location Script
# This creates the directory first, then uploads files

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fix Upload Location" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "The files were uploaded to the wrong location (root / instead of /home/container/dist/)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Follow these steps:" -ForegroundColor Green
Write-Host ""
Write-Host "1. Connect to SFTP:" -ForegroundColor White
Write-Host "   sftp -P 2022 wrench.00442de6@5.189.154.69" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Once connected, run these commands:" -ForegroundColor White
Write-Host "   mkdir -p /home/container/dist" -ForegroundColor Cyan
Write-Host "   cd /home/container/dist" -ForegroundColor Cyan
Write-Host "   lcd C:\Users\bende\Downloads\archive-2026-01-02T202312+0100\dist" -ForegroundColor Cyan
Write-Host "   put -r *" -ForegroundColor Cyan
Write-Host "   quit" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will upload all files to the correct location." -ForegroundColor Green
Write-Host ""
Write-Host "NOTE: You may also need to move the files that were uploaded to root (/)" -ForegroundColor Yellow
Write-Host "      to the dist folder, or just re-upload everything to the correct location." -ForegroundColor Yellow
Write-Host ""

