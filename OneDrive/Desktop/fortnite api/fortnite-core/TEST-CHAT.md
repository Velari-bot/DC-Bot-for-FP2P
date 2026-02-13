# 🧪 Testing AI Chat (Without OpenAI Key)

## PowerShell Commands (Correct Syntax)

### Test 1: Simple GET Request
```powershell
curl http://localhost:3000/api/tweets | ConvertFrom-Json | Select-Object -First 5
```

### Test 2: POST to Chat Endpoint (PowerShell)
```powershell
$body = @{
    query = "What did Osirion tweet about weapon changes?"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/chat" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

### Test 3: Alternative (using curl.exe)
```powershell
curl.exe -X POST http://localhost:3000/api/chat `
    -H "Content-Type: application/json" `
    -d '{\"query\": \"What tournaments are coming up?\"}'
```

## Testing Without OpenAI

The system works in two modes:

### 1. **Without OpenAI Key** (Testing Mode)
- Data ingestion works
- Vector search works (in-memory)
- Chat endpoint returns mock response

### 2. **With OpenAI Key** (Production Mode)
- Full embeddings generation
- GPT-4 powered responses
- Source citations

## Current Data Available

Your system currently has:
- **10+ tweets** from osirion_gg, KinchAnalytics, FNcompReport
- **Tournament schedule** (Simpsons Season)

All this data is ready to be embedded and searched!

## Quick Test Script

```powershell
# Save as test-chat.ps1
$body = @{
    query = "What tournaments are scheduled?"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/chat" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body
    
    Write-Host "✅ Response:" -ForegroundColor Green
    Write-Host $response.response
    
    Write-Host "`n📚 Sources:" -ForegroundColor Cyan
    $response.sources | ForEach-Object {
        Write-Host "  - $($_.author): $($_.content.Substring(0, 50))..."
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}
```

## Example Queries

```powershell
# Tournament info
$body = @{ query = "When is the next tournament?" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/chat" -Method POST -ContentType "application/json" -Body $body

# Weapon changes
$body = @{ query = "What weapon changes did Osirion mention?" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/chat" -Method POST -ContentType "application/json" -Body $body

# FNCS stats
$body = @{ query = "Show me the latest FNCS stats from Kinch" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/chat" -Method POST -ContentType "application/json" -Body $body
```

