# Text Documents for AI Assistant

This folder contains text-only content (Discord messages, guides, tips, etc.) that the AI can reference.

## Structure

1. **Create text files** in this folder (`.txt` or `.md`):
   - Example: `duos-guide.txt`, `high-ping-tips.md`, `pinching-technique.txt`

2. **Add entries to `index.json`** in this folder:
   ```json
   [
     {
       "id": "doc-duos-guide",
       "title": "Duos Fighting Guide",
       "content": "duos-guide.txt",
       "author": "Coach Goat",
       "created_at": "2025-02-23T14:59:00Z",
       "tags": ["duos", "fighting", "pinching"]
     }
   ]
   ```

3. **The AI will automatically load and search these** when you run ingestion.

## Example Workflow

1. Copy your Discord message text into a file: `fortnite-core/data/docs/duos-tips.txt`
2. Add entry to `fortnite-core/data/docs/index.json`
3. Run `npm run ingest` from `fortnite-core/`
4. The AI can now cite this content in responses!

