# Quick Deploy to Vercel Production
# Run this from anywhere to deploy PathGen to production

# Get the script directory (project root)
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path

# Navigate to project root
Set-Location $scriptPath

# Run the main deployment script
& "$scriptPath\deploy-vercel.ps1"

