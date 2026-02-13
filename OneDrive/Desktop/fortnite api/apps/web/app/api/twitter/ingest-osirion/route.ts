import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import {
  processTweetsForIngestion,
  stripUsernames,
  ProcessedTweet,
  FilterOptions,
} from '@/lib/twitter-ingestion';

// Image descriptions mapped to tweets (for reference - actual URLs would come from Twitter API)
const TWEET_IMAGES: Record<string, { descriptions: string[]; urls?: string[] }> = {
  'osirion-2024-12-05-3': {
    descriptions: [
      'Weapon inventory UI showing tactical pistol, enforcer AR, sweeper shotgun with +5% indicators, and vaulted weapons (burst assault rifle, flapjack rifle, rapid fire SMG, revolver, six shooter) with 0% indicators'
    ],
  },
  'osirion-2024-12-05-2': {
    descriptions: [
      'Dropmap generator interface showing island map with numbered markers, data filters panel, and settings for generating dropmaps'
    ],
  },
  'osirion-2024-12-05-1': {
    descriptions: [
      'Zone/storm table showing zone parameters: radius, damage, distance from last center (min/max), times (wait/shrink/total), and surge player thresholds for solo/duo/trio/squads',
      'Map view showing concentric white circles labeled Zone 3 through Zone 12, indicating shrinking play areas'
    ],
  },
  'osirion-2024-12-01-2': {
    descriptions: [
      'Zone/storm table with updated parameters for zones 0-12',
      'Map view showing zone circles on island terrain'
    ],
  },
  'osirion-2024-12-01-5': {
    descriptions: [
      'Boss locations map showing island with green circular markers indicating spawn likelihood percentages (3.2% to 4.5%) for boss locations across different biomes'
    ],
  },
  'osirion-2024-12-04': {
    descriptions: [
      'Loot pool configuration interface showing different loot categories (Ammo Box, Chest, Cooler, Floor Loot, Supply Drop) with item icons and spawn rates'
    ],
  },
};

// Raw tweets from @osirion_gg with associated images
const OSIRION_TWEETS = [
  {
    id: 'osirion-2024-12-05-1',
    text: `HUGE COMP RELOAD UPDATE (storm again...)

- jumping from bus deploys glider lower: 40m -> 35m

- jump pads deploy glider lower: 35m -> 25m

storm:

- starts moving/partial in 4th zone

- zone count 13 -> 12 

radii reduced

2nd: 425m -> 300m

3rd: 320m -> 265m

4th: 265m -> 200m

5th: 205m -> 120m

6th: 140m -> 60m

7th: 115m -> 25m

8th: 85m -> 16.5m

9th: 65m -> 10.9m

10th: 37.5m -> 10.8m

11th: 18m -> 0m

shrink time:

2nd: 50s -> 120s

3rd: 45s -> 80s

4th: 45s -> 70s

5th: 40s -> 70s

6th: 35 -> 60s

7/8/9/10: 35 -> 60s

11: 75 -> 75 (unchanged)

wait time:

1st: 50 -> 60

2nd: 60 -> 40

3rd: 50 -> 30

4th: 50 -> 30

5th: 45 -> 30

6th: 40 -> 30

7th: 40 -> 20

8th: 35 -> 0

9th: 30 -> 0`,
    createdAt: '2024-12-05T00:00:00Z',
  },
  {
    id: 'osirion-2024-12-05-2',
    text: `since the glider deploy height has changed old dropmaps will no longer work. good thing that the osirion dropmap generator automatically pulls the latest data and generates always uptodate dropmaps

get one free dropmap for any place on http://osirion.gg and unlimited with`,
    createdAt: '2024-12-05T00:00:00Z',
  },
  {
    id: 'osirion-2024-12-05-3',
    text: `RELOAD CHANGES

unvaulted:

- tactical pistol

- enforcer ar

vaulted:

- burst assault rifle

- flapjack rifle

- rapid fire smg

- revolver

- six shooter`,
    createdAt: '2024-12-05T00:00:00Z',
  },
  {
    id: 'osirion-2024-12-05-4',
    text: `HUGE BR HOTFIX (no storms for once)

- self revives are now faster 10s -> 8s

- grenades are now less common

- made sniper ammo more expensive 3 -> 10

- reduced sniper ammo from vending machines 30 -> 10

- vehicles always spawn with full fuel

- reboot vans use less fuel when boosting 2.2x -> 1.8x

- surfing boost players higher and at a higher angle

- reduced shooting gallery playable rounds 4 -> 2

- increased enforcer aim assist range: 250m -> 275m`,
    createdAt: '2024-12-05T00:00:00Z',
  },
  {
    id: 'osirion-2024-12-04',
    text: `NEW MODES SUPPORTED

the new reload surf city map and the blitz starfall island map are now both supported on our hypermap

and we have also added the loot pool of the new reload map to the website`,
    createdAt: '2024-12-04T00:00:00Z',
  },
  {
    id: 'osirion-2024-12-03',
    text: `ANOTHER COMP STORM UPDATE

5th and 6th zone dont pull as far anymore

5th: 400m -> 325m

6th: 250m -> 200m

and radiuses are adjusted a bit

3rd: 550m -> 525m

4th: 400m -> 325m

5th: 250m -> 200m`,
    createdAt: '2024-12-03T00:00:00Z',
  },
  {
    id: 'osirion-2024-12-02',
    text: `CHEST SPAWNRATE INCREASED

epic has just increased the chance of chests spawning from ~48% to 60%`,
    createdAt: '2024-12-02T00:00:00Z',
  },
  {
    id: 'osirion-2024-12-01-1',
    text: `STORMS FIXED AND NET SURGE BACK

after some very interesting updates epic has finally managed to make the storms the way they want them to be

moving/partial zones work, not all zones end at innloop and its not just randomly fully closing and going back out

and they have just reenabled net surge again`,
    createdAt: '2024-12-01T00:00:00Z',
  },
  {
    id: 'osirion-2024-12-01-2',
    text: `BR COMP STORM UPDATE

moving zone starts 1 zone earlier and some move a bit further

changes:

everything not mentioned is unchanged

radius:

zone 4: 440m -> 400m

zone 6: 120m -> 100m

zone 7: 60m -> 70m

zone 8: 40m -> 25m

zone 9: 20m -> 11m

shrink times: 

zone 5: 75s -> 70s`,
    createdAt: '2024-11-30T00:00:00Z',
  },
  {
    id: 'osirion-2024-12-01-3',
    text: `wait times have changed too:

zone 3: 80s -> 50s

zone 7: 45s -> 35s

zone 8: 35s -> 20s

zone 9: 20s -> 0s`,
    createdAt: '2024-11-30T00:00:00Z',
  },
  {
    id: 'osirion-2024-12-01-4',
    text: `note: zones are bugged atm. these are the configured values, but the game has a bug so it doesnt properly follow these values. wait for a fix`,
    createdAt: '2024-12-01T00:00:00Z',
  },
  {
    id: 'osirion-2024-12-01-5',
    text: `C7S1 BOSS LOCATIONS🫡

if you kill them, you can become them - gain extra health and 100 overshield every 90s (not in comp)

in casual, the bosses just spawn there🙏

in comp, the bosses start on the bus💀

instead, they jump out of bus at random points and fly to their spots🧵`,
    createdAt: '2024-12-01T00:00:00Z',
  },
  {
    id: 'osirion-2024-12-01-6',
    text: `but the bosses don't skydive and glide like players do. 

instead, they look like this fire meteor. you'll see them on the map when they're within 200m of you.`,
    createdAt: '2024-12-01T00:00:00Z',
  },
  {
    id: 'osirion-2024-12-01-7',
    text: `here's how we found out something was off with their spawn locations in comp👀`,
    createdAt: '2024-12-01T00:00:00Z',
  },
  {
    id: 'osirion-2024-11-30',
    text: `CHAOS CHAMPION SURFING UPDATE

epic has just enabled surfing for the solo tournament playlist

epic had mentioned that this will be the only tournament that will have surfing instead of a battle bus

this change only affects tournaments and wont affect tournament settings/scrims`,
    createdAt: '2024-11-30T00:00:00Z',
  },
];

