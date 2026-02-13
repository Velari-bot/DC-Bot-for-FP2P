/**
 * CMS Fetcher
 * Fetches and processes Fortnite CMS data
 */

import axios from 'axios';
import { saveRawData, saveJSON, loadJSON } from '@fortnite-core/database';

const CMS_URL = 'https://fortnitecontent-website-prod07.ol.epicgames.com/content/api/pages/fortnite-game';

export interface ShopSection {
  id: string;
  title: string;
  items: any[];
  expires?: string;
}

export interface EventBanner {
  title: string;
  description: string;
  image: string;
  expires?: string;
}

export interface CMSData {
  shopSections: ShopSection[];
  version: string;
  eventBanners: EventBanner[];
  rawData: any;
}

/**
 * Recursively search for a key in an object
 */
function findInObject(obj: any, key: string): any {
  if (!obj || typeof obj !== 'object') return null;
  
  if (obj[key]) {
    return obj[key];
  }
  
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const result = findInObject(item, key);
      if (result) return result;
    }
  } else {
    for (const value of Object.values(obj)) {
      const result = findInObject(value, key);
      if (result) return result;
    }
  }
  
  return null;
}

/**
 * Extract shop sections from CMS data
 */
function extractShopSections(data: any): ShopSection[] {
  const sections: ShopSection[] = [];
  
  // Look for common shop-related keys
  const shopKeys = ['shop', 'storefront', 'featuredshop', 'dailyoffer'];
  
  for (const key of shopKeys) {
    const section = findInObject(data, key);
    if (section) {
      sections.push({
        id: key,
        title: section.title || key,
        items: section.items || [],
        expires: section.expires
      });
    }
  }
  
  return sections;
}

/**
 * Extract version from battleroyalenews section
 */
function extractVersion(data: any): string {
  const battleroyalenews = findInObject(data, 'battleroyalenews');
  
  if (battleroyalenews) {
    // Try to find version in various locations
    const versionSources = [
      battleroyalenews.version,
      battleroyalenews.gameVersion,
      battleroyalenews.title,
      battleroyalenews.motd?.gameVersion
    ];
    
    for (const versionSource of versionSources) {
      if (typeof versionSource === 'string' && versionSource) {
        // Extract version number if it's embedded in text
        const match = versionSource.match(/v?\s*(\d+\.\d+)/i);
        if (match) {
          return match[1];
        }
        return versionSource;
      }
    }
  }
  
  return 'unknown';
}

/**
 * Extract event banners from CMS data
 */
function extractEventBanners(data: any): EventBanner[] {
  const banners: EventBanner[] = [];
  
  // Look for common event/banner keys
  const eventKeys = ['eventbanner', 'news', 'motd', 'event'];
  
  for (const key of eventKeys) {
    const event = findInObject(data, key);
    if (event) {
      if (Array.isArray(event)) {
        event.forEach((item: any) => {
          if (item.title || item.heading) {
            banners.push({
              title: item.title || item.heading || '',
              description: item.body || item.description || '',
              image: item.image || item.backgroundImage || '',
              expires: item.expires || item.validUntil
            });
          }
        });
      } else if (event.title || event.heading) {
        banners.push({
          title: event.title || event.heading || '',
          description: event.body || event.description || '',
          image: event.image || event.backgroundImage || '',
          expires: event.expires || event.validUntil
        });
      }
    }
  }
  
  return banners;
}

/**
 * Fetch CMS data and extract structured information
 */
export async function fetchCMSData(): Promise<CMSData> {
  console.log('Fetching CMS data...');
  
  try {
    // Fetch from CMS endpoint
    const response = await axios.get(CMS_URL);
    const rawData = response.data;
    
    // Save raw JSON
    await saveRawData('cms.json', rawData);
    console.log('Saved raw CMS data to database');
    
    // Extract structured data
    const shopSections = extractShopSections(rawData);
    const version = extractVersion(rawData);
    const eventBanners = extractEventBanners(rawData);
    
    // Save structured shop JSON to final directory
    await saveJSON('final/shop.json', {
      version,
      shopSections,
      eventBanners,
      timestamp: new Date().toISOString()
    });
    console.log('Saved structured shop data to final/shop.json');
    
    const cmsData: CMSData = {
      shopSections,
      version,
      eventBanners,
      rawData
    };
    
    // Calculate total shop item count
    const totalItems = shopSections.reduce((sum, section) => sum + (section.items?.length || 0), 0);
    
    console.log('✅ CMS updated');
    console.log(`  Version: ${version}`);
    console.log(`  Shop sections: ${shopSections.length}`);
    console.log(`  Total shop items: ${totalItems}`);
    console.log(`  Event banners: ${eventBanners.length}`);
    
    return cmsData;
  } catch (error) {
    console.error('Error fetching CMS data:', error);
    throw error;
  }
}

/**
 * Get shop data from CMS
 * Returns structured shop data from final/shop.json
 */
export async function getShopData(): Promise<ShopSection[]> {
  try {
    // Try to load from structured shop JSON first
    const shopData = await loadJSON('final/shop.json');
    
    if (shopData && shopData.shopSections) {
      return shopData.shopSections;
    }
  } catch (error) {
    console.error('Error loading shop data from final/shop.json:', error);
  }
  
  // If not available, try loading from raw CMS data
  try {
    const cmsData = await loadJSON('raw/cms.json');
    if (cmsData) {
      return extractShopSections(cmsData);
    }
  } catch (error) {
    console.error('Error loading shop data from raw/cms.json:', error);
  }
  
  // If not in database, fetch fresh
  const freshData = await fetchCMSData();
  return freshData.shopSections;
}

/**
 * Get latest version from CMS
 * Reads version from cms.json
 */
export async function getLatestVersion(): Promise<string> {
  try {
    // Try to load from structured shop JSON first
    const shopData = await loadJSON('final/shop.json');
    if (shopData && shopData.version) {
      return shopData.version;
    }
  } catch (error) {
    console.error('Error loading version from final/shop.json:', error);
  }
  
  // Try to load from raw CMS data
  try {
    const cmsData = await loadJSON('raw/cms.json');
    if (cmsData) {
      const version = extractVersion(cmsData);
      if (version !== 'unknown') {
        return version;
      }
    }
  } catch (error) {
    console.error('Error loading version from raw/cms.json:', error);
  }
  
  // If not in database or version unknown, fetch fresh
  const freshData = await fetchCMSData();
  return freshData.version;
}

