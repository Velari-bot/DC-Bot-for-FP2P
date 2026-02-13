/**
 * Events Fetcher
 * Fetches Fortnite events data
 */

import axios from 'axios';
import { saveRawData, saveJSON, loadJSON } from '@fortnite-core/database';

const EVENTS_URL = 'https://fortnite-public-service-prod11.ol.epicgames.com/fortnite/api/calendar/v1/timeline';

export interface EventRule {
  name: string;
  description?: string;
  value?: any;
}

export interface EventSchedule {
  startTime?: string;
  endTime?: string;
  timezone?: string;
}

export interface EventRegion {
  id: string;
  name?: string;
}

export interface FortniteEvent {
  id: string;
  eventId?: string;
  name: string;
  description?: string;
  region?: EventRegion;
  rules?: EventRule[];
  startTime?: string;
  endTime?: string;
  platforms?: string[];
  metadata?: any;
  schedule?: EventSchedule;
  gameMode?: string;
}

export interface EventsData {
  events: FortniteEvent[];
  timestamp: string;
  version: string;
}

/**
 * Parse a single event from API response
 */
function parseEvent(eventData: any): FortniteEvent {
  const event: FortniteEvent = {
    id: eventData.id || eventData.eventId || 'unknown',
    eventId: eventData.eventId || eventData.id,
    name: eventData.name || eventData.title || 'Unknown Event',
    description: eventData.description,
    gameMode: eventData.gameMode || eventData.mode
  };
  
  // Parse region
  if (eventData.region) {
    event.region = {
      id: eventData.region.id || eventData.region,
      name: eventData.region.name
    };
  }
  
  // Parse startTime and endTime
  if (eventData.startTime) {
    event.startTime = eventData.startTime;
  }
  if (eventData.endTime) {
    event.endTime = eventData.endTime;
  }
  
  // Parse schedule (fallback to startTime/endTime if schedule exists)
  if (eventData.schedule) {
    event.schedule = {
      startTime: eventData.schedule.startTime || eventData.startTime,
      endTime: eventData.schedule.endTime || eventData.endTime,
      timezone: eventData.schedule.timezone
    };
    
    // Also set top-level if not already set
    if (!event.startTime && eventData.schedule.startTime) {
      event.startTime = eventData.schedule.startTime;
    }
    if (!event.endTime && eventData.schedule.endTime) {
      event.endTime = eventData.schedule.endTime;
    }
  }
  
  // Parse rules
  if (eventData.rules && Array.isArray(eventData.rules)) {
    event.rules = eventData.rules.map((rule: any) => ({
      name: rule.name || rule.rule,
      description: rule.description,
      value: rule.value
    }));
  }
  
  // Parse platforms
  if (eventData.platforms) {
    event.platforms = Array.isArray(eventData.platforms) ? eventData.platforms : [eventData.platforms];
  } else if (eventData.platform) {
    event.platforms = Array.isArray(eventData.platform) ? eventData.platform : [eventData.platform];
  }
  
  // Parse metadata
  if (eventData.metadata) {
    event.metadata = eventData.metadata;
  }
  
  return event;
}

/**
 * Fetch events data from Fortnite API
 */
export async function fetchEventsData(): Promise<EventsData> {
  console.log('Fetching events data...');
  
  try {
    const response = await axios.get(EVENTS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });
    
    const rawData = response.data;
    
    // Save raw JSON to database
    await saveRawData('events.json', rawData);
    console.log('Saved raw events data to database');
    
    // Parse events (handle timeline API structure)
    let events: FortniteEvent[] = [];
    
    if (Array.isArray(rawData)) {
      events = rawData.map((event: any) => parseEvent(event));
    } else if (rawData.events && Array.isArray(rawData.events)) {
      events = rawData.events.map((event: any) => parseEvent(event));
    } else if (rawData.data && Array.isArray(rawData.data)) {
      events = rawData.data.map((event: any) => parseEvent(event));
    } else if (rawData.channels && typeof rawData.channels === 'object') {
      // Handle timeline API format - extract events from channels
      for (const channel of Object.values(rawData.channels as any)) {
        if ((channel as any).events && Array.isArray((channel as any).events)) {
          const channelEvents = (channel as any).events.map((event: any) => parseEvent(event));
          events.push(...channelEvents);
        }
      }
    } else if (rawData.timeline && typeof rawData.timeline === 'object') {
      // Alternative timeline structure
      for (const key of Object.keys(rawData.timeline)) {
        const timeline = (rawData.timeline as any)[key];
        if (timeline && timeline.events && Array.isArray(timeline.events)) {
          const timelineEvents = timeline.events.map((event: any) => parseEvent(event));
          events.push(...timelineEvents);
        }
      }
    }
    
    // Handle fallback for empty responses
    if (events.length === 0) {
      console.log('⚠️  No events found in response, returning empty array');
      // Still save an empty structure
      const emptyData: EventsData = {
        events: [],
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };
      
      await saveJSON('final/events.json', emptyData);
      return emptyData;
    }
    
    const eventsData: EventsData = {
      events,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
    
    // Save structured data to final directory
    await saveJSON('final/events.json', eventsData);
    console.log('✅ Events updated');
    console.log(`   Total events: ${events.length}`);
    
    // Log event breakdown by type if available
    if (events.length > 0) {
      const gameModeCount: Record<string, number> = {};
      events.forEach(event => {
        const mode = event.gameMode || 'Unknown';
        gameModeCount[mode] = (gameModeCount[mode] || 0) + 1;
      });
      
      console.log('   Event types:');
      for (const [mode, count] of Object.entries(gameModeCount)) {
        console.log(`     - ${mode}: ${count}`);
      }
    }
    
    return eventsData;
  } catch (error) {
    console.error('Error fetching events data:', error);
    
    // Return empty structure on error
    const emptyData: EventsData = {
      events: [],
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
    
    // Try to save empty data anyway
    try {
      await saveJSON('final/events.json', emptyData);
    } catch (saveError) {
      console.error('Error saving empty events data:', saveError);
    }
    
    return emptyData;
  }
}

/**
 * Get events data for API (loads from database or fetches fresh)
 */
export async function getEvents(): Promise<EventsData> {
  // Try to load from database first
  const cachedData = await loadJSON('final/events.json');
  
  if (cachedData && cachedData.events && Array.isArray(cachedData.events)) {
    console.log(`Loaded ${cachedData.events.length} events from cache`);
    return cachedData;
  }
  
  // If not in database, fetch fresh
  console.log('No events in database, fetching fresh...');
  return await fetchEventsData();
}

/**
 * Refresh events data (forces fresh fetch)
 */
export async function refreshEvents(): Promise<EventsData> {
  console.log('Refreshing events data...');
  return await fetchEventsData();
}
