# 🚀 How to Run PathGen AI

## Quick Start (Easiest Method)

### Using the PowerShell Script

```powershell
# Simply run this command from the fortnite-core directory:
.\START-SERVER.ps1
```

This will:
- Stop any existing Node processes
- Start the API server on **port 3000**
- Serve the HTML files

Then open your browser to:
- **http://localhost:3000**

## Manual Setup

### 1️⃣ Install Dependencies

```bash
cd fortnite-core
npm install
```

### 2️⃣ Build the Packages

```bash
npm run build
```

### 3️⃣ Start the API Server

```bash
cd packages/api
npm start
```

The server will start on **http://localhost:3000**

### 4️⃣ Access the Application

Open your browser and navigate to:

- **Landing Page**: http://localhost:3000/index.html
- **AI Chat**: http://localhost:3000/chat.html ✨ (Main feature)
- **Login**: http://localhost:3000/login.html
- **Setup**: http://localhost:3000/setup.html

## 📁 Project Structure

```
fortnite-core/
├── public/
│   ├── index.html          # Landing page with new navbar
│   ├── chat.html           # AI Chat interface ✨ (Main feature)
│   ├── login.html          # Authentication (no navbar)
│   ├── setup.html          # User setup (no navbar)
│   ├── subscribe.html      # Subscription page
│   └── tutorial.html       # Tutorial page
├── packages/
│   ├── api/                # Express server (port 3000)
│   └── ai-assistant/       # AI backend integration
├── START-SERVER.ps1        # Quick start script for Windows
└── package.json
```

## 🎨 New Navbar Design

All pages (except login and setup) now have the sleek navbar with:
- 🟣 **Purple glow effect** - Glowing outline matching the reference
- 🔘 **Pill-shaped design** - Fully rounded with 50px border radius
- 🎯 **Centered floating navbar** - Fixed at top, always visible
- ✨ **Backdrop blur** - Semi-transparent with blur effect

### Navigation Links:
- **Docs**
- **Features** (with dropdown caret ▼)
- **Tournaments**
- **GitHub** (with external link arrow ↗)
- **Pricing**
- **Try For Free** (CTA button with purple glow and → arrow)

## 🤖 AI Chat Features

The **chat.html** page includes ALL requested features:

### ✅ Welcome State
- Personalized greeting: "Nice to see you, [Username]. What's new?"
- 8 suggestion pills in responsive grid
- Click to auto-fill suggestions

### ✅ Message Interface
- **User messages**: Blue bubbles (#4f8cff), right-aligned
- **AI messages**: Dark gray bubbles (#1a1a1a), left-aligned
- Timestamps on all messages
- **Copy** and **Regenerate** buttons on AI messages
- **Bold text parsing**: `**text**` → bold

### ✅ Input Section (Sticky Bottom)
- **Model preview**: Shows which AI model will be used
- Rounded pill input field
- **Blue circular send button** with ↑ arrow
- **Loading spinner** when processing
- Auto-resize textarea

### ✅ Animations
- Message fade-in + slide-up
- 50ms stagger between messages
- Bouncing loading dots (0ms, 150ms, 300ms delays)
- Smooth transitions (0.2s ease)

### ✅ Credit System
- "💎 Ready to chat • 1 credit per message"
- Insufficient credits warning
- "Get Credits" button when needed

### ✅ Smart Features
- Auto-scroll to new messages
- Enter to send, Shift+Enter for new line
- Works offline with intelligent mock responses
- Context-aware AI responses

## 🧪 Testing the AI Chat

The AI has **built-in mock responses** for testing:

1. Open **http://localhost:3000/chat.html**
2. Try these questions:
   - "How can I improve at Fortnite?"
   - "What are the best drop spots?"
   - "Help me with building techniques"
   - "How do I improve my aim?"
   - "What tournaments are coming up?"

The AI will respond intelligently even without additional backend setup!

## 🔧 Troubleshooting

### Port 3000 Already in Use
```powershell
# Find and kill the process
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process

# Or use the script (it auto-kills existing processes)
.\START-SERVER.ps1
```

### Server Won't Start
```bash
# Make sure dependencies are installed
cd packages/api
npm install

# Build TypeScript files
npm run build

# Then start
npm start
```

### AI Not Responding
- The chat has **built-in mock responses** that work offline
- For real AI backend, ensure `packages/ai-assistant` is configured
- Check browser console (F12) for error messages

## 📱 Responsive Design

- **Desktop**: 4-column suggestion grid, full navbar
- **Tablet**: 3-column grid
- **Mobile**: 1-2 column grid, simplified navbar

## 🎮 Quick Test Commands

```powershell
# Windows (PowerShell) - Recommended
.\START-SERVER.ps1

# Alternative: Manual start
cd packages/api
npm start

# Then open: http://localhost:3000/chat.html
```

## 💡 Development Tips

### Hot Reload
The server will need to be restarted for code changes in the API. HTML changes can be viewed by refreshing the browser.

### Adding Real AI
To connect to OpenAI or other AI services:
1. Configure `.env` in `packages/ai-assistant`
2. Add your API keys
3. Rebuild and restart the server

### Customizing the Navbar
The navbar is now consistent across all pages. Edit the styles in each HTML file's `<style>` section to customize further.

---

**Ready to Coach!** Open http://localhost:3000/chat.html and start improving your Fortnite game! 🎮✨
