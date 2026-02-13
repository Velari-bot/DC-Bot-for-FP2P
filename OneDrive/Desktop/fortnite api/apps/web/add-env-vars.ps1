# PowerShell script to add all environment variables to Vercel
# Run this from the apps/web directory

Write-Host "🚀 Adding environment variables to Vercel..." -ForegroundColor Cyan
Write-Host ""

# List of environment variables to add
$envVars = @(
    "OSIRION_API_KEY",
    "DISCORD_CLIENT_ID",
    "DISCORD_CLIENT_SECRET",
    "DISCORD_REDIRECT_URI",
    "DATABASE_URL",
    "REDIS_URL",
    "OPENAI_API_KEY",
    "YOUTUBE_API_KEY",
    "GOOGLE_API_KEY",
    "EMAIL_SMTP_USER",
    "EMAIL_SMTP_PASS",
    "EMAIL_FROM"
)

# Check for .env in current directory, parent, or root (2 levels up)
$envPath = ".env"
if (-not (Test-Path $envPath)) {
    $envPath = "..\.env"
    if (-not (Test-Path $envPath)) {
        $envPath = "..\..\.env"
    }
}

if (Test-Path $envPath) {
    Write-Host "📄 Found .env file at: $envPath" -ForegroundColor Green
    Write-Host ""
    
    # Read .env file
    $envContent = Get-Content $envPath
    
    foreach ($line in $envContent) {
        # Skip comments and empty lines
        if ($line -match "^#" -or $line -match "^\s*$") {
            continue
        }
        
        # Parse KEY=VALUE
        if ($line -match "^([^=]+)=(.*)$") {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            
            # Remove quotes if present
            if ($value -match '^"(.*)"$') {
                $value = $matches[1]
            } elseif ($value -match "^'(.*)'$") {
                $value = $matches[1]
            }
            
            if ($envVars -contains $key) {
                Write-Host "Adding: $key" -ForegroundColor Yellow
                Write-Host "Value: $($value.Substring(0, [Math]::Min(20, $value.Length)))..." -ForegroundColor Gray
                
                # Add to Vercel
                echo $value | vercel env add $key production
                
                Write-Host "✅ Added $key" -ForegroundColor Green
                Write-Host ""
            }
        }
    }
} else {
    Write-Host "⚠️  .env file not found" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You can manually add variables using:" -ForegroundColor Cyan
    Write-Host "  vercel env add VARIABLE_NAME" -ForegroundColor White
    Write-Host ""
    Write-Host "Variables to add:" -ForegroundColor Cyan
    foreach ($var in $envVars) {
        Write-Host "  - $var" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "✨ Done! Remember to redeploy:" -ForegroundColor Green
Write-Host "  vercel --prod" -ForegroundColor Cyan

