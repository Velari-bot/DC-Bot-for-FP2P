# Twitter Scraper Setup

Self-hosted Twitter scraping using Python. Choose one method:

## Option 1: Simple Scraper (Recommended - No Dependencies)

Uses basic HTTP requests and BeautifulSoup. Easiest to set up.

**Install:**
```bash
pip install requests beautifulsoup4
```

**Use:** `simple_scraper.py`

## Option 2: twscrape (Fast, Async)

Professional scraper with account management. Requires Twitter accounts configured.

**Install:**
```bash
pip install twscrape
```

**Setup accounts:**
```bash
twscrape add_accounts accounts.txt username:password:email:email_password
```

**Use:** `twitter_scraper.py`

## Option 3: Scweet (Browser-based)

Uses Selenium/Playwright. More reliable but slower.

**Install:**
```bash
pip install scweet selenium
```

**Use:** `scweet_scraper.py`

## Configuration

Edit the script file to configure:
- `TARGET_USERS`: List of usernames to scrape
- `MAX_TWEETS_PER_USER`: Limit per user
- `EXCLUDE_RETWEETS`: Filter retweets
- `EXCLUDE_REPLIES`: Filter replies

## Testing

Test the scraper directly:
```bash
python scripts/simple_scraper.py
```

Or via API:
```bash
curl http://localhost:3000/api/twitter/scrape
```

## Scheduling

Set up a cron job or serverless scheduler to call `/api/twitter/scrape` every 5-15 minutes.

