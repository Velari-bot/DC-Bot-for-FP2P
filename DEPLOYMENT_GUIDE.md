# Complete Deployment Guide - Fortnite Path To Pro

This guide covers the complete process of building and deploying your website to the live server at `fortnitepathtopro.com`.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Build Process](#build-process)
3. [Upload Methods](#upload-methods)
4. [Verification](#verification)
5. [Troubleshooting](#troubleshooting)
6. [Best Practices](#best-practices)

---

## Prerequisites

### Required Software
- **Node.js** (v22.20.0 or compatible)
- **npm** (v10.9.3 or compatible)
- **SFTP Client** (built into Windows, or WinSCP for GUI)

### Server Information
- **Host:** `5.189.154.69`
- **Port:** `2022`
- **Username:** `wrench.00442de6`
- **Protocol:** SFTP
- **Server Path:** `/home/container/dist/`
- **Local Build Path:** `C:\Users\bende\Downloads\archive-2026-01-02T202312+0100\dist`

### Before You Start
1. Ensure all changes are committed to your version control
2. Test the build locally using `npm start`
3. Verify all images and assets are in the `public` folder
4. Have your server password ready

---

## Build Process

### Step 1: Install Dependencies
```powershell
npm install
```

**When to run:** 
- First time setup
- After adding new npm packages
- If `node_modules` is missing or corrupted

### Step 2: Build for Production
```powershell
npm run build
```

**What this does:**
- Compiles React components to JavaScript
- Bundles all code into optimized files
- Copies all static assets (images, videos, etc.) from `public/` to `dist/`
- Generates `index.html` with correct file references
- Creates production-optimized bundles

**Expected output:**
- `dist/` folder with all production files
- JavaScript bundles (main.*.js, vendor files, etc.)
- All image folders: `achievements/`, `pfps/`, `thumbnails/`, `assets/`
- `index.html` file

### Step 3: Verify Build
Check that these folders exist in `dist/`:
- ✅ `achievements/` (10 PNG files)
- ✅ `pfps/` (8 PNG files)
- ✅ `thumbnails/` (19 JPG files)
- ✅ `assets/` (5 PNG files)
- ✅ `content/`, `included/`, `videos/`
- ✅ `index.html`
- ✅ `main.*.js` and other JavaScript bundles
- ✅ Font files (`.woff`, `.woff2`)

**Quick verification command:**
```powershell
Get-ChildItem -Path dist -Recurse -Directory | Select-Object Name
Get-ChildItem -Path dist\pfps -File | Measure-Object | Select-Object Count
Get-ChildItem -Path dist\achievements -File | Measure-Object | Select-Object Count
Get-ChildItem -Path dist\thumbnails -File | Measure-Object | Select-Object Count
```

---

## Upload Methods

### Method 1: Interactive SFTP (Recommended for First-Time)

#### Step 1: Connect to Server
```powershell
sftp -P 2022 wrench.00442de6@5.189.154.69
```

**First time only:** When prompted about host key, type `yes` and press Enter.

**Then:** Enter your server password when prompted.

#### Step 2: Navigate to Server Directory
```
mkdir /home/container/dist
cd /home/container/dist
```

**Note:** If directory already exists, `mkdir` will show an error - that's fine, just continue.

#### Step 3: Navigate to Local Build Directory
```
lcd C:\Users\bende\Downloads\archive-2026-01-02T202312+0100\dist
```

#### Step 4: Upload All Files
```
put -r *
```

This uploads everything recursively:
- All JavaScript files
- All image folders
- `index.html`
- Font files
- Everything else in `dist/`

#### Step 5: Verify Upload (Optional)
```
ls -la
```

You should see all your folders and files listed.

#### Step 6: Exit
```
quit
```

---

### Method 2: WinSCP (GUI - Easiest for Beginners)

#### Step 1: Download and Install
1. Go to: https://winscp.net/eng/download.php
2. Download WinSCP installer
3. Run installer and follow setup wizard

#### Step 2: Create New Connection
1. Open WinSCP
2. Click **"New Site"** button
3. Fill in connection details:
   - **File protocol:** `SFTP`
   - **Host name:** `5.189.154.69`
   - **Port number:** `2022`
   - **User name:** `wrench.00442de6`
   - **Password:** (your server password)
4. Click **"Save"** to save the connection
5. Click **"Login"**

#### Step 3: Upload Files
1. **Left panel (Local):** Navigate to:
   ```
   C:\Users\bende\Downloads\archive-2026-01-02T202312+0100\dist
   ```

2. **Right panel (Remote):** Navigate to:
   ```
   /home/container/dist
   ```

3. **Select all files:**
   - In left panel, press `Ctrl+A` to select everything
   - Or manually select folders and files

4. **Upload:**
   - Drag and drop from left to right panel, OR
   - Click the **"Upload"** button (arrow pointing right)
   - If prompted about overwriting, click **"Yes to All"**

5. **Wait for upload to complete:**
   - Progress bar will show at bottom
   - All files should show green checkmarks when done

#### Step 4: Close Connection
- Click **"Close"** or close WinSCP window

---

### Method 3: PowerShell Script (Automated)

#### Using the Upload Script
```powershell
.\upload-to-server.ps1
```

**Note:** This script may have issues with password prompts. If it fails, use Method 1 or 2 instead.

---

## Verification

### Step 1: Test Direct Image URLs
Open these URLs in your browser to verify images are accessible:

- `https://fortnitepathtopro.com/pfps/deckzee.png`
- `https://fortnitepathtopro.com/achievements/1.png`
- `https://fortnitepathtopro.com/thumbnails/aim-routine.jpg`
- `https://fortnitepathtopro.com/assets/logo.png`

**Expected:** Images should display directly in browser

**If 404:** Files are in wrong location or server not configured correctly

### Step 2: Test Website
1. Open: `https://fortnitepathtopro.com`
2. **Hard refresh** to clear cache:
   - Windows: `Ctrl+Shift+R`
   - Mac: `Cmd+Shift+R`
3. Check that:
   - ✅ Page loads without errors
   - ✅ All images display correctly
   - ✅ Navigation works
   - ✅ No console errors (F12 → Console tab)

### Step 3: Check Browser Console
1. Press `F12` to open DevTools
2. Go to **Network** tab
3. Reload page (`Ctrl+R`)
4. Look for:
   - ❌ Red entries (404 errors) = files missing
   - ✅ Green entries (200 status) = files loading correctly

### Step 4: Verify Server is Running
If using Express server, ensure it's running:
- Check server logs
- Restart if needed: `pm2 restart all` or restart Node.js process

---

## Troubleshooting

### Issue: "Host key verification failed"
**Solution:**
1. Connect manually first: `sftp -P 2022 wrench.00442de6@5.189.154.69`
2. Type `yes` when prompted about host key
3. Type `quit` to exit
4. Try upload again

### Issue: "Permission denied"
**Solution:**
- Check password is correct
- Verify username: `wrench.00442de6`
- Check port: `2022`

### Issue: "No such file or directory" when changing directory
**Solution:**
- Create directory first: `mkdir /home/container/dist`
- Then navigate: `cd /home/container/dist`

### Issue: Images not showing on website
**Checklist:**
1. ✅ Images uploaded to `/home/container/dist/`?
2. ✅ Images accessible via direct URL?
3. ✅ Browser cache cleared? (Hard refresh: `Ctrl+Shift+R`)
4. ✅ Server restarted after upload?
5. ✅ JavaScript files uploaded? (Check `index.html` references correct JS files)

### Issue: "put -r *" doesn't work
**Solution:**
Upload folders individually:
```
put -r achievements
put -r pfps
put -r thumbnails
put -r assets
put -r content
put -r included
put -r videos
put *.js
put index.html
put *.woff
put *.woff2
```

### Issue: Old version still showing
**Solution:**
1. Clear browser cache completely
2. Test in incognito/private window
3. Check server is serving new files (verify file timestamps)
4. Restart server if using Express

### Issue: Build fails
**Common causes:**
- Missing dependencies: Run `npm install`
- Syntax errors: Check console output for specific errors
- Missing files: Ensure all assets exist in `public/` folder

---

## Best Practices

### 1. Always Build Before Uploading
```powershell
npm run build
```
Never upload files directly from `static/` or `public/` - always build first!

### 2. Verify Build Locally
Test the build locally before uploading:
```powershell
npm start
```
Visit `http://localhost:3000` and verify everything works.

### 3. Backup Before Major Changes
Before deploying major changes:
- Commit code to version control
- Tag the release
- Keep a backup of the previous `dist/` folder

### 4. Upload Strategy

**Full Deployment (First time or major changes):**
- Upload everything: `put -r *`

**Quick Updates (Code changes only):**
- Upload only changed files:
  ```
  put index.html
  put main.*.js
  put 303.*.js
  put 945.*.js
  ```

**Image Updates Only:**
- Upload only image folders:
  ```
  put -r achievements
  put -r pfps
  put -r thumbnails
  ```

### 5. Test After Upload
Always test:
1. Homepage loads
2. Images display
3. Navigation works
4. No console errors
5. Mobile responsiveness (if applicable)

### 6. Keep Dependencies Updated
Regularly update:
```powershell
npm update
npm audit fix
```

### 7. Monitor Server Logs
Check server logs after deployment for any errors or warnings.

### 8. Use Version Control
- Commit before deploying
- Tag releases
- Keep deployment notes

---

## Quick Reference

### Complete Deployment Workflow
```powershell
# 1. Build
npm run build

# 2. Verify build
Get-ChildItem -Path dist -Recurse -Directory

# 3. Connect and upload
sftp -P 2022 wrench.00442de6@5.189.154.69
# Then in SFTP:
mkdir /home/container/dist
cd /home/container/dist
lcd C:\Users\bende\Downloads\archive-2026-01-02T202312+0100\dist
put -r *
quit

# 4. Test
# Visit: https://fortnitepathtopro.com
# Hard refresh: Ctrl+Shift+R
```

### File Structure on Server
```
/home/container/
├── dist/                    # Production build (upload here)
│   ├── index.html
│   ├── main.*.js
│   ├── achievements/
│   ├── pfps/
│   ├── thumbnails/
│   ├── assets/
│   └── ...
├── index.js                 # Express server
├── package.json
└── ...
```

### Important Paths
- **Local build output:** `.\dist\`
- **Server deployment:** `/home/container/dist/`
- **Express serves from:** `/home/container/dist/` (relative to `index.js`)

---

## Additional Resources

### SFTP Commands Reference
- `cd [path]` - Change remote directory
- `lcd [path]` - Change local directory
- `put [file]` - Upload single file
- `put -r [folder]` - Upload folder recursively
- `get [file]` - Download file
- `ls` - List remote files
- `lls` - List local files
- `mkdir [path]` - Create remote directory
- `quit` or `exit` - Disconnect

### Common npm Commands
- `npm install` - Install dependencies
- `npm run build` - Build for production
- `npm start` - Start development server
- `npm test` - Run tests
- `npm update` - Update dependencies

---

## Support

If you encounter issues not covered in this guide:
1. Check browser console (F12) for errors
2. Check server logs
3. Verify file paths and permissions
4. Test direct image URLs
5. Clear browser cache
6. Restart server

---

**Last Updated:** January 2026
**Server:** fortnitepathtopro.com
**Build Tool:** Webpack 5.99.8

