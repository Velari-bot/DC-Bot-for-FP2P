# SFTP Upload Script for fortnitepathtopro.com
# This script uploads the dist folder contents to your server

$sftpHost = "5.189.154.69"
$sftpPort = "2022"
$sftpUser = "wrench.00442de6"
$localDistPath = ".\dist"
$remotePath = "/home/container/dist"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SFTP Upload Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Server: $sftpHost`:$sftpPort" -ForegroundColor Yellow
Write-Host "User: $sftpUser" -ForegroundColor Yellow
Write-Host "Local Path: $localDistPath" -ForegroundColor Yellow
Write-Host "Remote Path: $remotePath" -ForegroundColor Yellow
Write-Host ""

# Always ensure a fresh build
Write-Host "Running production build..." -ForegroundColor Cyan
cmd /c "npm run build"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed! Aborting upload." -ForegroundColor Red
    exit 1
}


# Check if dist folder exists
if (-not (Test-Path $localDistPath)) {
    Write-Host "ERROR: dist folder not found!" -ForegroundColor Red
    Write-Host "Please run 'npm run build' first." -ForegroundColor Red
    exit 1
}

Write-Host "Creating SFTP command file..." -ForegroundColor Green

# Get absolute path
$absoluteDistPath = (Resolve-Path $localDistPath).Path

# Create SFTP command file with individual file uploads
# First, let's create commands to upload all files recursively
$rootPath = (Resolve-Path ".").Path
$sftpCommands = @"
-mkdir /home/container
-mkdir /home/container/dist
put "$rootPath\index.js" /home/container/index.js
put "$rootPath\package.json" /home/container/package.json
cd $remotePath
lcd "$absoluteDistPath"
"@

# Get all items first
$allItems = Get-ChildItem -Path $localDistPath -Recurse
$files = $allItems | Where-Object { -not $_.PSIsContainer }
$directories = $allItems | Where-Object { $_.PSIsContainer }

# First, create directories
foreach ($dir in $directories) {
    $relativePath = $dir.FullName.Substring($absoluteDistPath.Length + 1).Replace('\', '/')
    if ($relativePath) {
        $sftpCommands += "`nmkdir -p `"$remotePath/$relativePath`""
    }
}

# Then upload files
foreach ($file in $files) {
    $relativePath = $file.FullName.Substring($absoluteDistPath.Length + 1).Replace('\', '/')
    $sftpCommands += "`nput `"$($file.FullName)`" `"$remotePath/$relativePath`""
}

$sftpCommands += "`nquit"

$commandFile = "sftp_commands.txt"
$sftpCommands | Out-File -FilePath $commandFile -Encoding ASCII -NoNewline

Write-Host "Command file created: $commandFile" -ForegroundColor Green
Write-Host "Files to upload: $($files.Count)" -ForegroundColor Green
Write-Host ""
Write-Host "Connecting to server..." -ForegroundColor Cyan
Write-Host "You will be prompted for your password." -ForegroundColor Yellow
Write-Host ""

# Run SFTP with the command file
$sftpArgs = "-P", $sftpPort, "-b", $commandFile, "$sftpUser@$sftpHost"
& sftp $sftpArgs

# Check if upload was successful
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Upload completed successfully!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Upload may have failed. Error output:" -ForegroundColor Red
    Write-Host "Check the output above for error details." -ForegroundColor Red
    Write-Host ""
    Write-Host "If you see 'Host key verification failed', try:" -ForegroundColor Yellow
    Write-Host "1. Connect manually first: sftp -P $sftpPort $sftpUser@$sftpHost" -ForegroundColor Yellow
    Write-Host "2. Type 'yes' when prompted to accept the host key" -ForegroundColor Yellow
    Write-Host "3. Then run this script again" -ForegroundColor Yellow
}

# Clean up
if (Test-Path $commandFile) {
    Remove-Item $commandFile
    Write-Host ""
    Write-Host "Temporary files cleaned up." -ForegroundColor Green
}


