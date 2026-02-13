# 🎮 Pathgen v2 - Complete User Flow

**Updated**: November 5, 2025  
**Status**: ✅ Complete

---

## 📱 Complete Onboarding Flow

```
┌──────────────────────────────────────────────────────────┐
│                   PATHGEN ONBOARDING                     │
└──────────────────────────────────────────────────────────┘

Step 1: HOMEPAGE
        http://localhost:3000/
        ├─ Lemni dark hero design
        ├─ Cycling hero text (4 variations)
        ├─ Preview cards (AI Chat, Tweet Tracker)
        └─ "Try For Free" button
              ↓
              Click "Try For Free"
              ↓

Step 2: LOGIN
        http://localhost:3000/login.html
        ├─ Monochrome P logo (with sparkles)
        ├─ Lemni geometric background
        ├─ "Continue with Discord" button
        └─ Discord OAuth
              ↓
              Authenticate with Discord
              ↓

Step 3: SETUP
        http://localhost:3000/setup.html
        ├─ Monochrome P logo (with sparkles)
        ├─ Enter first & last name
        ├─ Lemni geometric background
        └─ "Get Started" button
              ↓
              Submit name
              ↓

Step 4: SUBSCRIBE
        http://localhost:3000/subscribe.html
        ├─ Cycling chat messages (Alex ↔ Krijn)
        ├─ Base: $6.99/mo (Smart AI Coach)
        ├─ 6 optional add-ons (toggle ON/OFF)
        ├─ Info tooltips (hover 'i' icons)
        ├─ Dynamic pricing ($6.99 - $11.98)
        └─ "Upgrade" or "Start Free Trial"
              ↓
              Choose plan
              ↓

Step 5: TUTORIAL (NEW!)
        http://localhost:3000/tutorial.html
        ├─ "Build Your First Coach" title
        ├─ Video player (16:9 aspect ratio)
        ├─ Play button (circular, glass effect)
        └─ "Skip Tutorial" button
              ↓
              Watch video OR skip
              ↓

Step 6: DASHBOARD
        http://localhost:3000/
        ├─ AI Chat Assistant
        ├─ Tweet Tracker
        ├─ Schedule viewer
        └─ Full access to features
```

---

## 🎯 Page Details

### **1. Homepage** (`/`)
- **Purpose**: Landing page, first impression
- **Design**: Dark Lemni theme
- **CTA**: "Try For Free" → Login

### **2. Login** (`/login.html`)
- **Purpose**: Authentication
- **Method**: Discord OAuth
- **Design**: Light Lemni, monochrome P logo
- **Next**: Setup page after OAuth

### **3. Setup** (`/setup.html`)
- **Purpose**: Collect user info
- **Fields**: First name, last name
- **Design**: Light Lemni, monochrome P logo
- **Storage**: localStorage
- **Next**: Subscribe page

### **4. Subscribe** (`/subscribe.html`)
- **Purpose**: Plan selection
- **Features**:
  - Cycling messages (Alex ↔ Krijn every 5s)
  - Base $6.99/mo (always included)
  - 6 optional add-ons with toggles
  - Info tooltips on hover
  - Dynamic price calculation
- **CTAs**: "Upgrade" or "Start Free Trial"
- **Next**: Tutorial page

### **5. Tutorial** (`/tutorial.html`) ⭐ **NEW!**
- **Purpose**: Onboarding education
- **Features**:
  - Video player (16:9)
  - Circular play button
  - Glass blur effect
  - Skip option
- **CTAs**: Watch video or "Skip Tutorial"
- **Next**: Main dashboard

### **6. Dashboard** (`/`)
- **Purpose**: Main application
- **Features**: AI Chat, Tweets, Schedule
- **Access**: Full feature access

---

## 💾 localStorage Data Flow

```javascript
// After Login (Step 2)
{
  "loginMethod": "discord",
  "discordAuthInitiated": "timestamp"
}

// After Setup (Step 3)
{
  "pathgenUser": {
    "firstName": "Alex",
    "lastName": "Smith",
    "loginMethod": "discord",
    "createdAt": "2025-11-05T..."
  },
  "userFirstName": "Alex",
  "userLastName": "Smith",
  "setupComplete": "true"
}

// After Subscribe (Step 4)
{
  "pathgenPlan": {
    "total": "9.99",
    "base": "Smart AI Coach ($6.99)",
    "addons": ["Gameplay Analysis", "Team Coaching"]
  }
}

// Trial Users (Step 4 - Free Trial)
{
  "pathgenTrial": {
    "startDate": "2025-11-05T...",
    "trialDays": 7
  }
}

// After Tutorial (Step 5)
{
  "tutorialCompleted": "true"
}
```

