# Schedule Bulk Email for Tomorrow at 4pm EST

## Option 1: Windows Task Scheduler (Recommended)

1. **Open Task Scheduler**
   - Press `Win + R`, type `taskschd.msc`, press Enter

2. **Create Basic Task**
   - Click "Create Basic Task" in the right panel
   - Name: `PathGen v2 Announcement Email`
   - Description: `Send PathGen v2 announcement to all users`
   - Click Next

3. **Set Trigger**
   - Select "One time"
   - Set date to tomorrow
   - Set time to 4:00 PM
   - Click Next

4. **Set Action**
   - Select "Start a program"
   - Program/script: `powershell.exe`
   - Add arguments: `-ExecutionPolicy Bypass -File "C:\Users\bende\OneDrive\Desktop\fortnite api\functions\send-bulk-announcement.ps1"`
   - Start in: `C:\Users\bende\OneDrive\Desktop\fortnite api\functions`
   - Click Next

5. **Finish**
   - Check "Open the Properties dialog for this task"
   - Click Finish

6. **Configure Task**
   - In Properties, go to "General" tab
   - Check "Run whether user is logged on or not"
   - Check "Run with highest privileges"
   - Go to "Settings" tab
   - Check "Allow task to be run on demand"
   - Click OK

## Option 2: Run Script Now (Waits Until Tomorrow 4pm)

```powershell
cd functions
.\schedule-email-tomorrow.ps1
```

**Note:** This will keep your terminal open until tomorrow at 4pm EST.

## Option 3: Manual Send Tomorrow

Tomorrow at 4pm EST, run:

```powershell
cd functions
.\send-bulk-announcement.ps1
```

## Option 4: Use the API Endpoint (If Deployed)

If your email system is deployed, you can use the broadcast API:

```bash
POST /api/email/admin/broadcast
{
  "template": "v2-announcement",
  "subject": "PathGen v2 is Here!",
  "variables": {}
}
```

## Email List

The script will send to **70 recipients** (one invalid email was removed: `lew1vMj8R0X7NKLcF9GJ9d0Khts2` - it's a UID, not an email).

## Testing

To test before the scheduled time:

```powershell
cd functions
.\send-bulk-announcement.ps1
```

This will send immediately to all recipients.

