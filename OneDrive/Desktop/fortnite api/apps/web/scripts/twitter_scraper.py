#!/usr/bin/env python3
"""
Self-hosted Twitter scraper using twscrape
Fetches tweets from target accounts and outputs JSON for ingestion
"""

import json
import sys
import os
from datetime import datetime
from typing import List, Dict, Optional

# Try importing twscrape, fallback to requests if not available
try:
    from twscrape import API, gather
    import asyncio
    TWSCRAPE_AVAILABLE = True
except ImportError:
    TWSCRAPE_AVAILABLE = False
    print("Warning: twscrape not installed. Install with: pip install twscrape", file=sys.stderr)

# Configuration
TARGET_USERS = ["KinchAnalytics", "osirion_gg"]
MAX_TWEETS_PER_USER = 50
EXCLUDE_RETWEETS = True
EXCLUDE_REPLIES = True


async def fetch_user_tweets(api: API, username: str) -> List[Dict]:
    """Fetch latest tweets from a user"""
    tweets = []
    
    try:
        # Fetch user timeline tweets
        async for tweet in api.user_timeline(username, limit=MAX_TWEETS_PER_USER):
            # Filter retweets
            if EXCLUDE_RETWEETS and (tweet.rawContent.startswith('RT @') or hasattr(tweet, 'retweetedTweet') and tweet.retweetedTweet):
                continue
            
            # Filter replies
            if EXCLUDE_REPLIES and tweet.inReplyToStatusId:
                continue
            
            # Skip empty tweets
            text = tweet.rawContent or tweet.fullText or ""
            if not text or len(text.strip()) < 10:
                continue
            
            tweet_data = {
                "id": str(tweet.id),
                "text": text.strip(),
                "createdAt": tweet.date.isoformat() if hasattr(tweet, 'date') and tweet.date else datetime.utcnow().isoformat(),
                "username": username,
                "url": f"https://twitter.com/{username}/status/{tweet.id}",
                "isRetweet": tweet.rawContent.startswith('RT @') if tweet.rawContent else False,
                "isReply": bool(tweet.inReplyToStatusId),
            }
            
            tweets.append(tweet_data)
            
    except Exception as e:
        print(f"Error fetching tweets for {username}: {str(e)}", file=sys.stderr)
    
    return tweets


async def scrape_tweets() -> Dict:
    """Main scraping function"""
    if not TWSCRAPE_AVAILABLE:
        return {
            "success": False,
            "error": "twscrape not installed. Install with: pip install twscrape",
            "tweets": []
        }
    
    try:
        # Initialize API (uses default account pool)
        api = API()
        
        all_tweets = {}
        
        for username in TARGET_USERS:
            print(f"Fetching tweets for {username}...", file=sys.stderr)
            tweets = await fetch_user_tweets(api, username)
            all_tweets[username] = tweets
            print(f"Found {len(tweets)} tweets for {username}", file=sys.stderr)
        
        return {
            "success": True,
            "tweets": all_tweets,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "tweets": []
        }


def main():
    """Entry point"""
    if sys.platform == "win32":
        # Windows event loop policy
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    
    result = asyncio.run(scrape_tweets())
    print(json.dumps(result))


if __name__ == "__main__":
    main()

