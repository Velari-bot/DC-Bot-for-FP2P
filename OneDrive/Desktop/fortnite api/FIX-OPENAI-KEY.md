# 🔧 Fix OpenAI API Key Error

The error `OpenAI API key not configured` means the `OPENAI_API_KEY` environment variable is not set in Vercel.

## Quick Fix

### Option 1: Add via Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (`pathgen` or `pathgen-v2`)
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Set:
   - **Key**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key (starts with `sk-`)
   - **Environment**: Select **Production** (and optionally Preview/Development)
6. Click **Save**

### Option 2: Add via Command Line

```powershell
# From the project root directory
cd "C:\Users\bende\OneDrive\Desktop\fortnite api"

# Add the OpenAI API key to Vercel
echo "sk-your-openai-api-key-here" | vercel env add OPENAI_API_KEY production

# Replace "sk-your-openai-api-key-here" with your actual key
```

### Option 3: Use PowerShell Script (if you have .env.local)

```powershell
cd "apps/web"
.\add-env-vars.ps1
```

## After Adding the Key

**Important:** You must redeploy for the environment variable to take effect:

```powershell
cd "C:\Users\bende\OneDrive\Desktop\fortnite api"
.\deploy-vercel.ps1
```

Or manually:
```powershell
vercel --prod
```

## Verify It Works

After redeploying, test the voice feature:
1. Go to https://www.pathgen.dev/voice.html
2. Try recording a voice message
3. It should process successfully (no more "OpenAI API key not configured" error)

## Get Your OpenAI API Key

If you don't have an OpenAI API key:

1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click **"Create new secret key"**
4. Copy the key (starts with `sk-`)
5. Paste it in Vercel environment variables (see above)

**Note:** OpenAI API usage is pay-as-you-go. Monitor your usage at https://platform.openai.com/usage

