#!/usr/bin/env python3
"""
Twitter scraper using snscrape (free, no API needed)
Uses snscrape library which scrapes Twitter without authentication
"""

import json
import sys
import re
import time
from datetime import datetime
from typing import List, Dict

try:
    import snscrape.modules.twitter as sntwitter
    SNSCRAPE_AVAILABLE = True
except ImportError:
    SNSCRAPE_AVAILABLE = False
    print("Warning: snscrape not installed. Install with: pip install snscrape", file=sys.stderr)
    print("Alternative: pip install git+https://github.com/JustAnotherArchivist/snscrape.git", file=sys.stderr)


TARGET_USERS = ["KinchAnalytics", "osirion_gg"]
MAX_TWEETS_PER_USER = 20
EXCLUDE_RETWEETS = True
EXCLUDE_REPLIES = True


def scrape_user_tweets(username: str) -> List[Dict]:
    """Scrape tweets from user using snscrape"""
    tweets = []
    
    if not SNSCRAPE_AVAILABLE:
        return tweets
    
    try:
        # Use snscrape to get user tweets
        query = f"from:{username}"
        
        print(f"Querying: {query}", file=sys.stderr)
        
        count = 0
        for i, tweet in enumerate(sntwitter.TwitterSearchScraper(query).get_items()):
            if count >= MAX_TWEETS_PER_USER:
                break
            
            try:
                # Filter retweets
                if EXCLUDE_RETWEETS and (tweet.retweetedTweet is not None or (tweet.rawContent and tweet.rawContent.startswith('RT @'))):
                    continue
                
                # Filter replies
                if EXCLUDE_REPLIES and tweet.inReplyToTweetId is not None:
                    continue
                
                # Get tweet text
                text = tweet.rawContent or tweet.content or ""
                if not text or len(text.strip()) < 10:
                    continue
                
                # Extract tweet ID
                tweet_id = str(tweet.id)
                
                # Get date
                created_at = tweet.date.isoformat() if tweet.date else datetime.utcnow().isoformat()
                
                tweet_data = {
                    "id": tweet_id,
                    "text": text.strip(),
                    "createdAt": created_at,
                    "username": username,
                    "url": tweet.url or f"https://twitter.com/{username}/status/{tweet_id}",
                    "isRetweet": tweet.retweetedTweet is not None,
                    "isReply": tweet.inReplyToTweetId is not None,
                }
                
                tweets.append(tweet_data)
                count += 1
                
            except Exception as e:
                print(f"Error processing tweet {i}: {str(e)}", file=sys.stderr)
                continue
        
    except Exception as e:
        print(f"Error scraping {username}: {str(e)}", file=sys.stderr)
    
    return tweets


def main():
    """Entry point"""
    if not SNSCRAPE_AVAILABLE:
        result = {
            "success": False,
            "error": "snscrape not installed. Install with: pip install snscrape",
            "tweets": {}
        }
        print(json.dumps(result))
        return
    
    try:
        all_tweets = {}
        
        for username in TARGET_USERS:
            print(f"Scraping tweets for {username}...", file=sys.stderr)
            tweets = scrape_user_tweets(username)
            all_tweets[username] = tweets
            print(f"Found {len(tweets)} tweets for {username}", file=sys.stderr)
            time.sleep(2)  # Rate limiting
        
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

