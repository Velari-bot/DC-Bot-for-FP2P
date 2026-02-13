# 🤖 AI Chat Dashboard - User Guide

## Overview

The AI Chat Dashboard is a live, interactive interface for querying your Fortnite competitive intelligence system. It provides a ChatGPT-style experience with access to 224 records from multiple sources.

## 🌐 Access

**Direct Link:**
```
http://localhost:3000/chat.html
```

**From Tweet Tracker:**
Click the **🤖 AI Chat** button (bright green) on the main dashboard

## ✨ Features

### 1. Live Chat Interface
- 💬 **Real-time messaging** - Ask questions, get instant answers
- 🎨 **Dark mode UI** - Matches your gamer aesthetic (JetBrains Mono font)
- 💚 **Neon accents** - #00FFAA accent color throughout
- 📱 **Responsive design** - Works on all screen sizes

### 2. Intelligent Responses
- 🧠 **Context-aware** - Uses 224 records to answer
- 📚 **Source citations** - Shows where information came from
- 💬 **Conversation memory** - Remembers last 3 exchanges
- ⚡ **Fast responses** - <3 seconds with OpenAI, instant without

### 3. Quick Actions
Pre-built query buttons for common questions:
- 📅 **Tournaments** - Upcoming events
- ⚔️ **Weapon Changes** - Meta updates
- 📊 **FNCS Stats** - Competitive statistics
- 🎮 **What's New** - Latest updates

### 4. Example Queries
Click to instantly ask:
- "What tournaments are scheduled?"
- "What weapon changes happened recently?"
- "Show me the latest FNCS stats"
- "What did Osirion say about blinky fish?"
- "Tell me about the Springfield update"

## 🎯 How to Use

### Basic Chat

1. **Type your question** in the input field
2. **Press Enter** or click **Send 🚀**
3. **Wait for response** (typing indicator appears)
4. **View answer** with source citations

### Using Quick Actions

1. **Click any quick action button** (📅 Tournaments, ⚔️ Weapon Changes, etc.)
2. Pre-written query is sent automatically
3. Get instant response

### Using Example Queries

1. **Click any example** in the empty state
2. Query is populated and sent
3. Perfect for first-time users

### Navigation

- **📱 Tweet Tracker** - Back to live tweets
- **📅 Schedule** - View tournament calendar
- **📊 Raw Data** - See all ingested records

## 💬 What You Can Ask

### Tournament Questions
```
"What tournaments are scheduled?"
"When is the next solo tournament?"
"Tell me about eval cup"
"What's happening on November 24th?"
"Show me PlayStation Reload tournaments"
```

### Competitive Updates
```
"What weapon changes happened?"
"What did Osirion tweet recently?"
"Show me Kinch's latest stats"
"What's the current meta?"
"Tell me about the blinky fish nerf"
```

### Game Updates
```
"What's new in Fortnite?"
"Tell me about Springfield update"
"What items are in the shop?"
"Are there any leaks?"
"What happened in the last patch?"
```

### Data Queries
```
"What data do you have?"
"Show me all tournament info"
"What did FNcompReport say?"
"Give me competitive news"
```

## 🔧 Features Explained

### Message Types

**User Messages (Right side):**
- Green gradient background
- Your questions
- Timestamp shown

**AI Messages (Left side):**
- Dark card with border
- AI responses
- Source citations (when available)
- Timestamp shown

### Source Citations

When AI references data, you'll see:
```
📚 Sources (3)

@osirion_gg • Nov 4, 2025
BLINKY FISH REMOVED FROM NON FISHING HOLES...

@KinchAnalytics • Nov 4, 2025
🏆 Eval #1 Final - EU 🏆...
```

### Conversation History

The chat remembers your last 3 question/answer pairs for context:
- Ask follow-up questions
- Build on previous answers
- Natural conversation flow

## ⚙️ Current Mode

### Without OpenAI Key (Current)

**Capabilities:**
- ✅ Responds to all queries
- ✅ Uses keyword matching
- ✅ Accesses all 224 records
- ✅ Shows tournament schedule
- ✅ Cites weapon changes
- ✅ Displays FNCS stats
- ⚠️ Responses are template-based

