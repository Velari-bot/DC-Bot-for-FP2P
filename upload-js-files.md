# Upload Updated JavaScript Files

Since images are already on the server and loading correctly, we just need to upload the updated JavaScript bundle and index.html.

## Quick Upload Steps:

1. **Connect to SFTP:**
   ```powershell
   sftp -P 2022 wrench.00442de6@5.189.154.69
   ```

2. **Once connected, run:**
   ```
   cd /home/container/dist
   lcd C:\Users\bende\Downloads\archive-2026-01-02T202312+0100\dist
   put index.html
   put main.*.js
   put 303.*.js
   put 945.*.js
   put 978.*.js
   put reactPlayer*.js
   put *.woff
   put *.woff2
   quit
   ```

   Or simpler - just upload all JS, HTML, and font files:
   ```
   put *.js
   put *.html
   put *.woff
   put *.woff2
   quit
   ```

3. **After upload, clear browser cache:**
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Or open in incognito/private mode to test

The images are already there, so this should fix the issue!

