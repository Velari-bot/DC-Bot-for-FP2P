import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

/**
 * Fortnite API Ingestion Endpoint
 * Fetches data from both Fortnite-API.com and FortniteAPI.io
 * and stores it in the memory system for AI access
 */

interface FortniteApiRecord {
  id: string;
  source: 'fortnite-api-com' | 'fortniteapi-io';
  type: string;
  title?: string;
  content: string;
  metadata?: any;
  createdAt: string;
  url?: string;
  tags?: string[];
}

async function fetchFortniteApiCom(apiKey?: string): Promise<FortniteApiRecord[]> {
  const records: FortniteApiRecord[] = [];
  const baseUrl = 'https://fortnite-api.com/v2';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (apiKey) {
    headers['Authorization'] = apiKey;
  }

  try {
    // Fetch news
    try {
      const newsResponse = await fetch(`${baseUrl}/news`, {
        headers,
        next: { revalidate: 3600 },
      });

      if (newsResponse.ok) {
        const newsData = await newsResponse.json();
        
        if (newsData.data?.br?.motds) {
          for (const item of newsData.data.br.motds) {
            const metadata: any = {};
            if (item.image) metadata.image = item.image;
            if (item.tabTitleOverride) metadata.tabTitle = item.tabTitleOverride;

            const newsRecord: any = {
              id: `fnapi-com-news-${item.id || Date.now()}`,
              source: 'fortnite-api-com',
              type: 'news',
              title: item.title || 'Battle Royale News',
              content: item.body || item.title || '',
              createdAt: item.startTime || new Date().toISOString(),
              tags: ['news', 'battle-royale', 'fortnite-api-com'],
            };

            if (item.link) {
              newsRecord.url = item.link;
            }

            if (Object.keys(metadata).length > 0) {
              newsRecord.metadata = metadata;
            }

            records.push(newsRecord);
          }
        }
      }
    } catch (error: any) {
      console.error('[FORTNITE-API-COM] News fetch failed:', error.message);
    }

    // Fetch item shop
    try {
      const shopResponse = await fetch(`${baseUrl}/shop/br`, {
        headers,
        next: { revalidate: 3600 },
      });

      if (shopResponse.ok) {
        const shopData = await shopResponse.json();
        
        if (shopData.data) {
          const featuredCount = shopData.data.featured?.entries?.length || 0;
          const dailyCount = shopData.data.daily?.entries?.length || 0;
          const items = [
            ...(shopData.data.featured?.entries || []),
            ...(shopData.data.daily?.entries || []),
          ];

          const shopMetadata: any = {
            featuredCount,
            dailyCount,
          };
          if (shopData.data.hash) shopMetadata.hash = shopData.data.hash;
          
          shopMetadata.items = items.map((i: any) => {
            const itemData: any = { name: i.name };
            if (i.rarity?.value) itemData.rarity = i.rarity.value;
            if (i.type?.value) itemData.type = i.type.value;
            return itemData;
          });

          records.push({
            id: `fnapi-com-shop-${new Date().toISOString().split('T')[0]}`,
            source: 'fortnite-api-com',
            type: 'shop',
            title: 'Item Shop Update',
            content: `Item Shop updated with ${featuredCount} featured items and ${dailyCount} daily items. Featured: ${items.slice(0, 5).map((i: any) => i.name).join(', ')}${items.length > 5 ? '...' : ''}`,
            createdAt: new Date().toISOString(),
            tags: ['shop', 'cosmetics', 'items', 'fortnite-api-com'],
            metadata: shopMetadata,
          });
        }
      }
    } catch (error: any) {
      console.error('[FORTNITE-API-COM] Shop fetch failed:', error.message);
    }

    // Fetch events/tournaments
    try {
      const eventsResponse = await fetch(`${baseUrl}/events`, {
        headers,
        next: { revalidate: 3600 },
      });

      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        
        if (eventsData.data && Array.isArray(eventsData.data)) {
          for (const event of eventsData.data) {
            const eventMetadata: any = {
              type: 'event',
            };
            if (event.format) eventMetadata.format = event.format;
            if (event.region) eventMetadata.region = event.region;
            if (event.prizePool) eventMetadata.prizePool = event.prizePool;
            if (event.endTime) eventMetadata.endTime = event.endTime;

            const eventRecord: any = {
              id: `fnapi-com-event-${event.id}`,
              source: 'fortnite-api-com',
              type: 'event',
              title: event.name || event.title,
              content: `${event.name || 'Event'}: ${event.description || ''} Starting: ${event.startTime || 'TBA'}. ${event.prizePool ? `Prize Pool: ${event.prizePool}` : ''}`,
              createdAt: event.startTime || new Date().toISOString(),
              tags: ['tournament', 'event', 'competitive', 'fortnite-api-com'],
            };

            if (event.url) {
              eventRecord.url = event.url;
            }

            if (Object.keys(eventMetadata).length > 1) { // More than just 'type'
              eventRecord.metadata = eventMetadata;
            }

            records.push(eventRecord);
          }
        }
      }
    } catch (error: any) {
      console.error('[FORTNITE-API-COM] Events fetch failed:', error.message);
    }

    // Fetch map data
    try {
      const mapResponse = await fetch(`${baseUrl}/map`, {
        headers,
        next: { revalidate: 3600 },
      });

      if (mapResponse.ok) {
        const mapData = await mapResponse.json();
        
        if (mapData.data) {
          const pois = mapData.data.pois || [];
          const poisList = pois.map((poi: any) => poi.name).filter(Boolean);
          
          // Extract detailed POI information
          const poisDetails = pois.map((poi: any) => {
            const poiData: any = { name: poi.name };
            if (poi.location) {
              poiData.location = poi.location;
            }
            if (poi.id) poiData.id = poi.id;
            return poiData;
          });

          const mapMetadata: any = {
            poisCount: pois.length,
            pois: poisDetails,
          };

          if (mapData.data.images?.blank) mapMetadata.blankMap = mapData.data.images.blank;
          if (mapData.data.images?.pois) mapMetadata.poisMap = mapData.data.images.pois;
          if (mapData.data.images?.map) mapMetadata.mapImage = mapData.data.images.map;

          const mapRecord: any = {
            id: `fnapi-com-map-${new Date().toISOString().split('T')[0]}`,
            source: 'fortnite-api-com',
            type: 'map',
            title: 'Current Fortnite Map',
            content: `Current Fortnite map with ${pois.length} Points of Interest (POIs): ${poisList.slice(0, 15).join(', ')}${poisList.length > 15 ? ` and ${poisList.length - 15} more` : ''}. Key locations include major POIs, landmarks, and strategic areas for competitive play.`,
            createdAt: new Date().toISOString(),
            tags: ['map', 'pois', 'locations', 'fortnite-api-com'],
            metadata: mapMetadata,
          };
          records.push(mapRecord);
        }
      }
    } catch (error: any) {
      console.error('[FORTNITE-API-COM] Map fetch failed:', error.message);
    }

    console.log(`[FORTNITE-API-COM] Collected ${records.length} records`);
  } catch (error: any) {
    console.error('[FORTNITE-API-COM] Error:', error.message);
  }

  return records;
}

