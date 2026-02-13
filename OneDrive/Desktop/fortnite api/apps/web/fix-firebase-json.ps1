# Fix Firebase Admin JSON in .env.local
# This script validates and fixes the GOOGLE_APPLICATION_CREDENTIALS_JSON format

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fix Firebase Admin JSON in .env.local" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$envLocalPath = Join-Path $PSScriptRoot ".env.local"

if (-not (Test-Path $envLocalPath)) {
    Write-Host "[ERROR] .env.local file not found at: $envLocalPath" -ForegroundColor Red
    exit 1
}

Write-Host "[INFO] Reading .env.local..." -ForegroundColor Yellow

# Read the file
$content = Get-Content $envLocalPath -Raw

# Extract the JSON value
if ($content -match 'GOOGLE_APPLICATION_CREDENTIALS_JSON=(.+)') {
    $jsonValue = $matches[1].Trim()
    
    Write-Host "[INFO] Found GOOGLE_APPLICATION_CREDENTIALS_JSON" -ForegroundColor Yellow
    Write-Host "[INFO] Length: $($jsonValue.Length) characters" -ForegroundColor Gray
    Write-Host "[INFO] First 50 chars: $($jsonValue.Substring(0, [Math]::Min(50, $jsonValue.Length)))..." -ForegroundColor Gray
    
    # Try to parse the JSON
    try {
        # Remove any leading/trailing quotes
        $cleanedJson = $jsonValue.Trim('"').Trim("'")
        
        # Try to parse it
        $jsonObject = $cleanedJson | ConvertFrom-Json
        
        Write-Host "[OK] JSON is valid!" -ForegroundColor Green
        Write-Host "[INFO] Project ID: $($jsonObject.project_id)" -ForegroundColor Gray
        Write-Host "[INFO] Client Email: $($jsonObject.client_email)" -ForegroundColor Gray
        
        # If it's valid, check if it needs to be re-formatted
        # Read the entire JSON file from the Downloads folder if it exists
        $downloadsPath = Join-Path $env:USERPROFILE "Downloads\pathgen-v2-firebase-adminsdk*.json"
        $jsonFiles = Get-Item $downloadsPath -ErrorAction SilentlyContinue
        
        if ($jsonFiles) {
            Write-Host ""
            Write-Host "[INFO] Found Firebase JSON file in Downloads:" -ForegroundColor Yellow
            $jsonFiles | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor Gray }
            
            $useFile = Read-Host "Do you want to use this file instead? (y/n)"
            
            if ($useFile -eq "y" -or $useFile -eq "Y") {
                $selectedFile = $jsonFiles[0]
                Write-Host "[INFO] Using file: $($selectedFile.Name)" -ForegroundColor Yellow
                
                $jsonContent = Get-Content $selectedFile.FullName -Raw
                $jsonObject = $jsonContent | ConvertFrom-Json
                
                # Remove old GOOGLE_APPLICATION_CREDENTIALS_JSON line
                $content = $content -replace "GOOGLE_APPLICATION_CREDENTIALS_JSON=.*", ""
                
                # Add new line (on a single line, properly escaped)
                $singleLineJson = $jsonContent -replace "`r`n", "" -replace "`n", "" -replace ' ', ''
                $newLine = "GOOGLE_APPLICATION_CREDENTIALS_JSON=$jsonContent"
                
                # Add to content
                if ($content.Trim()) {
                    $content = $content.Trim() + "`n`n" + $newLine
                } else {
                    $content = $newLine
                }
                
                Set-Content -Path $envLocalPath -Value $content -NoNewline
                
                Write-Host "[OK] Updated .env.local with new JSON" -ForegroundColor Green
                Write-Host ""
                Write-Host "Next steps:" -ForegroundColor Cyan
                Write-Host "1. Restart your dev server (npm run dev)" -ForegroundColor White
                Write-Host "2. Check console for '[INFO] Firebase Admin initialized...'" -ForegroundColor White
            }
        }
        
    } catch {
        Write-Host "[ERROR] JSON is invalid: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "The JSON in .env.local is malformed. Here are options:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Option 1: Use the setup script" -ForegroundColor Cyan
        Write-Host "  Run: .\setup-local-firebase.ps1" -ForegroundColor White
        Write-Host ""
        Write-Host "Option 2: Manual fix" -ForegroundColor Cyan
        Write-Host "  1. Get your Firebase service account JSON from:" -ForegroundColor White
        Write-Host "     https://console.firebase.google.com/project/pathgen-v2/settings/serviceaccounts/adminsdk" -ForegroundColor Gray
        Write-Host "  2. Copy the ENTIRE JSON content" -ForegroundColor White
        Write-Host "  3. In .env.local, replace the GOOGLE_APPLICATION_CREDENTIALS_JSON line with:" -ForegroundColor White
        Write-Host "     GOOGLE_APPLICATION_CREDENTIALS_JSON={...paste entire JSON on one line...}" -ForegroundColor Gray
        Write-Host ""
        
        # Try to show what's wrong
        Write-Host "[DEBUG] Attempting to find where the JSON breaks..." -ForegroundColor Yellow
        for ($i = 0; $i -lt [Math]::Min(200, $jsonValue.Length); $i++) {
            try {
                $testJson = $jsonValue.Substring(0, $i + 1)
                $testObj = $testJson | ConvertFrom-Json -ErrorAction Stop
            } catch {
                Write-Host "[DEBUG] JSON breaks at position $i" -ForegroundColor Gray
                Write-Host "[DEBUG] Context: ...$($jsonValue.Substring([Math]::Max(0, $i-20), [Math]::Min(40, $jsonValue.Length-$i+20)))..." -ForegroundColor Gray
                break
            }
        }
    }
} else {
    Write-Host "[ERROR] GOOGLE_APPLICATION_CREDENTIALS_JSON not found in .env.local" -ForegroundColor Red
    Write-Host "[INFO] Run .\setup-local-firebase.ps1 to add it" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

