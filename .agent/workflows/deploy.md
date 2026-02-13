---
description: Build and deploy Fortnite Path To Pro to the live server
---

# Deployment Workflow

This workflow automates the build and deployment process for fortnitepathtopro.com.

## Prerequisites
- Ensure you have the server password ready.
- Host: `5.189.154.69`
- Port: `2022`
- User: `wrench.00442de6`

## Steps

### 1. Build the Project
// turbo
```powershell
npm run build
```

### 2. Verify Build Output
Check that the `dist/` folder contains the necessary assets.
// turbo
```powershell
Get-ChildItem -Path dist -Recurse -Directory | Select-Object Name
Get-ChildItem -Path dist\pfps -File | Measure-Object | Select-Object Count
Get-ChildItem -Path dist\achievements -File | Measure-Object | Select-Object Count
Get-ChildItem -Path dist\thumbnails -File | Measure-Object | Select-Object Count
```

### 3. Deploy to Server
Run the automated upload script. You will be prompted for the password.
// turbo
```powershell
.\upload-to-server.ps1
```

### 4. Verify Live Site
1. Visit [fortnitepathtopro.com](https://fortnitepathtopro.com)
2. Perform a hard refresh (`Ctrl+Shift+R`)
3. Check direct image URLs:
   - [Logo](https://fortnitepathtopro.com/assets/logo.png)
   - [PFP Example](https://fortnitepathtopro.com/pfps/deckzee.png)