---

## 🔄 Cycling Messages on Subscribe Page

```
t = 0s:     Alex appears: "Hi [Name]! Super excited..."
t = 5s:     Alex fades out (0.5s)
t = 5.5s:   Krijn fades in: "Welcome! Try Pathgen for free..."
t = 10.5s:  Krijn fades out (0.5s)
t = 11s:    Alex fades back in
            ↻ Cycle repeats forever
```

---

## 📐 Design Consistency

| Page | Background | Logo | Theme |
|------|------------|------|-------|
| **Homepage** | Dark (#0A0A0A) | White P | Dark |
| **Login** | Light gradient | Black P (sparkles) | Light |
| **Setup** | Light gradient | Black P (sparkles) | Light |
| **Subscribe** | Gray (#F5F5F5) | None | Minimal |
| **Tutorial** | Gray (#F5F5F5) | None | Minimal |

---

## 🎨 Subscribe Page Specs

### **Messages**
- **Alex**: Purple gradient avatar (`#6366f1` → `#8b5cf6`)
- **Krijn**: Yellow gradient avatar (`#FFB800` → `#FFA000`)
- **Cycle**: 5 seconds each
- **Transition**: 0.5s fade

### **Pricing**
- **Base**: $6.99/mo (Smart AI Coach)
- **Range**: $6.99 - $11.98/mo
- **Centered**: 32px margin top/bottom

### **Dimensions**
- **Width**: 380px
- **Title**: 1.75rem
- **Price**: 1.5rem
- **Features**: 13px
- **Buttons**: 13px
- **Toggles**: 36×20px

---

## 🎬 Tutorial Page Specs

### **Video Player**
- **Aspect**: 16:9
- **Width**: 100% (max 680px)
- **Background**: Black (#1A1A1A)
- **Border**: 16px radius
- **Shadow**: `0 4px 16px rgba(0,0,0,0.15)`

### **Play Button**
- **Size**: 80px diameter
- **Style**: Glass effect (blur + transparency)
- **Color**: White with opacity
- **Border**: 3px white (30% opacity)
- **Hover**: Scales to 1.05x

### **Skip Button**
- **Style**: Gray (`#E8E8E8`)
- **Font**: 14px semibold
- **Shadow**: Crisp drop shadow
- **Action**: Skip to dashboard

---

## 🚀 Testing the Flow

### **Full Flow Test**
```bash
1. Visit: http://localhost:3000/
2. Click "Try For Free"
3. Click "Continue with Discord"
4. (After OAuth) Enter your name
5. Click "Get Started"
6. Toggle some features
7. Click "Upgrade"
8. Watch tutorial OR click "Skip Tutorial"
9. Arrive at dashboard
```

### **Quick Tests**
- **Messages**: http://localhost:3000/subscribe.html (watch cycling)
- **Tutorial**: http://localhost:3000/tutorial.html (see video player)
- **Full flow**: Start at http://localhost:3000/

---

## 📝 To-Do (Optional Enhancements)

### **Tutorial Page**
- [ ] Add actual tutorial video file
- [ ] Video progress tracking
- [ ] Multiple tutorial videos
- [ ] Chapter markers
- [ ] Closed captions

### **Subscribe Page**
- [ ] Payment integration (Stripe)
- [ ] Discount code input
- [ ] Annual billing option
- [ ] FAQ section

### **User Flow**
- [ ] Email verification
- [ ] Onboarding checklist
- [ ] Progress indicators
- [ ] Account activation email

---

## ✅ Current Status

**Pages Complete: 6**
1. ✅ Homepage (`/`)
2. ✅ Login (`/login.html`)
3. ✅ Setup (`/setup.html`)
4. ✅ Subscribe (`/subscribe.html`)
5. ✅ Tutorial (`/tutorial.html`) ⭐ NEW!
6. ✅ Chat (`/chat.html`)
7. ✅ Tweets (`/tweets.html`)

**User Flow: Complete** 🎉
- Login → Setup → Subscribe → Tutorial → Dashboard

**Design System: Consistent** ✨
- Lemni-inspired throughout
- Monochrome P logo
- Professional polish

---

**Ready for users!** 🚀

**Test the full flow**: http://localhost:3000/

