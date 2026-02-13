
$sftpHost = "5.189.154.69"
$sftpPort = "2022"
$sftpUser = "wrench.00442de6"

$commandFile = "check_remote_commands.txt"
@"
cd /home/container
ls -la
cd dist
ls -la
quit
"@ | Out-File -FilePath $commandFile -Encoding ASCII

$sftpArgs = "-P", $sftpPort, "-o", "StrictHostKeyChecking=accept-new", "-b", $commandFile, "$sftpUser@$sftpHost"
& sftp $sftpArgs
Remove-Item $commandFile
