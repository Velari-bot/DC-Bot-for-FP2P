# Quick Email Deliverability Setup

## 🚀 Fast Setup (5 Minutes)

### Step 1: Add SPF Record to DNS

Go to your DNS provider (where you manage `pathgen.dev`) and add:

```
Type: TXT
Name: @
Value: v=spf1 include:amazonses.com ~all
TTL: 3600
```

### Step 2: Get DKIM Records from AWS SES

1. Go to: https://console.aws.amazon.com/ses/
2. Click **Verified identities** → Your domain (`pathgen.dev`)
3. Go to **DKIM** tab
4. Copy the 3 CNAME records shown
5. Add them to your DNS (as CNAME records)
6. Wait 5-10 minutes, then click **Enable** in SES

### Step 3: Add DMARC Record

Add to your DNS:

```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:support@pathgen.dev
TTL: 3600
```

### Step 4: Verify Domain in SES

1. In AWS SES Console → **Verified identities**
2. Click **Create identity** → **Domain**
3. Enter: `pathgen.dev`
4. Follow DNS setup instructions
5. Wait for verification

### Step 5: Test

1. Go to: https://www.mail-tester.com/
2. Send a test email to the address they provide
3. Check your score (aim for 8-10/10)

## ✅ That's It!

After DNS propagation (24-48 hours), your emails should reach the inbox instead of spam.

## 🔍 Verify Your Setup

Check your records are correct:
- **SPF**: https://mxtoolbox.com/spf.aspx?domain=pathgen.dev
- **DKIM**: https://mxtoolbox.com/dkim.aspx?domain=pathgen.dev
- **DMARC**: https://mxtoolbox.com/dmarc.aspx?domain=pathgen.dev

## 📧 Current Email Configuration

Your emails are configured to send from:
- **From Address**: `support@pathgen.dev`
- **SMTP**: Amazon SES
- **Authentication**: SPF, DKIM, DMARC (once DNS is set up)

## ⚠️ Important Notes

1. **DNS Propagation**: Changes can take 24-48 hours to fully propagate
2. **Domain Verification**: Must verify `pathgen.dev` in AWS SES
3. **From Address**: Must match verified domain
4. **Warm Up**: New domains should start with low volume and gradually increase

## 🎯 Expected Results

After setup:
- ✅ Emails reach inbox (not spam)
- ✅ High deliverability (>95%)
- ✅ Professional appearance
- ✅ Proper authentication

See `EMAIL-DELIVERABILITY-GUIDE.md` for detailed information.
