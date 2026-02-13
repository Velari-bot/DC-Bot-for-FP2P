# 🚀 Deploy to Vercel - Quick Guide

## ✅ Pre-Deployment Checklist

### 1. Configuration Updates (Already Done)
- ✅ Updated `next.config.js` to use Vercel URL in production
- ✅ Updated `vercel.json` with proper function timeouts and CORS headers
- ✅ Fixed `chat.html` to use same-origin API calls
- ✅ Updated Firestore rules for anonymous tracking

### 2. Vercel Dashboard Setup

#### Set Root Directory
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **General**
4. Set **Root Directory** to: `apps/web`
5. Click **Save**

#### Required Environment Variables
Go to **Settings** → **Environment Variables** and ensure these are set:

**Firebase Admin (Required for API routes):**
```
GOOGLE_APPLICATION_CREDENTIALS_JSON
```
Value: Your Firebase service account JSON (stringified)

**Email (Optional but recommended):**
```
EMAIL_SMTP_USER
EMAIL_SMTP_PASS
EMAIL_FROM
```

**Other Variables (if needed):**
```
OPENAI_API_KEY
DISCORD_CLIENT_ID
DISCORD_CLIENT_SECRET
STRIPE_SECRET_KEY
```

**⚠️ Important:** Set all variables for **Production**, **Preview**, and **Development** environments.

## 🚀 Deployment Methods

### Method 1: Using PowerShell Script (Recommended)

```powershell
cd apps/web
.\deploy-vercel.ps1
```

### Method 2: Using Vercel CLI

```powershell
cd apps/web
vercel --prod
```

### Method 3: Git Push (Auto-Deploy)

Just push to your main branch:
```powershell
git add .
git commit -m "Deploy to Vercel"
git push
```

Vercel will automatically deploy if connected to your Git repository.

### Method 4: Vercel Dashboard

1. Go to **Deployments** tab
2. Click **Redeploy** on latest deployment
3. Or click **Create Deployment** → **Deploy**

## ✅ Post-Deployment Verification

### 1. Check Deployment Status
- Go to Vercel Dashboard → **Deployments**
- Verify deployment succeeded (green checkmark)

### 2. Test API Endpoints

**Test Chat API:**
```bash
curl -X POST https://your-domain.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the best drop spot this season?"}'
```

**Test Health:**
```bash
curl https://your-domain.vercel.app/api/health
```

### 3. Test Frontend
- Open your Vercel URL in browser
- Navigate to `/chat.html`
- Send a test message
- Verify it connects and responds

### 4. Verify Firestore Rules
The Firestore rules were already deployed. Verify in Firebase Console:
- Go to Firebase Console → Firestore Database → Rules
- Verify `anonymous_messages` collection rule is present

## 🔧 Troubleshooting

### Build Fails
- Check Root Directory is set to `apps/web`
- Verify all dependencies in `package.json`
- Check build logs in Vercel Dashboard

### API Returns 500 Errors
- Check environment variables are set correctly
- Verify `GOOGLE_APPLICATION_CREDENTIALS_JSON` is properly formatted
- Check Vercel function logs

### Chat Not Connecting
- Verify `API_BASE` is empty string (uses same origin)
- Check browser console for errors
- Verify CORS headers in `vercel.json`

### Firestore Permission Errors
- Rules are already deployed
- Check Firebase Console → Firestore → Rules
- Verify `anonymous_messages` rule allows `create: if true`

## 📝 Notes

- **Function Timeout:** API routes have 60-second timeout (updated in `vercel.json`)
- **CORS:** Headers are configured for API routes
- **Environment:** Production uses Vercel URL automatically
- **Firestore Rules:** Already deployed and active

## 🎉 You're Ready!

Your app is now configured for Vercel deployment. Just run the deployment script or push to Git!

