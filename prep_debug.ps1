$password = "eon4Se0021um"
$commandFile = "sftp_debug_commands.txt"
$remoteHost = "wrench.00442de6@5.189.154.69"
$port = "2022"

@"
cd /home/container
ls -la
ls -la dist
ls -la public
quit
"@ | Out-File -FilePath $commandFile -Encoding ASCII

# Use echo to pipe password if possible, but sftp doesn't like that.
# However, we can try to use a dummy connection to accept host key first.
ssh-keyscan -p $port 5.189.154.69 >> ~/.ssh/known_hosts

# Since we don't have sshpass, we have to use the interactive method or a tool.
# I'll try to use the background command + send_command_input to capture everything to a file.
