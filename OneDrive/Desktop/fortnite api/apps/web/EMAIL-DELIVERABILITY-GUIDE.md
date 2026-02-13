# Email Deliverability Guide - Prevent Spam

## 🎯 Goal: Get Emails to Inbox, Not Spam

This guide will help you set up proper email authentication and deliverability so your support emails reach the inbox instead of spam.

## ✅ Step 1: Set Up SPF Record

**SPF (Sender Policy Framework)** tells email providers which servers are allowed to send emails from your domain.

### For `pathgen.dev` domain:

1. Go to your DNS provider (where you manage `pathgen.dev` DNS records)
2. Add a TXT record:
   ```
   Type: TXT
   Name: @ (or pathgen.dev)
   Value: v=spf1 include:amazonses.com ~all
   TTL: 3600
   ```

**For AWS SES specifically:**
```
v=spf1 include:amazonses.com ~all
```

This allows Amazon SES to send emails on behalf of your domain.

## ✅ Step 2: Set Up DKIM Records

**DKIM (DomainKeys Identified Mail)** adds a digital signature to prove emails are from your domain.

### In AWS SES Console:

1. Go to **Amazon SES** → **Verified identities**
2. Click on your domain (`pathgen.dev`)
3. Go to **DKIM** tab
4. You'll see 3 CNAME records to add:
   - `xxxxx._domainkey.pathgen.dev` → `xxxxx.dkim.amazonses.com`
   - `xxxxx._domainkey.pathgen.dev` → `xxxxx.dkim.amazonses.com`
   - `xxxxx._domainkey.pathgen.dev` → `xxxxx.dkim.amazonses.com`

5. Add these 3 CNAME records to your DNS:
   ```
   Type: CNAME
   Name: [first part from SES]
   Value: [target from SES]
   TTL: 3600
   ```

6. Wait for verification (usually 5-10 minutes)
7. Click **Enable** in SES console once verified

## ✅ Step 3: Set Up DMARC Policy

**DMARC (Domain-based Message Authentication)** tells email providers what to do with emails that fail SPF/DKIM.

### Add DMARC Record:

1. Add a TXT record to your DNS:
   ```
   Type: TXT
   Name: _dmarc
   Value: v=DMARC1; p=quarantine; rua=mailto:support@pathgen.dev; ruf=mailto:support@pathgen.dev; pct=100
   TTL: 3600
   ```

**Policy Options:**
- `p=none` - Monitor only (start here)
- `p=quarantine` - Send to spam if fails
- `p=reject` - Reject emails that fail (strictest)

**Start with `p=none`** to monitor, then move to `p=quarantine` after a few weeks.

## ✅ Step 4: Verify Your Domain in AWS SES

1. Go to **Amazon SES** → **Verified identities**
2. Click **Create identity** → **Domain**
3. Enter: `pathgen.dev`
4. Follow the DNS setup instructions
5. Wait for verification (can take up to 72 hours, usually much faster)

## ✅ Step 5: Use Proper "From" Address

Make sure you're sending from a verified email address:

```bash
EMAIL_FROM="PathGen Support <support@pathgen.dev>"
```

Or:
```bash
EMAIL_FROM="support@pathgen.dev"
EMAIL_FROM_NAME="PathGen Support"
```

**Important:** The domain in the "From" address must match your verified domain in SES.

## ✅ Step 6: Email Content Best Practices

### ✅ DO:
- Use clear, professional subject lines
- Include unsubscribe links (already in your code)
- Keep HTML clean and simple
- Use proper email structure (headers, body, footer)
- Personalize when possible
- Send from a consistent "From" address

### ❌ DON'T:
- Use ALL CAPS in subject lines
- Use excessive exclamation marks!!!
- Include spam trigger words (FREE, CLICK NOW, etc.)
- Send from different domains randomly
- Use URL shorteners
- Include too many images
- Use suspicious attachments

## ✅ Step 7: Warm Up Your Domain (Important!)

**New domains/email addresses need to be "warmed up" gradually:**

### Week 1-2:
- Send 10-20 emails per day
- Only to verified/test addresses
- Monitor bounce rates

### Week 3-4:
- Increase to 50-100 emails per day
- Monitor spam complaints

### Week 5+:
- Gradually increase volume
- Monitor reputation

