# 🎮 PathGen AI - Quick Start Guide

## ⚡ Easiest Way to Run (Windows)

### Option 1: PowerShell Script (Recommended)

```powershell
# Just double-click or run:
.\START-SERVER.ps1
```

Then open: **http://localhost:3000/chat.html**

---

## 🔧 Manual Method

### Step 1: Install Dependencies

```bash
cd fortnite-core
npm install
```

### Step 2: Build the Project

```bash
npm run build
```

### Step 3: Start the Server

```bash
cd packages/api
npm start
```

Server will run on: **http://localhost:3000**

---

## 🌐 Access the App

Open your browser to:

| Page | URL | Description |
|------|-----|-------------|
| 🏠 **Landing** | http://localhost:3000/ | Homepage with purple glowing navbar |
| 💬 **AI Chat** | http://localhost:3000/chat.html | **Main feature - AI Fortnite Coach** |
| 🐦 **Tweets** | http://localhost:3000/tweets.html | Live tweet tracker |
| 🔐 **Login** | http://localhost:3000/login.html | Authentication |
| ⚙️ **Setup** | http://localhost:3000/setup.html | Initial setup |

---

## ✨ AI Chat Features (Fully Working!)

The AI chat works **immediately** without any additional setup:

### 📝 Try These Questions:
- "How can I improve at Fortnite?"
- "What are the best drop spots?"
- "Give me building tips"
- "How do I improve my aim?"
- "What tournaments are coming up?"

### 🎯 Features:
- ✅ **Smart AI responses** (works offline with mock data)
- ✅ **8 suggestion cards** (POI Analysis, Building, Aim Training, etc.)
- ✅ **Blue send button** with upward arrow
- ✅ **Copy & Regenerate** buttons
- ✅ **Bold text parsing** (`**text**`)
- ✅ **Credit system** tracking
- ✅ **Smooth animations** (fade-in, slide-up, bouncing dots)
- ✅ **Auto-scroll** to new messages
- ✅ **Model preview** ("Will use: ⚡ PathGen 4o-mini...")

---

## 🎨 New Navbar Design

All main pages now have the sleek navbar matching your reference:

### Design Features:
- 🟣 **Purple glow** around edges
- 🔘 **Pill-shaped** (fully rounded)
- 🌫️ **Backdrop blur** effect
- 📌 **Fixed floating** at top

### Navigation Items:
```
[P Logo] Pathgen v2 | Docs | Features ▼ | Tournaments | GitHub ↗ | Pricing | [Try For Free →]
```

---

## 🛑 Stopping the Server

Press **Ctrl + C** in the terminal where the server is running

Or kill all Node processes:
```powershell
Get-Process node | Stop-Process -Force
```

---

## 🐛 Troubleshooting

### "Port 3000 already in use"
```powershell
# Kill existing process
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
```

### "Cannot find module"
```bash
# Reinstall dependencies
npm install
npm run build
```

### Page Shows Blank
- Make sure server is running on port 3000
- Check browser console (F12) for errors
- Try: http://localhost:3000/chat.html

### AI Not Responding
- **Don't worry!** The chat has built-in intelligent mock responses
- It works immediately without any API keys
- Responses adapt to your questions

---

## 💡 Quick Test

```powershell
# 1. Start server
.\START-SERVER.ps1

# 2. Open browser
# Navigate to: http://localhost:3000/chat.html

# 3. Click a suggestion card or type:
"Give me building tips"

# 4. Watch the AI respond!
```

---

## 🚀 You're Ready!

The app is fully functional with:
- ✅ Sleek purple glowing navbar
- ✅ Working AI chat with mock responses
- ✅ Beautiful animations
- ✅ Credit system
- ✅ Copy/Regenerate features
- ✅ All 8 suggestion cards

**Just run `.\START-SERVER.ps1` and enjoy!** 🎮