async function fetchFortniteApiIo(apiKey?: string): Promise<FortniteApiRecord[]> {
  const records: FortniteApiRecord[] = [];
  const baseUrl = 'https://fortniteapi.io/v2';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (apiKey) {
    headers['Authorization'] = apiKey;
  }

  try {
    // Fetch shop
    try {
      const shopResponse = await fetch(`${baseUrl}/shop`, {
        headers,
        next: { revalidate: 3600 },
      });

      if (shopResponse.ok) {
        const shopData = await shopResponse.json();
        
        if (shopData.shop) {
          const featured = shopData.shop.featured || [];
          const daily = shopData.shop.daily || [];
          
            const shopMetadata: any = {
              featuredCount: featured.length,
              dailyCount: daily.length,
              items: [...featured, ...daily].map((i: any) => ({
                name: i.name,
                rarity: i.rarity,
                type: i.type,
                price: i.price,
              })),
            };

            const shopRecord: any = {
              id: `fnapi-io-shop-${new Date().toISOString().split('T')[0]}`,
              source: 'fortniteapi-io',
              type: 'shop',
              title: 'Item Shop Update',
              content: `Item Shop updated with ${featured.length} featured items and ${daily.length} daily items. Featured: ${featured.slice(0, 5).map((i: any) => i.name).join(', ')}${featured.length > 5 ? '...' : ''}`,
              createdAt: new Date().toISOString(),
              tags: ['shop', 'cosmetics', 'items', 'fortniteapi-io'],
              metadata: shopMetadata,
            };
            records.push(shopRecord);
        }
      }
    } catch (error: any) {
      console.error('[FORTNITEAPI-IO] Shop fetch failed:', error.message);
    }

    // Fetch challenges
    try {
      const challengesResponse = await fetch(`${baseUrl}/challenges`, {
        headers,
        next: { revalidate: 3600 },
      });

      if (challengesResponse.ok) {
        const challengesData = await challengesResponse.json();
        
        if (challengesData.challenges) {
          const weekly = challengesData.challenges.weekly || [];
          const daily = challengesData.challenges.daily || [];
          
          if (weekly.length > 0 || daily.length > 0) {
            const challengesMetadata: any = {
              weeklyCount: weekly.length,
              dailyCount: daily.length,
            };

            challengesMetadata.challenges = weekly.map((c: any) => {
              const challengeData: any = {};
              if (c.challenge || c.title) challengeData.title = c.challenge || c.title;
              if (c.xp) challengeData.xp = c.xp;
              if (c.type) challengeData.type = c.type;
              return challengeData;
            }).filter((c: any) => Object.keys(c).length > 0);

            records.push({
              id: `fnapi-io-challenges-${new Date().toISOString().split('T')[0]}`,
              source: 'fortniteapi-io',
              type: 'challenges',
              title: 'Weekly Challenges',
              content: `Weekly Challenges: ${weekly.length} challenges available. ${weekly.slice(0, 3).map((c: any) => c.challenge || c.title).join(', ')}${weekly.length > 3 ? '...' : ''}`,
              createdAt: new Date().toISOString(),
              tags: ['challenges', 'quests', 'fortniteapi-io'],
              metadata: challengesMetadata,
            });
          }
        }
      }
    } catch (error: any) {
      console.error('[FORTNITEAPI-IO] Challenges fetch failed:', error.message);
    }

    // Fetch cosmetics (skip caching due to large response size - 40MB+)
    try {
      const cosmeticsResponse = await fetch(`${baseUrl}/items/list`, {
        headers,
        cache: 'no-store', // Don't cache large responses
      });

      if (cosmeticsResponse.ok) {
        const cosmeticsData = await cosmeticsResponse.json();
        
        if (cosmeticsData.items && cosmeticsData.items.length > 0) {
          // Store summary of cosmetics
          const total = cosmeticsData.items.length;
          const byType: Record<string, number> = {};
          
          cosmeticsData.items.forEach((item: any) => {
            const type = item.type?.name || 'unknown';
            byType[type] = (byType[type] || 0) + 1;
          });

          const cosmeticsMetadata: any = {
            totalItems: total,
            byType,
          };

          const cosmeticsRecord: any = {
            id: `fnapi-io-cosmetics-summary`,
            source: 'fortniteapi-io',
            type: 'cosmetics',
            title: 'Cosmetics Database',
            content: `Fortnite cosmetics database contains ${total} items. Breakdown: ${Object.entries(byType).slice(0, 5).map(([type, count]) => `${type}: ${count}`).join(', ')}${Object.keys(byType).length > 5 ? '...' : ''}`,
            createdAt: new Date().toISOString(),
            tags: ['cosmetics', 'items', 'database', 'fortniteapi-io'],
            metadata: cosmeticsMetadata,
          };
          records.push(cosmeticsRecord);
        }
      }
    } catch (error: any) {
      console.error('[FORTNITEAPI-IO] Cosmetics fetch failed:', error.message);
    }

    // Fetch map data
    try {
      const mapResponse = await fetch(`${baseUrl}/map`, {
        headers,
        cache: 'no-store', // Map images can be large
      });

      if (mapResponse.ok) {
        const mapData = await mapResponse.json();
        
        if (mapData.map) {
          const pois = mapData.map.pois || [];
          const poisList = pois.map((poi: any) => poi.name || poi.id).filter(Boolean);
          
          // Extract detailed POI information
          const poisDetails = pois.map((poi: any) => {
            const poiData: any = {};
            if (poi.name) poiData.name = poi.name;
            if (poi.id) poiData.id = poi.id;
            if (poi.location) poiData.location = poi.location;
            if (poi.coordinates) poiData.coordinates = poi.coordinates;
            return poiData;
          }).filter((p: any) => Object.keys(p).length > 0);

          const mapMetadata: any = {
            poisCount: pois.length,
            pois: poisDetails,
          };

          if (mapData.map.image) mapMetadata.image = mapData.map.image;
          if (mapData.map.image_with_pois) mapMetadata.imageWithPois = mapData.map.image_with_pois;

          const mapRecord: any = {
            id: `fnapi-io-map-${new Date().toISOString().split('T')[0]}`,
            source: 'fortniteapi-io',
            type: 'map',
            title: 'Current Fortnite Map',
            content: `Current Fortnite map with ${pois.length} Points of Interest (POIs): ${poisList.slice(0, 15).join(', ')}${poisList.length > 15 ? ` and ${poisList.length - 15} more` : ''}. Key locations include major POIs, landmarks, and strategic areas for competitive play.`,
            createdAt: new Date().toISOString(),
            tags: ['map', 'pois', 'locations', 'fortniteapi-io'],
            metadata: mapMetadata,
          };
          records.push(mapRecord);
        }
      }
    } catch (error: any) {
      console.error('[FORTNITEAPI-IO] Map fetch failed:', error.message);
    }

    console.log(`[FORTNITEAPI-IO] Collected ${records.length} records`);
  } catch (error: any) {
    console.error('[FORTNITEAPI-IO] Error:', error.message);
  }

  return records;
}

