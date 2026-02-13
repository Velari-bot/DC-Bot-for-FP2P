# How to Upload Your Website to the Server

## ⚠️ IMPORTANT: Fix Host Key Issue First

Before uploading, you need to accept the server's host key. Run this command:

```powershell
sftp -P 2022 wrench.00442de6@5.189.154.69
```

When prompted "Are you sure you want to continue connecting (yes/no/[fingerprint])?", type **yes** and press Enter, then type **quit** to exit.

## Easiest Method: Using WinSCP (Recommended for Beginners)

### Step 1: Download WinSCP
1. Go to https://winscp.net/eng/download.php
2. Download and install WinSCP (it's free)

### Step 2: Connect to Your Server
1. Open WinSCP
2. Click "New Site"
3. Enter these details:
   - **File protocol**: SFTP
   - **Host name**: `5.189.154.69`
   - **Port number**: `2022`
   - **User name**: `wrench.00442de6`
   - **Password**: (your server password - same as the panel password)
4. Click "Save" and then "Login"

### Step 3: Upload Files
1. On the LEFT side: Navigate to your local `dist` folder
   - Path: `C:\Users\bende\Downloads\archive-2026-01-02T202312+0100\dist`
2. On the RIGHT side: Navigate to `/home/container/dist` on the server
3. Select ALL files and folders in the left panel (Ctrl+A)
4. Drag and drop them to the right panel, OR click the "Upload" button
5. If it asks to overwrite existing files, click "Yes to All"

### Step 4: Verify
- Check that all folders are uploaded: `achievements`, `assets`, `pfps`, `thumbnails`, etc.
- Your website should now be live!

---

## Alternative Method: Using PowerShell Script

If you prefer using the command line, run:
```powershell
.\upload-to-server.ps1
```

You'll be prompted for your password, then all files will upload automatically.

