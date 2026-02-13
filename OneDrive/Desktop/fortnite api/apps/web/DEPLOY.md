# 🚀 Quick Deploy to Vercel Production

## One-Command Deploy

From the **project root directory**, run:

```powershell
.\deploy-vercel.ps1
```

Or from anywhere:

```powershell
.\DEPLOY.ps1
```

## What Gets Deployed

- ✅ Voice interaction page with improved popup
- ✅ Subscription check API
- ✅ Stripe webhook updates (Firebase integration)
- ✅ All latest changes and improvements

## Deployment Process

1. **Automatically detects root directory**
2. **Deploys to Vercel production** (`vercel --prod`)
3. **Shows deployment status** and next steps

## Verify Deployment

After deployment completes:

1. Visit: https://pathgen.dev/voice.html
2. Test subscription check (should work in production)
3. Check Stripe webhooks: https://dashboard.stripe.com/webhooks
4. Verify Firestore updates after purchase

## Common Commands

```powershell
# Deploy to production
.\deploy-vercel.ps1

# Check deployment status
vercel ls

# View deployment logs
vercel inspect [deployment-url] --logs
```

## Notes

- Always deploy from **root directory** (Vercel Dashboard has Root Directory = `apps/web`)
- Deployment takes ~30-60 seconds
- Changes go live immediately after deployment completes

