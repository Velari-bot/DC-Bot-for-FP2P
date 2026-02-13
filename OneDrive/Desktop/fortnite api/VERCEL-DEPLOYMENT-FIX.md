# 🔧 Vercel Deployment Fix

## ⚠️ Important: Set Root Directory in Vercel Dashboard

The `vercel.json` I created assumes you'll set the **Root Directory** in the Vercel Dashboard. Here's how:

### **For Frontend Deployment:**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Open your project (or create new one)
3. Go to **Settings** → **General**
4. Scroll to **Root Directory**
5. Click **Edit**
6. Set to: `apps/web`
7. Click **Save**
8. **Redeploy** your project

**OR** when creating a new project:
- Import repository
- Click **"Edit"** next to "Root Directory"
- Change from `./` to `apps/web`
- Deploy

---

## 📋 Updated vercel.json

I've updated `vercel.json` to work when Root Directory is set to `apps/web`:
- Commands are now relative to `apps/web` (no `cd` needed)
- Vercel will automatically detect Next.js from that directory

---

## 🚀 Backend API Deployment

The backend API needs to be deployed as a **separate Vercel project**. Here's how:

### **Option 1: Deploy Backend as Separate Project (Recommended)**

1. **Create New Vercel Project:**
   - Go to Vercel Dashboard → Add New Project
   - Import: `TradeWiseApp/PathGen-v2`
   - **Root Directory**: `fortnite-core/packages/api`
   - **Framework Preset**: Other
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

2. **Add Environment Variables:**
   - `STRIPE_SECRET_KEY` = `sk_test_...`
   - `STRIPE_WEBHOOK_SECRET` = `whsec_...` (after creating webhook)
   - `FRONTEND_URL` = your frontend URL

3. **Deploy**

### **Option 2: Use Vercel Serverless Functions**

The backend is already set up with `fortnite-core/packages/api/api/index.ts` as a serverless function entry point.

However, since your backend uses Express and monorepo packages, **Option 1 is recommended**.

---

## 🔍 Why Backend Needs Separate Project

Your backend:
- Uses Express (not Next.js)
- Has different dependencies
- Needs different build process
- Has different environment variables
- Should be accessible at a different URL

**Architecture:**
```
Frontend (Vercel Project 1)
  ↓
  Calls: https://your-backend-api.vercel.app/api/stripe/create-checkout
  ↓
Backend API (Vercel Project 2 - Separate)
  ↓
  Handles Stripe, webhooks, etc.
```

---

## ✅ Quick Fix Steps

1. **Set Root Directory in Vercel Dashboard:**
   - Settings → General → Root Directory = `apps/web`
   - Save and redeploy

2. **Deploy Backend Separately:**
   - Create new Vercel project
   - Root Directory = `fortnite-core/packages/api`
   - Add environment variables
   - Deploy

3. **Update Frontend API URL:**
   - Update `apps/web/public/pricing.html` with backend URL
   - Redeploy frontend

---

## 🧪 Test Locally First

```bash
# Test frontend
cd apps/web
npm install
npm run build
npm start

# Test backend
cd fortnite-core/packages/api
npm install
npm run build
npm start
```

Both should work locally before deploying!

