# Amazon SES SMTP Setup Guide

## Step-by-Step Instructions to Get SMTP Credentials

### Step 1: Sign in to AWS Console

1. Go to: https://console.aws.amazon.com/
2. Sign in with your AWS account (or create one if needed)

### Step 2: Navigate to Amazon SES

1. In the AWS Console, search for "SES" in the search bar
2. Click on **Amazon SES** (Simple Email Service)
3. Make sure you're in the correct AWS region (e.g., `us-east-2`)

### Step 3: Verify Your Email Address or Domain

**Option A: Verify Email Address (Quick for Testing)**
1. Click **Verified identities** in the left sidebar
2. Click **Create identity**
3. Select **Email address**
4. Enter: `support@pathgen.dev` (or your email)
5. Click **Create identity**
6. Check your email inbox and click the verification link

**Option B: Verify Domain (Recommended for Production)**
1. Click **Verified identities** → **Create identity**
2. Select **Domain**
3. Enter your domain: `pathgen.dev`
4. Click **Create identity**
5. Follow the DNS setup instructions:
   - Add the provided DKIM records to your DNS
   - Add SPF record
   - Set up DMARC policy (optional but recommended)

### Step 4: Request Production Access (Important!)

**Amazon SES starts in "Sandbox Mode" which only allows sending to verified emails.**

1. In SES Console, click **Account dashboard** in the left sidebar
2. Look for **Account status** - if it says "Sandbox", you need to request production access
3. Click **Request production access**
4. Fill out the form:
   - **Mail Type**: Transactional
   - **Website URL**: https://pathgen.dev
   - **Use case description**: "Sending support request notifications and transactional emails for PathGen AI platform"
   - **Expected sending volume**: Estimate your monthly emails
5. Submit the request
6. **Wait for approval** (usually 24-48 hours)

### Step 5: Create SMTP Credentials

1. In SES Console, click **SMTP settings** in the left sidebar
2. Click **Create SMTP credentials**
3. Enter an **IAM user name** (e.g., `pathgen-smtp-user`)
4. Click **Create**
5. **IMPORTANT**: Copy and save these credentials immediately:
   - **SMTP Username** (starts with something like `AKIA...`)
   - **SMTP Password** (long random string)
   
   ⚠️ **You can only see the password once!** If you lose it, you'll need to create new credentials.

### Step 6: Note Your SMTP Server Details

From the SMTP settings page, note:
- **SMTP Server Name**: Usually `email-smtp.us-east-2.amazonaws.com` (varies by region)
- **Port**: `587` (for STARTTLS) or `465` (for SSL)
- **SMTP Username**: The one you just created
- **SMTP Password**: The one you just created

### Step 7: Add to Your .env.local File

1. Open `apps/web/.env.local` (create it if it doesn't exist)
2. Add these lines:

```bash
EMAIL_SMTP_USER=AKIAXXXXXXXXXXXXXXXX
EMAIL_SMTP_PASS=your_smtp_password_here
EMAIL_FROM="PathGen <no-reply@pathgen.gg>"
EMAIL_FROM_NAME="PathGen"
```

Replace:
- `AKIAXXXXXXXXXXXXXXXX` with your actual SMTP username
- `your_smtp_password_here` with your actual SMTP password

### Step 8: Restart Your Dev Server

After adding the credentials:
1. Stop your dev server (Ctrl+C)
2. Restart it: `npm run dev`
3. The email system should now work!

## Quick Checklist

- [ ] AWS account created/signed in
- [ ] Amazon SES accessed
- [ ] Email address or domain verified
- [ ] Production access requested (if needed)
- [ ] SMTP credentials created
- [ ] Credentials saved securely
- [ ] Added to `.env.local` file
- [ ] Dev server restarted

## Troubleshooting

### "Email address not verified"
- Make sure you've verified the email address in SES
- Check your spam folder for the verification email

### "Account is in sandbox mode"
- Request production access in SES dashboard
- Wait for AWS approval (24-48 hours)

### "SMTP credentials invalid"
- Double-check username and password in `.env.local`
- Make sure there are no extra spaces or quotes
- Try creating new SMTP credentials

### "Connection timeout"
- Check your firewall/network settings
- Verify the SMTP server name and port are correct
- Make sure you're using port 587 (STARTTLS)

## Cost Information

- **Free Tier**: First 62,000 emails/month free (if sent from EC2)
- **After Free Tier**: $0.10 per 1,000 emails
- **Very affordable** for support requests and notifications

## Security Best Practices

1. **Never commit `.env.local` to git** (it should be in `.gitignore`)
2. **Use different credentials for production** (set in Vercel environment variables)
3. **Rotate credentials periodically** (every 90 days recommended)
4. **Use IAM roles when possible** (for EC2/ECS deployments)

## For Production (Vercel)

When deploying to Vercel, add these as environment variables:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - `EMAIL_SMTP_USER`
   - `EMAIL_SMTP_PASS` (mark as sensitive)
   - `EMAIL_FROM`
   - `EMAIL_FROM_NAME`
3. Redeploy your application

## Need Help?

- AWS SES Documentation: https://docs.aws.amazon.com/ses/
- AWS Support: https://aws.amazon.com/support/
