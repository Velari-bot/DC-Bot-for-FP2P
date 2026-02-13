# Add Firebase Environment Variables to Vercel
# Run this from the apps/web directory

Write-Host "Adding Firebase environment variables to Vercel..." -ForegroundColor Cyan

# Firebase Configuration
$envVars = @{
    "NEXT_PUBLIC_FIREBASE_API_KEY" = "AIzaSyCi0E0E0rK1awSUTsoqI5p6g_6Ug_EBxKs"
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" = "pathgen-v2.firebaseapp.com"
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID" = "pathgen-v2"
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" = "pathgen-v2.firebasestorage.app"
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" = "64409929315"
    "NEXT_PUBLIC_FIREBASE_APP_ID" = "1:64409929315:web:a8fefd3bcb7749ef6b1a56"
    "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID" = "G-JWC8N4H6FL"
    "FIREBASE_PROJECT_ID" = "pathgen-v2"
}

Write-Host "`nSetting environment variables..." -ForegroundColor Yellow

foreach ($key in $envVars.Keys) {
    $value = $envVars[$key]
    Write-Host "Setting $key..." -ForegroundColor Gray
    
    # Check if variable already exists
    $exists = vercel env ls 2>&1 | Select-String -Pattern $key
    
    if ($exists) {
        Write-Host "  [SKIP] $key already exists. Update manually in Vercel Dashboard if needed." -ForegroundColor Yellow
    } else {
        # Add the environment variable
        echo $value | vercel env add $key production
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  [OK] $key added successfully" -ForegroundColor Green
        } else {
            Write-Host "  [ERROR] Failed to add $key" -ForegroundColor Red
        }
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Firebase Environment Variables Added!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Note: These are PUBLIC variables (NEXT_PUBLIC_*)" -ForegroundColor Yellow
Write-Host "They are safe to expose in the frontend.`n" -ForegroundColor Yellow

Write-Host "To verify, check:" -ForegroundColor Cyan
Write-Host "https://vercel.com/velari-bots-projects/pathgen/settings/environment-variables`n" -ForegroundColor Blue

Write-Host "After adding, redeploy:" -ForegroundColor Cyan
Write-Host "  vercel --prod`n" -ForegroundColor Blue