**Example Response:**
```
I see you asked: "What tournaments are scheduled?"

Your system currently has 204 records ingested from:
- Epic CMS: 189 official records
- News RSS: 10 articles
- Fortnite-API: 5 items
- Twitter: 20 tweets

📅 Tournaments Scheduled (Simpsons Season):
- Nov 4: EVAL CUP
- Nov 7: QUICK RELOAD CUP
- Nov 8: DUO VCC
...
```

### With OpenAI Key (Upgrade)

**Additional Capabilities:**
- ✅ Semantic understanding
- ✅ Natural language responses
- ✅ Complex reasoning
- ✅ Multi-turn conversations
- ✅ Better context awareness

**To Enable:**
1. Get OpenAI API key from https://platform.openai.com/api-keys
2. Add to `.env`: `OPENAI_API_KEY=sk-...`
3. Run: `cd packages/ai-assistant && npm run ingest`
4. Restart server

## 🎨 UI Elements

### Colors
- **Background:** Deep dark blue (#0a0e27)
- **Cards:** Lighter dark blue (#1a1f3a)
- **Accent:** Neon green (#00FFAA)
- **Text:** Light grey (#e0e6ed)
- **User Messages:** Green gradient
- **AI Messages:** Purple gradient

### Typography
- **Font:** JetBrains Mono (monospace)
- **Sizes:** 0.75rem - 2.5rem
- **Weights:** 400, 500, 600, 700

### Animations
- **Message slide-in** - Smooth entry
- **Typing indicator** - Bouncing dots
- **Hover effects** - Glow on buttons
- **Smooth scrolling** - Auto-scroll to latest

## 💡 Tips

### Getting Better Responses

1. **Be specific:** "What did Osirion say about weapon changes on Nov 4?"
2. **Use keywords:** "tournament", "weapon", "meta", "stats"
3. **Ask follow-ups:** Build on previous answers
4. **Check sources:** See where data comes from

### Performance

- **Response time:** <1 second (without OpenAI)
- **Response time:** 1-3 seconds (with OpenAI)
- **Conversation memory:** Last 3 exchanges
- **Auto-scroll:** Smooth to latest message

### Keyboard Shortcuts

- **Enter** - Send message
- **Shift+Enter** - New line (in future update)

## 🔗 Integration

### Embed in Your App

The chat interface is standalone HTML. To embed:

```html
<iframe 
    src="http://localhost:3000/chat.html" 
    width="100%" 
    height="600px"
    style="border: none; border-radius: 12px;">
</iframe>
```

### API Integration

The chat uses `POST /api/chat`:

```javascript
const response = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
        query: 'What tournaments are scheduled?',
        conversation_history: []
    })
});

const data = await response.json();
console.log(data.response);
console.log(data.sources);
```

## 📊 Data Available

The AI has access to:
- ✅ **189 Epic CMS records** (tournaments, news, events)
- ✅ **10 news articles** (leaks, updates)
- ✅ **5 Fortnite-API items** (news, shop)
- ✅ **20 competitive tweets** (weapon changes, stats)
- ✅ **Tournament schedule** (18 days, Nov 4-25)

**Total: 224 records** ready for intelligent querying

## 🎯 Use Cases

### Tournament Planning
Ask about upcoming events, schedules, and rules

### Meta Analysis
Query weapon changes, nerfs, buffs from Osirion

### Competitive Stats
Get FNCS results and leaderboards from Kinch

### News Updates
Find latest patches, leaks, announcements

### General Info
Ask about anything Fortnite competitive

## 🚀 Future Enhancements

Potential additions:
- ⏳ Streaming responses (real-time typing)
- ⏳ Voice input/output
- ⏳ Image generation for stats
- ⏳ Export conversations
- ⏳ Share chat links
- ⏳ Dark/light mode toggle
- ⏳ Custom themes

## 🎮 You're Ready to Chat!

**Open the chat:**
```
http://localhost:3000/chat.html
```

**Or click** the bright green **🤖 AI Chat** button on the tweet tracker!

Start asking questions about Fortnite competitive scene! 🚀

---

**Need help? Check COMPLETE-SYSTEM-GUIDE.md**

