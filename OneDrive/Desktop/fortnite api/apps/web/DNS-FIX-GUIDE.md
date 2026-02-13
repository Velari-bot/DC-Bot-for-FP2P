# DNS Fix Guide - Prevent Emails Going to Spam

## 🚨 Critical Issues Found

Based on your current DNS records, here are the problems:

### ❌ Issue 1: Missing SPF Record for Root Domain
- You have SPF for `mail.pathgen.dev` and `ses.pathgen.dev`
- **But you're missing SPF for `pathgen.dev` (root domain)**
- Since you send from `support@pathgen.dev`, you need SPF at root level

### ❌ Issue 2: Duplicate DMARC Records
- You have **TWO** DMARC records (this is invalid!)
- Email providers will get confused and may mark emails as spam
- You need to **DELETE one** and keep only one

## ✅ Fix Instructions

### Step 1: Delete Duplicate DMARC Record

**DELETE this record:**
```
Host: _dmarc
Type: TXT
Value: "v=DMARC1; p=none;"
```

**KEEP this one (but we'll update it):**
```
Host: _dmarc
Type: TXT
Value: v=DMARC1; p=none; rua=mailto:rua@pathgen.dev
```

### Step 2: Update DMARC Record

**Update the remaining DMARC record to:**
```
Host: _dmarc
Type: TXT
Value: v=DMARC1; p=none; rua=mailto:support@pathgen.dev; ruf=mailto:support@pathgen.dev
TTL: 3600 (or your preferred TTL)
```

**Explanation:**
- `p=none` - Monitor only (start here, then move to `quarantine` later)
- `rua=mailto:support@pathgen.dev` - Send aggregate reports to support email
- `ruf=mailto:support@pathgen.dev` - Send forensic reports to support email

### Step 3: Add SPF Record for Root Domain

**ADD this new record:**
```
Host: @ (or leave blank, depending on your DNS provider)
Type: TXT
Value: v=spf1 include:amazonses.com ~all
TTL: 3600 (or your preferred TTL)
```

**Important:** This must be at the root domain level (`@` or blank host), NOT a subdomain.

### Step 4: Verify Your Records

After making changes, wait 5-10 minutes, then verify:

1. **SPF Check:**
   - Go to: https://mxtoolbox.com/spf.aspx
   - Enter: `pathgen.dev`
   - Should show: `v=spf1 include:amazonses.com ~all`

2. **DMARC Check:**
   - Go to: https://mxtoolbox.com/dmarc.aspx
   - Enter: `pathgen.dev`
   - Should show: `v=DMARC1; p=none; rua=mailto:support@pathgen.dev`
   - **Should only show ONE record!**

3. **DKIM Check:**
   - Go to: https://mxtoolbox.com/dkim.aspx
   - Enter: `pathgen.dev`
   - Should show all 3 DKIM selectors

## 📋 Summary of Changes

### Records to DELETE:
1. ❌ `_dmarc` TXT record with value `"v=DMARC1; p=none;"` (the one without rua)

### Records to ADD:
1. ✅ `@` TXT record: `v=spf1 include:amazonses.com ~all`

### Records to UPDATE:
1. ✅ `_dmarc` TXT record: Change to `v=DMARC1; p=none; rua=mailto:support@pathgen.dev; ruf=mailto:support@pathgen.dev`

### Records to KEEP (Already Correct):
- ✅ All 3 DKIM CNAME records (they're perfect!)
- ✅ A record for `@` pointing to `216.198.79.1`
- ✅ CNAME for `www` pointing to Vercel
- ✅ SPF records for `mail` and `ses` subdomains (optional, but won't hurt)

## 🎯 Final DNS Configuration

After fixes, you should have:

```
@                    A       216.198.79.1
@                    TXT     v=spf1 include:amazonses.com ~all  ← NEW
www                  CNAME   5cf997f29dfa1586.vercel-dns-017.com.
_dmarc               TXT     v=DMARC1; p=none; rua=mailto:support@pathgen.dev; ruf=mailto:support@pathgen.dev  ← UPDATED (only one!)
n6j4yqcyjqiprs6tbb3yo7qqthyn72nl._domainkey  CNAME  n6j4yqcyjqiprs6tbb3yo7qqthyn72nl.dkim.amazonses.com
ups4u5b2yhcupjwmv5obo3xiwn3khuqw._domainkey  CNAME  ups4u5b2yhcupjwmv5obo3xiwn3khuqw.dkim.amazonses.com
wpi37bae6rq3ed2fkg4jaur3gt3t2ebu._domainkey  CNAME  wpi37bae6rq3ed2fkg4jaur3t2ebu.dkim.amazonses.com
mail                 TXT     v=spf1 include:amazonses.com ~all  (optional)
ses                  TXT     "v=spf1 include:amazonses.com ~all"  (optional)
ses                  MX      feedback-smtp.us-east-2.amazonses.com (priority 10)
```

## ⏱️ Timeline

1. **Make DNS changes** - 5 minutes
2. **Wait for propagation** - 5-10 minutes (usually)
3. **Verify records** - Use mxtoolbox.com
4. **Test email** - Send test email via mail-tester.com

## 🧪 Test After Fixes

1. Go to: https://www.mail-tester.com/
2. Send a test email from your support system
3. Check score (should be 8-10/10 after fixes)
4. Verify SPF, DKIM, DMARC all pass

## 📊 Why These Fixes Matter

### Missing Root SPF:
- Email providers check SPF at the domain level
- Without root SPF, they can't verify you're authorized to send
- Result: Emails marked as spam

### Duplicate DMARC:
- Email providers get confused with multiple DMARC records
- Some may reject emails entirely
- Result: Unpredictable deliverability

### After Fixes:
- ✅ SPF authenticates your sending server
- ✅ DKIM signs your emails (already working!)
- ✅ DMARC provides policy (only one record)
- ✅ Result: Emails reach inbox, not spam

## 🚀 Next Steps After Fixes

1. **Monitor for 1-2 weeks** with `p=none` (monitoring mode)
2. **Check DMARC reports** at `support@pathgen.dev`
3. **If all good**, change DMARC to `p=quarantine`:
   ```
   v=DMARC1; p=quarantine; rua=mailto:support@pathgen.dev; ruf=mailto:support@pathgen.dev
   ```
4. **After another week**, if still good, use `p=reject` (strictest):
   ```
   v=DMARC1; p=reject; rua=mailto:support@pathgen.dev; ruf=mailto:support@pathgen.dev
   ```

## ⚠️ Important Notes

- **DNS Propagation**: Changes can take up to 48 hours, but usually 5-10 minutes
- **TTL**: Your records have 1 min TTL, which is good for quick updates
- **Quotes**: Remove quotes from SPF/DMARC values (they're not needed)
- **Case Sensitivity**: DNS is case-insensitive, but keep it lowercase for consistency

## 🆘 Still Having Issues?

If emails still go to spam after fixes:

1. **Check AWS SES** - Make sure domain is verified
2. **Check From Address** - Must match verified domain
3. **Check Email Content** - Avoid spam trigger words
4. **Warm Up Domain** - New domains need gradual volume increase
5. **Check Reputation** - Use Google Postmaster Tools