**Your support emails should be fine since they're transactional (user-initiated), not marketing.**

## ✅ Step 8: Monitor Your Reputation

### Check Email Reputation:

1. **Google Postmaster Tools:**
   - https://postmaster.google.com/
   - Add `pathgen.dev` domain
   - Monitor spam rate, reputation

2. **Microsoft SNDS:**
   - https://sendersupport.olc.protection.outlook.com/snds/
   - Monitor reputation for Outlook/Hotmail

3. **AWS SES Console:**
   - Check bounce/complaint rates
   - Keep bounce rate < 5%
   - Keep complaint rate < 0.1%

## ✅ Step 9: Handle Bounces and Complaints

### Set Up Bounce/Complaint Handling:

1. In AWS SES, go to **Configuration** → **Suppression list**
2. Enable automatic suppression
3. Set up SNS notifications for bounces/complaints
4. Remove bounced emails from your list

### Best Practices:
- Remove hard bounces immediately
- Remove soft bounces after 3 attempts
- Honor unsubscribe requests immediately
- Monitor complaint rates

## ✅ Step 10: Test Your Setup

### Verify Your Records:

Use these tools to check your DNS records:

1. **MXToolbox SPF Checker:**
   - https://mxtoolbox.com/spf.aspx
   - Enter: `pathgen.dev`

2. **DKIM Validator:**
   - https://mxtoolbox.com/dkim.aspx
   - Enter: `pathgen.dev`

3. **DMARC Analyzer:**
   - https://mxtoolbox.com/dmarc.aspx
   - Enter: `pathgen.dev`

4. **Mail Tester:**
   - https://www.mail-tester.com/
   - Send a test email to the address they provide
   - Aim for 8-10/10 score

## 📋 Quick Checklist

- [ ] SPF record added to DNS
- [ ] DKIM records added to DNS (3 CNAME records)
- [ ] DKIM enabled in AWS SES
- [ ] DMARC record added to DNS
- [ ] Domain verified in AWS SES
- [ ] Using verified "From" address
- [ ] Email content follows best practices
- [ ] Monitoring bounce/complaint rates
- [ ] Tested with mail-tester.com

## 🚨 Common Issues & Fixes

### "Emails going to spam"
- ✅ Check SPF/DKIM/DMARC records are correct
- ✅ Verify domain in SES
- ✅ Use proper "From" address
- ✅ Check email content (no spam triggers)
- ✅ Warm up domain gradually

### "SPF record not found"
- ✅ Wait 24-48 hours for DNS propagation
- ✅ Check DNS record syntax is correct
- ✅ Verify record is at root domain (@) not subdomain

### "DKIM not verified"
- ✅ Make sure all 3 CNAME records are added
- ✅ Wait for DNS propagation
- ✅ Click "Enable" in SES console after verification

### "High bounce rate"
- ✅ Remove invalid email addresses
- ✅ Verify email addresses before sending
- ✅ Use double opt-in for marketing emails

## 📊 Monitoring Commands

### Check DNS Records:
```bash
# SPF
nslookup -type=TXT pathgen.dev

# DKIM
nslookup -type=CNAME [dkim-selector]._domainkey.pathgen.dev

# DMARC
nslookup -type=TXT _dmarc.pathgen.dev
```

## 🎯 Expected Results

After proper setup:
- ✅ Emails reach inbox (not spam)
- ✅ High deliverability rate (>95%)
- ✅ Low bounce rate (<5%)
- ✅ Low complaint rate (<0.1%)
- ✅ Good reputation scores

## 📚 Additional Resources

- AWS SES Best Practices: https://docs.aws.amazon.com/ses/latest/dg/best-practices.html
- Google Postmaster Tools: https://postmaster.google.com/
- Microsoft SNDS: https://sendersupport.olc.protection.outlook.com/snds/

## ⚡ Quick Setup Script

For your DNS provider, add these records:

```
# SPF Record
Type: TXT
Name: @
Value: v=spf1 include:amazonses.com ~all

# DMARC Record
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:support@pathgen.dev

# DKIM Records (get from AWS SES console)
Type: CNAME
Name: [from SES console]
Value: [from SES console]
```

After adding records, wait 24-48 hours for full propagation, then test!
