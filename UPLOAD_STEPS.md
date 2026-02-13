# Simple Upload Steps

## ✅ Images are Fixed!
Your build includes all images:
- 8 profile pictures
- 10 achievement images  
- 19 thumbnail images
- All assets and other files

## 📤 How to Upload (Choose One Method)

### Method 1: Interactive SFTP (Easiest - No extra software)

1. **Connect to server:**
   ```powershell
   sftp -P 2022 wrench.00442de6@5.189.154.69
   ```

2. **Enter your password when prompted**

3. **Once connected, run these commands one by one:**
   ```
   cd /home/container/dist
   lcd C:\Users\bende\Downloads\archive-2026-01-02T202312+0100\dist
   put -r *
   quit
   ```

   **Note:** If `put -r *` doesn't work, you'll need to upload folders individually:
   ```
   put -r achievements
   put -r pfps
   put -r thumbnails
   put -r assets
   put -r content
   put -r included
   put -r videos
   put *.js
   put *.html
   put *.woff
   put *.woff2
   ```

---

### Method 2: WinSCP (GUI - Recommended for beginners)

1. **Download WinSCP:** https://winscp.net/eng/download.php
2. **Install and open WinSCP**
3. **Create new connection:**
   - Protocol: **SFTP**
   - Host name: `5.189.154.69`
   - Port number: `2022`
   - User name: `wrench.00442de6`
   - Password: (your server password)
4. **Click "Login"**
5. **On the LEFT side:** Navigate to `C:\Users\bende\Downloads\archive-2026-01-02T202312+0100\dist`
6. **On the RIGHT side:** Navigate to `/home/container/dist`
7. **Select ALL files and folders** (Ctrl+A) in the left panel
8. **Drag them to the right panel** or click the "Upload" button
9. **If asked to overwrite, click "Yes to All"**

---

## ✅ After Upload

Once uploaded, your website at fortnitepathtopro.com should display all images correctly!

If images still don't show:
1. Check browser console (F12) for 404 errors
2. Verify files are in `/home/container/dist` on the server
3. Check server logs for any errors