async function ingestTweet(
  username: string, 
  tweetText: string, 
  tweetId: string,
  images?: string[],
  imageDescriptions?: string[]
): Promise<boolean> {
  try {
    // Strip usernames before saving (privacy protection)
    const cleanedText = stripUsernames(tweetText);
    
    const memoryData = {
      source: 'twitter',
      author: username,
      content: cleanedText.trim(),
      images: images || [],
      imageDescriptions: imageDescriptions || [],
      tweetId: tweetId, // Store tweet ID to link images to specific tweet
      createdAt: new Date(),
      timestamp: Date.now(),
    };

    await db.collection('memories').add(memoryData);
    return true;
  } catch (error: any) {
    console.error(`[INGEST] Failed to ingest tweet for ${username}:`, error.message);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('🚀 Starting Osirion tweet ingestion...\n');

    // Convert to ProcessedTweet format
    const processedTweets: ProcessedTweet[] = OSIRION_TWEETS.map(tweet => ({
      id: tweet.id,
      text: tweet.text,
      createdAt: tweet.createdAt,
      username: 'osirion_gg',
    }));

    console.log(`📊 Processing ${processedTweets.length} tweets...`);

    // Apply comprehensive filtering and safety checks
    const filterOptions: FilterOptions = {
      removeRetweets: true,
      removeReplies: false, // Keep replies as they may contain useful info
      removePromoted: true,
      removeDuplicates: true,
    };

    const { safe, rejected } = await processTweetsForIngestion(processedTweets, filterOptions);
    
    console.log(`✅ ${safe.length} tweets passed safety checks`);
    console.log(`❌ ${rejected.length} tweets filtered out\n`);

    let processed = 0;
    let errors = 0;

    // Ingest safe tweets with associated images
    for (const tweet of safe) {
      // Get associated images for this tweet
      const imageData = TWEET_IMAGES[tweet.id] || { descriptions: [], urls: [] };
      
      const success = await ingestTweet(
        tweet.username, 
        tweet.text,
        tweet.id,
        imageData.urls,
        imageData.descriptions
      );
      
      if (success) {
        processed++;
        const imageCount = (imageData.descriptions?.length || 0) + (imageData.urls?.length || 0);
        const imageNote = imageCount > 0 ? ` (${imageCount} image${imageCount > 1 ? 's' : ''})` : '';
        console.log(`✅ Ingested: ${tweet.id.substring(0, 30)}...${imageNote}`);
      } else {
        errors++;
        console.error(`❌ Failed: ${tweet.id}`);
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: processedTweets.length,
        processed,
        errors,
        filtered: rejected.length,
      },
      message: `Successfully ingested ${processed} tweets from @osirion_gg`,
    });
  } catch (error: any) {
    console.error('[INGEST] Fatal error:', error);
    return NextResponse.json(
      { 
        error: 'Ingestion failed', 
        message: error.message 
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}

