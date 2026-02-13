import { NextRequest, NextResponse } from 'next/server';

interface Tournament {
  id: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  prizePool?: string;
  format?: string;
  url?: string;
  source: string;
  createdAt: string;
  tags?: string[];
}

/**
 * Fetch tournaments from various sources
 */
export async function GET(request: NextRequest) {
  try {
    const tournaments: Tournament[] = [];

    // Try to fetch from Epic CMS (if available)
    try {
      const epicResponse = await fetch(
        'https://fortnitecontent-website-prod07.ol.epicgames.com/content/api/pages/fortnite-game',
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          next: { revalidate: 3600 }, // Cache for 1 hour
        }
      );

      if (epicResponse.ok) {
        const epicData = await epicResponse.json();
        
        // Extract tournament/event data from Epic CMS
        if (epicData.battleroyalenews?.news?.motds) {
          epicData.battleroyalenews.news.motds.forEach((item: any, index: number) => {
            if (item.title && (item.title.toLowerCase().includes('tournament') || 
                item.title.toLowerCase().includes('cup') ||
                item.title.toLowerCase().includes('championship') ||
                item.title.toLowerCase().includes('series'))) {
              tournaments.push({
                id: `epic-${item.id || index}`,
                title: item.title,
                description: item.body || item.message,
                startDate: item.startTime,
                endDate: item.endTime,
                url: item.link || item.news?.link,
                source: 'epic',
                createdAt: item.startTime || new Date().toISOString(),
                tags: ['tournament', 'official'],
              });
            }
          });
        }
      }
    } catch (epicError) {
      console.error('Error fetching Epic tournaments:', epicError);
    }

    // Try to fetch from Fortnite-API.com (if API key available)
    const FORTNITE_API_KEY = process.env.FORTNITE_API_KEY;
    if (FORTNITE_API_KEY) {
      try {
        const apiResponse = await fetch(
          'https://fortnite-api.com/v2/events',
          {
            headers: {
              'Authorization': FORTNITE_API_KEY,
            },
            next: { revalidate: 3600 },
          }
        );

        if (apiResponse.ok) {
          const apiData = await apiResponse.json();
          if (apiData.data && Array.isArray(apiData.data)) {
            apiData.data.forEach((event: any) => {
              tournaments.push({
                id: `fortnite-api-${event.id}`,
                title: event.name || event.title,
                description: event.description,
                startDate: event.startTime,
                endDate: event.endTime,
                prizePool: event.prizePool,
                format: event.format,
                url: event.url,
                source: 'fortnite-api',
                createdAt: event.startTime || new Date().toISOString(),
                tags: ['tournament', 'event'],
              });
            });
          }
        }
      } catch (apiError) {
        console.error('Error fetching Fortnite-API tournaments:', apiError);
      }
    }

    // Sort by date (most recent first)
    tournaments.sort((a, b) => {
      const dateA = new Date(a.startDate || a.createdAt).getTime();
      const dateB = new Date(b.startDate || b.createdAt).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({
      success: true,
      tournaments,
      count: tournaments.length,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
      },
    });
  } catch (error: any) {
    console.error('Error fetching tournaments:', error);
    return NextResponse.json({
      success: false,
      tournaments: [],
      count: 0,
      error: 'Failed to fetch tournaments',
      message: error.message,
    }, {
      status: 200, // Return 200 to prevent frontend crash
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      },
    });
  }
}

