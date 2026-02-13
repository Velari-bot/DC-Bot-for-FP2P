# 🔧 Vercel Deployment Fix - Next.js Detection Issue

## ⚠️ Error You're Seeing

```
Warning: Could not identify Next.js version, ensure it is defined as a project dependency.
Error: No Next.js version detected. Make sure your package.json has "next" in either "dependencies" or "devDependencies". Also check your Root Directory setting matches the directory of your package.json file.
```

## ✅ Solution: Set Root Directory in Vercel Dashboard

The issue is that Vercel is trying to build from the root directory, but your Next.js app is in `apps/web`.

### **Step 1: Set Root Directory in Vercel Dashboard**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project (pathgen.dev)
3. Go to **Settings** → **General**
4. Scroll down to **Root Directory**
5. Click **Edit** (or **Change**)
6. Type: `apps/web`
7. Click **Save**

### **Step 2: Verify Package.json Location**

Make sure `apps/web/package.json` contains Next.js (it already does ✅):

```json
{
  "dependencies": {
    "next": "^14.0.4",
    ...
  }
}
```

### **Step 3: Redeploy**

After changing the root directory:
1. Go to **Deployments** tab
2. Click the **...** menu on your latest deployment
3. Click **Redeploy**

Or use CLI:
```powershell
cd apps/web
vercel --prod
```

## ✅ What I Fixed

1. ✅ Created `apps/web/vercel.json` - Proper Vercel config for the Next.js app
2. ✅ Updated root `vercel.json` - Now just points to root directory
3. ✅ Fixed PowerShell script - Removed problematic characters

## 📋 Alternative: Use Root vercel.json

If you can't set root directory in dashboard, the root `vercel.json` now has:
```json
{
  "rootDirectory": "apps/web"
}
```

But **setting it in the dashboard is recommended** for reliability.

## 🧪 Test Locally First

Before deploying, make sure it builds locally:

```powershell
cd apps/web
npm install
npm run build
```

If this works, Vercel should work too after setting root directory.

## 🚀 Next Steps After Fix

1. Set Root Directory = `apps/web` in Vercel Dashboard
2. Redeploy
3. Set Discord OAuth environment variables (see `DISCORD-OAUTH-SETUP.md`)
4. Test the deployment

## 📝 Checklist

- [ ] Root Directory set to `apps/web` in Vercel Dashboard
- [ ] Project redeployed after changing root directory
- [ ] Build succeeds (check deployment logs)
- [ ] Discord environment variables set
- [ ] Test login flow at https://pathgen.dev/login.html

