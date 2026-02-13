# Image Ingestion Guide

This guide explains how images are associated with tweets and ingested into the AI memory system.

## Overview

The Twitter ingestion system now supports storing images alongside tweet content. Images are:
- **Stored with their related tweet** - Each image is linked to a specific tweet via `tweetId`
- **Only shown with related content** - Images are retrieved together with their associated tweet content
- **Described for AI context** - Image descriptions help the AI understand what the image contains

## Data Structure

### Memory Document Structure
```typescript
{
  source: 'twitter',
  author: 'osirion_gg',
  content: 'Tweet text content...',
  images: ['https://pbs.twimg.com/media/...'], // Array of image URLs
  imageDescriptions: ['Description of what the image shows'], // Array of descriptions
  tweetId: 'osirion-2024-12-05-3', // Links images to specific tweet
  createdAt: Date,
  timestamp: number
}
```

## Image Association

Images are associated with tweets in two ways:

### 1. Manual Association (Osirion Tweets)

For the Osirion tweet ingestion, images are manually mapped to tweets:

```typescript
const TWEET_IMAGES: Record<string, { descriptions: string[]; urls?: string[] }> = {
  'osirion-2024-12-05-3': {
    descriptions: [
      'Weapon inventory UI showing tactical pistol, enforcer AR...'
    ],
  },
  // ...
};
```

### 2. Automatic Extraction

The system can automatically extract image URLs from:
- Tweet text (Twitter image URLs: `pbs.twimg.com`)
- `pic.twitter.com` links
- Twitter API metadata (if available)

## Usage

### Ingesting Tweets with Images

When ingesting tweets, include images in the request:

```typescript
await ingestTweet(
  username,
  tweetText,
  tweetId,
  imageUrls,        // Optional: Array of image URLs
  imageDescriptions // Optional: Array of descriptions
);
```

### API Endpoint

The memory ingestion API now accepts images:

```json
POST /api/memory/ingest
{
  "source": "twitter",
  "author": "osirion_gg",
  "content": "Tweet content...",
  "images": ["https://pbs.twimg.com/media/..."],
  "imageDescriptions": ["Description of image"]
}
```

## Image Types Supported

### 1. Weapon/UI Screenshots
- Weapon inventory interfaces
- Loot pool configurations
- Game UI elements

### 2. Map Visualizations
- Dropmap generators
- Zone/storm visualizations
- Boss location maps
- Island terrain views

### 3. Data Tables
- Zone parameter tables
- Storm timing data
- Spawn rate information

## Current Image Associations

The Osirion ingestion includes images for:

1. **Weapon Changes** (`osirion-2024-12-05-3`)
   - Weapon inventory UI showing vaulted/unvaulted weapons

2. **Dropmap Generator** (`osirion-2024-12-05-2`)
   - Interface showing dropmap generation tools

3. **Storm Updates** (`osirion-2024-12-05-1`, `osirion-2024-12-01-2`)
   - Zone parameter tables
   - Map visualizations with zone circles

4. **Boss Locations** (`osirion-2024-12-01-5`)
   - Map showing boss spawn locations with percentages

5. **Loot Pool** (`osirion-2024-12-04`)
   - Loot pool configuration interface

## Retrieving Images with Content

When querying memories, images are included in the response:

```json
GET /api/memory/list?author=osirion_gg
{
  "memories": [
    {
      "id": "...",
      "content": "Tweet text...",
      "images": ["https://..."],
      "imageDescriptions": ["Description..."],
      "tweetId": "osirion-2024-12-05-3"
    }
  ]
}
```

## AI Assistant Integration

When the AI assistant retrieves memories, it will:
1. Get the tweet content
2. Get associated images (if any)
3. Get image descriptions for context
4. Use all information together to provide accurate responses

The AI will only show images when discussing the related tweet content, ensuring context is maintained.

## Adding New Images

To add images to new tweets:

1. **If you have image URLs:**
   ```typescript
   {
     id: 'tweet-id',
     text: 'Tweet text...',
     images: ['https://pbs.twimg.com/media/...'],
     imageDescriptions: ['Description...']
   }
   ```

2. **If you only have descriptions:**
   ```typescript
   {
     id: 'tweet-id',
     text: 'Tweet text...',
     imageDescriptions: ['Description of what the image shows']
   }
   ```

3. **Update TWEET_IMAGES mapping:**
   ```typescript
   const TWEET_IMAGES: Record<string, { descriptions: string[]; urls?: string[] }> = {
     'tweet-id': {
       descriptions: ['Image description'],
       urls: ['https://...'] // Optional
     }
   };
   ```

## Best Practices

1. **Descriptive Image Descriptions**: Provide detailed descriptions that help the AI understand the image content
2. **Link Images to Content**: Always include `tweetId` to ensure images are only shown with related content
3. **Validate URLs**: Use `sanitizeUrl()` to ensure image URLs are safe
4. **Extract from Text**: Use `extractImageUrls()` to automatically find image URLs in tweet text

## Future Enhancements

- Automatic image URL extraction from Twitter API responses
- Image caching and optimization
- Thumbnail generation
- Image search capabilities
- OCR for text in images