function removeUndefined(obj: any): any {
  if (obj === null || obj === undefined) {
    return undefined;
  }
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined).filter(item => item !== undefined);
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        const cleanedValue = removeUndefined(value);
        if (cleanedValue !== undefined) {
          cleaned[key] = cleanedValue;
        }
      }
    }
    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
  }
  return obj;
}

async function ingestToMemory(record: FortniteApiRecord): Promise<boolean> {
  try {
    const metadata: any = {
      type: record.type,
      ...(record.metadata || {}),
    };
    
    if (record.url) {
      metadata.url = record.url;
    }
    
    if (record.tags && record.tags.length > 0) {
      metadata.tags = record.tags;
    }

    const memoryData: any = {
      source: record.source,
      author: 'fortnite-api',
      content: record.content,
      createdAt: new Date(),
      timestamp: Date.now(),
    };

    if (record.title) {
      memoryData.title = record.title;
    }

    const cleanedMetadata = removeUndefined(metadata);
    if (cleanedMetadata) {
      memoryData.metadata = cleanedMetadata;
    }

    if (record.tags && record.tags.length > 0) {
      memoryData.tags = record.tags;
    }

    // Remove any remaining undefined values
    const finalData = removeUndefined(memoryData);

    await db.collection('memories').add(finalData);
    return true;
  } catch (error: any) {
    console.error(`[INGEST] Failed to ingest ${record.id}:`, error.message);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('🚀 Starting Fortnite API ingestion...\n');

    const FORTNITE_API_KEY = process.env.FORTNITE_API_KEY; // Fortnite-API.com key
    const FORTNITEAPI_IO_KEY = process.env.FORTNITEAPI_IO_KEY; // FortniteAPI.io key

    const allRecords: FortniteApiRecord[] = [];
    let processed = 0;
    let errors = 0;

    // Fetch from Fortnite-API.com
    if (FORTNITE_API_KEY) {
      console.log('📡 Fetching from Fortnite-API.com...');
      const fnApiRecords = await fetchFortniteApiCom(FORTNITE_API_KEY);
      allRecords.push(...fnApiRecords);
    } else {
      console.log('⚠️  FORTNITE_API_KEY not set, skipping Fortnite-API.com');
    }

    // Fetch from FortniteAPI.io
    if (FORTNITEAPI_IO_KEY) {
      console.log('📡 Fetching from FortniteAPI.io...');
      const fnApiIoRecords = await fetchFortniteApiIo(FORTNITEAPI_IO_KEY);
      allRecords.push(...fnApiIoRecords);
    } else {
      console.log('⚠️  FORTNITEAPI_IO_KEY not set, skipping FortniteAPI.io');
    }

    console.log(`\n📊 Total records collected: ${allRecords.length}`);

    // Ingest all records
    for (const record of allRecords) {
      const success = await ingestToMemory(record);
      if (success) {
        processed++;
        console.log(`✅ Ingested: ${record.type} - ${record.title || record.id}`);
      } else {
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: allRecords.length,
        processed,
        errors,
        sources: {
          'fortnite-api-com': allRecords.filter(r => r.source === 'fortnite-api-com').length,
          'fortniteapi-io': allRecords.filter(r => r.source === 'fortniteapi-io').length,
        },
      },
      message: `Successfully ingested ${processed} records from Fortnite APIs`,
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

