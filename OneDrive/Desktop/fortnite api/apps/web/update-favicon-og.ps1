# PowerShell script to update favicon and OG image in all HTML files
# Run from apps/web directory

$htmlFiles = Get-ChildItem -Path "public" -Filter "*.html" -Recurse

$faviconTags = @"
    <!-- Favicon -->
    <link rel="icon" type="image/png" href="/Logo.png">
    <link rel="shortcut icon" type="image/png" href="/Logo.png">
    <link rel="apple-touch-icon" href="/Logo.png">
"@

function Get-OGTags($title, $description, $url) {
    return @"
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://pathgen.dev$url">
    <meta property="og:title" content="$title">
    <meta property="og:description" content="$description">
    <meta property="og:image" content="https://pathgen.dev/embed.png">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="https://pathgen.dev$url">
    <meta name="twitter:title" content="$title">
    <meta name="twitter:description" content="$description">
    <meta name="twitter:image" content="https://pathgen.dev/embed.png">
"@
}

$pageConfigs = @{
    "login.html" = @{
        title = "Login - PathGen AI"
        description = "Sign in to PathGen AI and start improving your Fortnite gameplay."
        url = "/login"
    }
    "subscribe.html" = @{
        title = "Upgrade - PathGen AI"
        description = "Upgrade to PathGen Pro for unlimited AI coaching and advanced features."
        url = "/subscribe"
    }
    "analyze.html" = @{
        title = "Replay Analyzer - PathGen AI"
        description = "Upload and analyze your Fortnite replays with AI-powered insights."
        url = "/analyze"
    }
    "tweets.html" = @{
        title = "Competitive Tweets - PathGen AI"
        description = "Stay updated with the latest Fortnite competitive news and updates."
        url = "/tweets"
    }
    "docs.html" = @{
        title = "Documentation - PathGen AI"
        description = "Learn how to use PathGen AI to improve your Fortnite gameplay."
        url = "/docs"
    }
    "settings.html" = @{
        title = "Settings - PathGen AI"
        description = "Manage your PathGen AI account settings and preferences."
        url = "/settings"
    }
    "privacy.html" = @{
        title = "Privacy Policy - PathGen AI"
        description = "Read PathGen AI's Privacy Policy and understand how we protect your data."
        url = "/privacy"
    }
    "faq.html" = @{
        title = "FAQ - PathGen AI"
        description = "Frequently asked questions about PathGen AI and how it works."
        url = "/faq"
    }
    "how-it-works.html" = @{
        title = "How It Works - PathGen AI"
        description = "Learn how PathGen AI analyzes your gameplay and provides coaching insights."
        url = "/how-it-works"
    }
    "masterclass.html" = @{
        title = "Masterclass - PathGen AI"
        description = "Advanced Fortnite coaching and training programs."
        url = "/masterclass"
    }
    "competitive-insights.html" = @{
        title = "Competitive Insights - PathGen AI"
        description = "Get insights into the competitive Fortnite scene and meta."
        url = "/competitive-insights"
    }
    "voice.html" = @{
        title = "Voice Coach - PathGen AI"
        description = "Get real-time voice coaching during your Fortnite matches."
        url = "/voice"
    }
    "setup.html" = @{
        title = "Setup - PathGen AI"
        description = "Set up your PathGen AI account and get started."
        url = "/setup"
    }
    "setup-coach.html" = @{
        title = "Setup Coach - PathGen AI"
        description = "Configure your AI coach preferences and settings."
        url = "/setup-coach"
    }
    "success.html" = @{
        title = "Success - PathGen AI"
        description = "Your subscription has been successfully activated."
        url = "/success"
    }
    "manage-subscription.html" = @{
        title = "Manage Subscription - PathGen AI"
        description = "Manage your PathGen AI subscription and billing."
        url = "/manage-subscription"
    }
    "tutorial.html" = @{
        title = "Tutorial - PathGen AI"
        description = "Learn how to use PathGen AI with our step-by-step tutorial."
        url = "/tutorial"
    }
    "upload-replay.html" = @{
        title = "Upload Replay - PathGen AI"
        description = "Upload your Fortnite replay files for AI analysis."
        url = "/upload-replay"
    }
    "admin-panel.html" = @{
        title = "Admin Panel - PathGen AI"
        description = "Administrative dashboard for PathGen AI."
        url = "/admin-panel"
    }
    "cih-coaching.html" = @{
        title = "CIH Coaching - PathGen AI"
        description = "Custom coaching programs and training."
        url = "/cih-coaching"
    }
    "admin-tracking.html" = @{
        title = "Admin Tracking - PathGen AI"
        description = "Administrative tracking and analytics."
        url = "/admin-tracking"
    }
}

$updatedCount = 0

foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $fileName = $file.Name
    
    # Extract title from HTML if not in config
    if ($content -match '<title>(.*?)</title>') {
        $pageTitle = $matches[1]
    } else {
        $pageTitle = "PathGen AI"
    }
    
    # Get page config or use defaults
    $config = $pageConfigs[$fileName]
    if (-not $config) {
        $config = @{
            title = $pageTitle
            description = "PathGen AI - Your personal Fortnite coach powered by AI."
            url = "/$($file.BaseName)"
        }
    }
    
    # Update or add favicon
    if ($content -match 'rel="icon"') {
        # Replace existing favicon
        $content = $content -replace 'href="[^"]*PathGen[^"]*\.png"', 'href="/Logo.png"'
        $content = $content -replace 'href="[^"]*favicon[^"]*"', 'href="/Logo.png"'
    } else {
        # Add favicon after viewport meta tag
        if ($content -match '(.*<meta name="viewport"[^>]*>)') {
            $content = $content -replace '(<meta name="viewport"[^>]*>)', "`$1`n$faviconTags"
        } elseif ($content -match '(.*<title>[^<]*</title>)') {
            $content = $content -replace '(<title>[^<]*</title>)', "`$1`n$faviconTags"
        }
    }
    
    # Update or add OG tags
    if ($content -match 'property="og:image"') {
        # Replace existing OG image
        $content = $content -replace 'content="[^"]*image\.png"', 'content="https://pathgen.dev/embed.png"'
        $content = $content -replace 'content="[^"]*PathGen[^"]*\.png"', 'content="https://pathgen.dev/embed.png"'
    } else {
        # Add OG tags after favicon
        $ogTags = Get-OGTags $config.title $config.description $config.url
        if ($content -match '(.*</title>)') {
            $content = $content -replace '(</title>)', "`$1`n$ogTags"
        } elseif ($content -match '(.*<link rel="apple-touch-icon"[^>]*>)') {
            $content = $content -replace '(<link rel="apple-touch-icon"[^>]*>)', "`$1`n$ogTags"
        }
    }
    
    # Only write if content changed
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "✅ Updated: $fileName" -ForegroundColor Green
        $updatedCount++
    } else {
        Write-Host "⏭️  Skipped: $fileName (already up to date)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Updated $updatedCount files" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  - Favicon: /Logo.png" -ForegroundColor Gray
Write-Host "  - OG Image: /embed.png" -ForegroundColor Gray
Write-Host "  - All pages now have proper meta tags" -ForegroundColor Gray

