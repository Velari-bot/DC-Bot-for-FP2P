# 📢 Ad Setup Guide for PathGen

This guide explains how to set up subtle advertisements for free tier users to monetize the platform and recover costs.

## 🎯 Overview

The ad system:
- ✅ Only shows ads to **free tier users**
- ✅ Automatically hides for **Pro subscribers**
- ✅ Uses subtle, non-intrusive placements
- ✅ Mobile-responsive (ads hidden on mobile to avoid clutter)
- ✅ Matches your dark theme design

## 📍 Ad Placements

### 1. **Banner Ad (Bottom of Page)**
- Fixed position at bottom
- Only on desktop (hidden on mobile)
- Maximum width: 728px
- Height: ~90px

### 2. **Sidebar Ad (Desktop Only)**
- Sticky position in sidebar
- Only shows on screens > 1024px
- Width: 300px

### 3. **In-Content Ad (Optional)**
- Between content sections
- Can be inserted after specific elements

## 🔧 Setup Instructions

### Option 1: Google AdSense (Recommended)

1. **Sign up for Google AdSense**
   - Visit: https://www.google.com/adsense
   - Create an account with your website (pathgen.dev)
   - Get approved (can take 1-3 days)

2. **Get your Publisher ID**
   - After approval, go to AdSense dashboard
   - Find your Publisher ID (format: `ca-pub-XXXXXXXXXXXXXXXX`)
   - Copy it

3. **Create Ad Units**
   - In AdSense, go to "Ads" → "By ad unit"
   - Create 3 ad units:
     - **Banner Ad**: Size 728x90 (Leaderboard)
     - **Sidebar Ad**: Size 300x250 (Medium Rectangle)
     - **In-Content Ad**: Responsive

4. **Update Configuration**
   - Open `apps/web/public/js/ad-manager.js`
   - Replace `YOUR_PUBLISHER_ID` with your actual Publisher ID
   - Replace `YOUR_BANNER_SLOT_ID` with your Banner Ad Slot ID
   - Replace `YOUR_SIDEBAR_SLOT_ID` with your Sidebar Ad Slot ID
   - Replace `YOUR_INCONTENT_SLOT_ID` with your In-Content Ad Slot ID

5. **Deploy**
   ```powershell
   cd "C:\Users\bende\OneDrive\Desktop\fortnite api"
   .\deploy-vercel.ps1
   ```

### Option 2: Carbon Ads (Gaming/Tech Focus)

Carbon Ads is better for gaming/tech audiences and pays higher CPM.

1. **Sign up for Carbon Ads**
   - Visit: https://www.carbonads.net/
   - Apply with your website
   - Get approved

2. **Get your Carbon Site ID**
   - After approval, you'll get a Site ID

3. **Replace Ad Manager Code**
   - Instead of AdSense, use Carbon Ads script
   - Update `ad-manager.js` to load Carbon script

### Option 3: Ezoic (Auto-Optimization)

Ezoic automatically tests ad placements and optimizes revenue.

1. **Sign up for Ezoic**
   - Visit: https://www.ezoic.com/
   - Connect your domain
   - Follow their setup wizard

2. **Use Ezoic's JavaScript Integration**
   - They provide a script that auto-inserts ads
   - Modify `ad-manager.js` to load their script only for free users

## 💰 Revenue Expectations

### Google AdSense
- **CPM (Cost Per 1000 Impressions)**: $0.50 - $2.00 (gaming/tech)
- **Expected Revenue per Free User**: ~$0.01 - $0.05/month
- **Recovery**: ~20-100% of $0.0225 cost per free user

### Carbon Ads
- **CPM**: $2.00 - $5.00 (higher for tech audience)
- **Expected Revenue per Free User**: ~$0.02 - $0.10/month
- **Recovery**: ~90-400% of $0.0225 cost per free user

### Ezoic
- **CPM**: $1.00 - $4.00 (auto-optimized)
- **Expected Revenue per Free User**: ~$0.02 - $0.08/month
- **Recovery**: ~90-350% of $0.0225 cost per free user

