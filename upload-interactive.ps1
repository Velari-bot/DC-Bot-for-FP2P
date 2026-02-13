# Interactive SFTP Upload Script
# This script guides you through uploading files interactively

$sftpHost = "5.189.154.69"
$sftpPort = "2022"
$sftpUser = "wrench.00442de6"
$localDistPath = ".\dist"
$remotePath = "/home/container/dist"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Interactive SFTP Upload" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if dist folder exists
if (-not (Test-Path $localDistPath)) {
    Write-Host "ERROR: dist folder not found!" -ForegroundColor Red
    Write-Host "Please run 'npm run build' first." -ForegroundColor Red
    exit 1
}

# Verify images are present
$pfpCount = (Get-ChildItem -Path "$localDistPath\pfps" -File -ErrorAction SilentlyContinue).Count
$achievementCount = (Get-ChildItem -Path "$localDistPath\achievements" -File -ErrorAction SilentlyContinue).Count
$thumbnailCount = (Get-ChildItem -Path "$localDistPath\thumbnails" -File -ErrorAction SilentlyContinue).Count

Write-Host "Build Verification:" -ForegroundColor Green
Write-Host "  ✓ Profile pictures: $pfpCount files" -ForegroundColor Green
Write-Host "  ✓ Achievements: $achievementCount files" -ForegroundColor Green
Write-Host "  ✓ Thumbnails: $thumbnailCount files" -ForegroundColor Green
Write-Host ""

if ($pfpCount -eq 0 -or $achievementCount -eq 0 -or $thumbnailCount -eq 0) {
    Write-Host "WARNING: Some image folders are empty!" -ForegroundColor Yellow
    Write-Host "Please run 'npm run build' to rebuild." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "This script will create SFTP commands for you to run manually." -ForegroundColor Yellow
Write-Host ""

# Create the SFTP command file
$absoluteDistPath = (Resolve-Path $localDistPath).Path
$commandFile = "sftp_upload_commands.txt"

Write-Host "Creating SFTP command file..." -ForegroundColor Green

# Build commands to upload all files
$commands = "-mkdir /home/container`n"
$commands += "-mkdir /home/container/dist`n"
$commands += "cd $remotePath`n"
$commands += "lcd `"$absoluteDistPath`"`n"

# Upload files recursively using put -r (if supported) or individual files
$allFiles = Get-ChildItem -Path $localDistPath -Recurse -File
$fileCount = $allFiles.Count

Write-Host "Found $fileCount files to upload" -ForegroundColor Green

# Try using put -r first (works on some SFTP servers)
$commands += "put -r *`n"
$commands += "quit`n"

$commands | Out-File -FilePath $commandFile -Encoding ASCII

Write-Host "Command file created: $commandFile" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "UPLOAD INSTRUCTIONS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 1: Interactive SFTP (Recommended)" -ForegroundColor Yellow
Write-Host "1. Run this command:" -ForegroundColor White
Write-Host "   sftp -P $sftpPort $sftpUser@$sftpHost" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Enter your password when prompted" -ForegroundColor White
Write-Host ""
Write-Host "3. Once connected, run these commands:" -ForegroundColor White
Write-Host "   -mkdir /home/container" -ForegroundColor Cyan
Write-Host "   -mkdir /home/container/dist" -ForegroundColor Cyan
Write-Host "   cd $remotePath" -ForegroundColor Cyan
Write-Host "   lcd `"$absoluteDistPath`"" -ForegroundColor Cyan
Write-Host "   put -r *" -ForegroundColor Cyan
Write-Host "   quit" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 2: Use the batch file (may not work with password)" -ForegroundColor Yellow
Write-Host "   sftp -P $sftpPort -b $commandFile $sftpUser@$sftpHost" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 3: Use WinSCP (Easiest - GUI tool)" -ForegroundColor Yellow
Write-Host "   Download from: https://winscp.net/eng/download.php" -ForegroundColor Cyan
Write-Host "   Connect to: $sftpHost`:$sftpPort" -ForegroundColor Cyan
Write-Host "   Username: $sftpUser" -ForegroundColor Cyan
Write-Host "   Then drag and drop files from dist folder" -ForegroundColor Cyan
Write-Host ""

$openFile = Read-Host "Would you like to open the command file? (y/n)"
if ($openFile -eq 'y' -or $openFile -eq 'Y') {
    notepad $commandFile
}

Write-Host ""
Write-Host "Ready to upload! Follow the instructions above." -ForegroundColor Green
