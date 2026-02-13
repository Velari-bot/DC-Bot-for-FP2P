$sftpHost = "5.189.154.69"
$sftpPort = "2022"
$sftpUser = "wrench.00442de6"
$localPath = ".\index.js"
$remotePath = "/home/container/index.js"

Write-Host "Uploading updated server file to fix caching..." -ForegroundColor Cyan

# Create command file
$commandFile = "upload_server.txt"
@"
put "$localPath" "$remotePath"
quit
"@ | Out-File -FilePath $commandFile -Encoding ASCII

# Run SFTP
$sftpArgs = "-P", $sftpPort, "-b", $commandFile, "$sftpUser@$sftpHost"
& sftp $sftpArgs

Remove-Item $commandFile

Write-Host ""
Write-Host "IMPORTANT: You MUST restart the server in your hosting panel" -ForegroundColor Red
Write-Host "for the cache changes to take effect!" -ForegroundColor Red