## 🎨 Customization

### Change Ad Styling

Edit `apps/web/public/css/ads.css`:
- Modify colors to match your theme
- Adjust sizes and positions
- Change animation effects

### Add More Ad Placements

In your HTML pages, add:
```javascript
// After page loads
if (window.pathgenAdManager && isFreeUser) {
    // Insert ad after specific element
    window.pathgenAdManager.insertInContentAd('#some-element');
    
    // Or insert in sidebar
    window.pathgenAdManager.insertSidebarAd('.sidebar-container');
}
```

## 📱 Mobile Considerations

- Banner ads are **hidden on mobile** by default (too intrusive)
- Sidebar ads are **desktop-only** (no sidebar on mobile)
- Only in-content ads show on mobile (if inserted)

To enable mobile ads, remove the `@media` rules in `ads.css`.

## 🔍 Testing

1. **Test as Free User**
   - Clear localStorage
   - Visit page
   - Ads should appear at bottom

2. **Test as Pro User**
   - Log in as Pro user
   - Ads should NOT appear

3. **Check Console**
   - Open browser DevTools
   - Look for `[AdManager]` logs
   - Should see "AdSense script loaded" for free users

## 🚨 Troubleshooting

### Ads Not Showing

1. **Check Publisher ID**
   - Make sure it's correct in `ad-manager.js`
   - Format: `ca-pub-XXXXXXXXXXXXXXXX`

2. **Check Ad Slot IDs**
   - Verify slot IDs match your AdSense dashboard
   - Each ad unit has a unique slot ID

3. **Check User Tier**
   - Open console: `localStorage.getItem('pathgen_user')`
   - Verify user doesn't have `plan: 'pro'`

4. **Check AdSense Approval**
   - Make sure your site is approved
   - Ads won't show until approved

### Ads Showing for Pro Users

1. **Check User Data**
   - User object should have `plan: 'pro'` or `isPremium: true`
   - Verify `checkUserTier()` is working

### Low Revenue

1. **Try Different Ad Networks**
   - Carbon Ads pays better for tech/gaming
   - Ezoic auto-optimizes placements

2. **Adjust Ad Placements**
   - More visible = more clicks = more revenue
   - But balance with user experience

3. **Target Better Ads**
   - Gaming/tech ads pay more
   - Configure ad categories in AdSense

## 📊 Tracking Revenue

### Google AdSense Dashboard
- Visit: https://www.google.com/adsense
- View earnings, impressions, clicks

### Integrate with Analytics
- Track ad impressions in your analytics
- Measure conversion from free → paid users
- Calculate ROI of ad revenue vs. lost conversions

## ✅ Current Implementation Status

- ✅ Ad Manager JavaScript created
- ✅ CSS styling for subtle ads
- ✅ Free tier detection
- ✅ Banner ad placement (bottom)
- ✅ Mobile-responsive (hidden on mobile)
- ✅ Integrated into `index.html`
- ✅ Integrated into `chat.html`
- ⏳ **Next Step**: Set up Google AdSense account and add Publisher ID

## 🎯 Next Steps

1. **Choose Ad Network**
   - Google AdSense (easiest)
   - Carbon Ads (better for gaming)
   - Ezoic (auto-optimization)

2. **Get Approved**
   - Submit application
   - Wait 1-3 days

3. **Configure**
   - Add Publisher ID to `ad-manager.js`
   - Create ad units
   - Add slot IDs

4. **Deploy**
   - Test locally
   - Deploy to production
   - Monitor revenue

5. **Optimize**
   - Track performance
   - Adjust placements
   - Test different networks

## 💡 Tips

- **Start with Google AdSense** (easiest to set up)
- **Add Carbon Ads later** if you want better rates
- **Don't overdo it** - 1-2 subtle ads is enough
- **Monitor user feedback** - if ads annoy users, reduce them
- **A/B test placements** - see what works best

---

**Need Help?** Check the console logs for `[AdManager]` messages to debug issues.

