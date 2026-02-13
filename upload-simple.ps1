# Simple SFTP Upload Script
# This script helps you upload files step by step

$sftpHost = "5.189.154.69"
$sftpPort = "2022"
$sftpUser = "wrench.00442de6"
$localDistPath = ".\dist"
$remotePath = "/home/container/dist"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SFTP Upload Helper" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will help you upload your dist folder to the server." -ForegroundColor Yellow
Write-Host ""
Write-Host "STEP 1: First, let's accept the host key" -ForegroundColor Green
Write-Host "Run this command and type 'yes' when prompted:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  sftp -P $sftpPort $sftpUser@$sftpHost" -ForegroundColor White
Write-Host ""
Write-Host "Then type 'quit' to exit." -ForegroundColor Yellow
Write-Host ""
$null = Read-Host "Press Enter after you've accepted the host key"

Write-Host ""
Write-Host "STEP 2: Now let's upload the files" -ForegroundColor Green
Write-Host ""

# Check if dist folder exists
if (-not (Test-Path $localDistPath)) {
    Write-Host "ERROR: dist folder not found!" -ForegroundColor Red
    Write-Host "Please run 'npm run build' first." -ForegroundColor Red
    exit 1
}

# Count files
$fileCount = (Get-ChildItem -Path $localDistPath -Recurse -File).Count
Write-Host "Found $fileCount files to upload" -ForegroundColor Green
Write-Host ""

# Create SFTP batch file
$batchFile = "upload_batch.txt"
$batchContent = @"
cd $remotePath
lcd "$((Resolve-Path $localDistPath).Path)"
put -r *
quit
"@

$batchContent | Out-File -FilePath $batchFile -Encoding ASCII -NoNewline

Write-Host "Created batch file: $batchFile" -ForegroundColor Green
Write-Host ""
Write-Host "Now run this command (you'll be prompted for your password):" -ForegroundColor Yellow
Write-Host ""
Write-Host "  sftp -P $sftpPort -b $batchFile $sftpUser@$sftpHost" -ForegroundColor White
Write-Host ""
Write-Host "After upload completes, the batch file will be deleted automatically." -ForegroundColor Cyan
Write-Host ""

$runNow = Read-Host "Do you want to run the upload now? (y/n)"
if ($runNow -eq 'y' -or $runNow -eq 'Y') {
    Write-Host ""
    Write-Host "Uploading..." -ForegroundColor Cyan
    & sftp -P $sftpPort -b $batchFile "$sftpUser@$sftpHost"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Upload completed successfully!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "Upload failed. Please check the error messages above." -ForegroundColor Red
    }
    
    # Clean up
    if (Test-Path $batchFile) {
        Remove-Item $batchFile
    }
} else {
    Write-Host ""
    Write-Host "You can run the upload command manually when ready." -ForegroundColor Yellow
    Write-Host "The batch file '$batchFile' has been created for you." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green

