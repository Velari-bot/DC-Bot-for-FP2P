/**
 * Fortnite-API.com Data Source
 * Third-party Fortnite API
 */

import axios from 'axios';
import { config } from '../config';
import { FortniteRecord } from '../types';
import { v4 as uuidv4 } from 'uuid';

export async function collectFortniteApiData(): Promise<FortniteRecord[]> {
  const records: FortniteRecord[] = [];

  try {
    console.log('  🔮 Fetching Fortnite-API.com data...');

    const headers = config.fortniteApi.apiKey
      ? { 'Authorization': config.fortniteApi.apiKey }
      : {};

    // Fetch news
    try {
      const newsResponse = await axios.get(
        `${config.fortniteApi.baseUrl}${config.fortniteApi.endpoints.news}`,
        { headers, timeout: 10000 }
      );

      if (newsResponse.data?.data) {
        const newsData = newsResponse.data.data;

        // BR News
        if (newsData.br?.motds) {
          for (const item of newsData.br.motds) {
            records.push({
              id: `fnapi-news-br-${item.id || uuidv4()}`,
              source: 'fortnite-api',
              author: 'Fortnite-API.com',
              title: item.title || 'Battle Royale News',
              content: item.body || item.title || '',
              created_at: new Date().toISOString(),
              url: item.tabTitleOverride || undefined,
              tags: ['news', 'battle-royale', 'api'],
              metadata: {
                type: 'br-news',
                image: item.image,
              },
            });
          }
        }
      }

      console.log(`  ✅ Collected ${records.length} news items`);
    } catch (error) {
      console.error('  ⚠️  News fetch failed:', error instanceof Error ? error.message : error);
    }

    // Fetch shop (optional, can be heavy)
    try {
      const shopResponse = await axios.get(
        `${config.fortniteApi.baseUrl}${config.fortniteApi.endpoints.shop}`,
        { headers, timeout: 10000 }
      );

      if (shopResponse.data?.data) {
        const shopData = shopResponse.data.data;
        
        // Create a summary record
        const featuredCount = shopData.featured?.entries?.length || 0;
        const dailyCount = shopData.daily?.entries?.length || 0;

        records.push({
          id: `fnapi-shop-${new Date().toISOString().split('T')[0]}`,
          source: 'fortnite-api',
          author: 'Fortnite Shop',
          title: 'Item Shop Update',
          content: `Item Shop updated with ${featuredCount} featured and ${dailyCount} daily items.`,
          created_at: new Date().toISOString(),
          tags: ['shop', 'cosmetics', 'items'],
          metadata: {
            type: 'shop',
            featuredCount,
            dailyCount,
            hash: shopData.hash,
          },
        });
      }
    } catch (error) {
      // Shop endpoint might require API key or be rate limited
      console.log('  ⚠️  Shop fetch skipped (may require API key)');
    }

    console.log(`  ✅ Total Fortnite-API records: ${records.length}`);
  } catch (error) {
    console.error('  ❌ Error collecting Fortnite-API data:', error instanceof Error ? error.message : error);
  }

  return records;
}

