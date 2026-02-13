# Email to AI Memory Ingestion Workflow

## ✅ Complete Workflow

### Step 1: Gmail Reader Fetches Emails
- **Endpoint:** `/api/email/gmail-reader`
- **Action:** Connects to Gmail API using refresh token
- **Extracts:**
  - Email sender
  - Email subject
  - Email text content (full)
  - Email HTML content (full)
  - Gmail snippet

### Step 2: Sender Validation
- **Checks:** Is sender in `ALLOWED_EMAIL_SENDERS`?
- **Allowed senders:**
  - `noreply@pathgen.gg`
  - `updates@pathgen.gg`
  - `kinchanalytics@kinchanalytics.com`
- **If not allowed:** Returns `IGNORE_EMAIL`, skips AI processing

### Step 3: Account Validation
- **Checks:** Is `email.account == "jlbender2005"`?
- **If not:** Returns `IGNORE_EMAIL`

### Step 4: AI Memory Worker Processing
- **Endpoint:** `/api/email/memory`
- **Input:**
  ```json
  {
    "allowed_sender": "kinchanalytics@kinchanalytics.com",
    "email": {
      "account": "jlbender2005",
      "sender": "kinchanalytics@kinchanalytics.com",
      "subject": "Email subject",
      "text": "Full email text content",
      "html": "Full email HTML content",
      "body": "Email body"
    }
  }
  ```
- **AI Processing:**
  - Reads full email body
  - Extracts meaningful, long-term information
  - Removes fluff, greetings, signatures
  - Summarizes into 1-3 short sentences
  - Returns plain text (no markdown)

### Step 5: Memory Storage
- **Output:** Extracted memory text or `IGNORE_EMAIL`
- **Format:** Plain text summary ready for AI memory storage

## 🔍 Verification

### Check Email Extraction
The response includes:
- ✅ `text`: Full email text content
- ✅ `html`: Full email HTML content
- ✅ `snippet`: Gmail preview snippet

### Check AI Processing
The response includes:
- ✅ `memory`: AI-extracted memory text (or `IGNORE_EMAIL`)
- ✅ `status`: `"processed"` if memory extracted, `"ignored"` if not

### Check Logs
Server logs will show:
- `[MEMORY] Extracted memory: ...` - When memory is successfully extracted
- `[GMAIL] Memory extracted for ...` - When Gmail reader processes memory

## 🧪 Testing

### Test Script
```powershell
.\test-gmail-with-details.ps1
```

This will:
1. Fetch emails from allowed sender
2. Show full email text content
3. Display AI-extracted memory
4. Show processing status

### Manual Test
```powershell
$refreshToken = "YOUR_REFRESH_TOKEN"
$body = @{
    refresh_token = $refreshToken
    query = "from:kinchanalytics@kinchanalytics.com"
    max_results = 5
    process_memory = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/email/gmail-reader" `
    -Method POST -ContentType "application/json" -Body $body
```

## ✅ What's Working

1. ✅ Gmail API connection
2. ✅ Email content extraction (text + HTML)
3. ✅ Sender filtering
4. ✅ Account validation
5. ✅ AI memory worker processing
6. ✅ Memory extraction and return

## 📝 Next Steps

To automatically ingest emails into AI memory:
1. Set up a cron job or webhook
2. Call `/api/email/gmail-reader` periodically
3. Store the extracted `memory` text in your AI memory system
4. The memory will be available for future AI responses

---

**Status:** ✅ Fully operational and ready for production use!

