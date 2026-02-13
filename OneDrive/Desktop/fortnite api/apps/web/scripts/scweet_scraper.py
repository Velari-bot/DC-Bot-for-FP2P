#!/usr/bin/env python3
"""
Self-hosted Twitter scraper using Scweet (simpler alternative)
Fetches tweets from target accounts and outputs JSON for ingestion
"""

import json
import sys
import os
from datetime import datetime
from typing import List, Dict, Optional

# Try importing Scweet
try:
    from scweet.scweet import scrape
    SCWEET_AVAILABLE = True
except ImportError:
    SCWEET_AVAILABLE = False
    print("Warning: scweet not installed. Install with: pip install scweet", file=sys.stderr)


# Configuration
TARGET_USERS = ["KinchAnalytics", "osirion_gg"]
MAX_TWEETS_PER_USER = 50
EXCLUDE_RETWEETS = True
EXCLUDE_REPLIES = True


def scrape_user_tweets(username: str) -> List[Dict]:
    """Fetch latest tweets from a user using Scweet"""
    tweets = []
    
    try:
        # Scrape user tweets
        data = scrape(
            users=[username],
            limit=MAX_TWEETS_PER_USER,
            interval=1,
            headless=True,
            display_type="Latest",
            resume=False,
            save_dir="",
            filter_replies=EXCLUDE_REPLIES,
        )
        
        if data is None or len(data) == 0:
            return tweets
        
        for tweet in data:
            # Filter retweets
            if EXCLUDE_RETWEETS:
                if tweet.get('isRetweet') or tweet.get('Tweet', '').startswith('RT @'):
                    continue
            
            # Skip empty tweets
            text = tweet.get('Tweet', '').strip()
            if not text or len(text) < 10:
                continue
            
            tweet_id = tweet.get('ID', '')
            if not tweet_id:
                continue
            
            tweet_data = {
                "id": str(tweet_id),
                "text": text,
                "createdAt": tweet.get('Timestamp', datetime.utcnow().isoformat()),
                "username": username,
                "url": tweet.get('Tweet URL', f"https://twitter.com/{username}/status/{tweet_id}"),
                "isRetweet": tweet.get('isRetweet', False),
                "isReply": tweet.get('isReply', False),
            }
            
            tweets.append(tweet_data)
            
    except Exception as e:
        print(f"Error fetching tweets for {username}: {str(e)}", file=sys.stderr)
    
    return tweets


def main():
    """Entry point"""
    if not SCWEET_AVAILABLE:
        result = {
            "success": False,
            "error": "scweet not installed. Install with: pip install scweet",
            "tweets": {}
        }
        print(json.dumps(result))
        return
    
    try:
        all_tweets = {}
        
        for username in TARGET_USERS:
            print(f"Fetching tweets for {username}...", file=sys.stderr)
            tweets = scrape_user_tweets(username)
            all_tweets[username] = tweets
            print(f"Found {len(tweets)} tweets for {username}", file=sys.stderr)
        
        result = {
            "success": True,
            "tweets": all_tweets,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        result = {
            "success": False,
            "error": str(e),
            "tweets": {}
        }
        print(json.dumps(result))


if __name__ == "__main__":
    main()

