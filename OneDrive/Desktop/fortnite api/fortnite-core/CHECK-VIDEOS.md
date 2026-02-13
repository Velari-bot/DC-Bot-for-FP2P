# 📋 How to Check Video Setup

## Quick Check Commands

### 1. Check All Videos Are Digested
```bash
cd fortnite-core/data/videos
node check-videos.js
```

This will show:
- ✅ Total videos in index
- ✅ Total .txt files
- ✅ Missing files
- ✅ Empty files
- ✅ Sample file sizes

### 2. Test AI Assistant Can Load Videos
```bash
cd fortnite-core
node test-ai-videos.js
```

This will verify:
- ✅ AI assistant can load video data
- ✅ Videos are properly chunked
- ✅ Content is accessible

## Current Status

✅ **All 97 videos are properly digested!**
- All .txt files exist
- All files have content
- All transcript references are valid
- AI assistant can load and access them

## What the AI Assistant Sees

The AI assistant loads videos as **chunks** for better retrieval:
- **97 videos** → **2,177 chunks**
- Each chunk is ~500 characters
- Chunks allow the AI to find specific parts of videos

## Troubleshooting

### If videos are missing:
1. Check `fortnite-core/data/videos/index.json` has all video entries
2. Ensure corresponding `.txt` files exist in the same directory
3. Run `node check-videos.js` to see which ones are missing

### If AI can't load videos:
1. Make sure you've built the packages: `npm run build`
2. Check that `.env` has `OPENAI_API_KEY` set (optional but recommended)
3. Run `node test-ai-videos.js` to see specific errors

## Files Created

- `check-videos.js` - Quick verification script
- `test-ai-videos.js` - AI assistant loading test

