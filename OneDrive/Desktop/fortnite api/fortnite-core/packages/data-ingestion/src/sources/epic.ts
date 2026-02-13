/**
 * Epic Games CMS Data Source
 * Fetches official Fortnite content
 */

import axios from 'axios';
import { config } from '../config';
import { FortniteRecord } from '../types';
import { v4 as uuidv4 } from 'uuid';

export async function collectEpicData(): Promise<FortniteRecord[]> {
  const records: FortniteRecord[] = [];

  try {
    console.log('  🎮 Fetching Epic CMS data...');

    const response = await axios.get(config.epic.cmsUrl, {
      timeout: config.epic.timeout,
    });

    const data = response.data;

    // Process news entries
    if (data.battleroyalenews?.news?.motds) {
      for (const item of data.battleroyalenews.news.motds) {
        records.push({
          id: `epic-news-${item.id || uuidv4()}`,
          source: 'epic',
          author: 'Epic Games',
          title: item.title || 'Fortnite News',
          content: item.body || item.title || '',
          created_at: new Date().toISOString(),
          url: item.tabTitleOverride || undefined,
          tags: ['news', 'official', 'battle-royale'],
          metadata: {
            type: 'news',
            image: item.image,
            tileImage: item.tileImage,
          },
        });
      }
    }

    // Process emergency notices
    if (data.emergencynotice?.news?.messages) {
      for (const item of data.emergencynotice.news.messages) {
        records.push({
          id: `epic-notice-${uuidv4()}`,
          source: 'epic',
          author: 'Epic Games',
          title: item.title || 'Emergency Notice',
          content: item.body || item.title || '',
          created_at: new Date().toISOString(),
          tags: ['notice', 'official', 'emergency'],
          metadata: {
            type: 'emergency',
          },
        });
      }
    }

    // Process tournament info
    if (data.tournamentinformation?.tournament_info?.tournaments) {
      for (const item of data.tournamentinformation.tournament_info.tournaments) {
        records.push({
          id: `epic-tournament-${item.tournament_display_id || uuidv4()}`,
          source: 'epic',
          author: 'Epic Games',
          title: item.title_line_1 || 'Tournament',
          content: `${item.title_line_1 || ''} ${item.title_line_2 || ''}`.trim(),
          created_at: new Date().toISOString(),
          tags: ['tournament', 'competitive', 'official'],
          metadata: {
            type: 'tournament',
            displayId: item.tournament_display_id,
            shortDescription: item.short_description,
          },
        });
      }
    }

    console.log(`  ✅ Collected ${records.length} Epic CMS records`);
  } catch (error) {
    console.error('  ❌ Error collecting Epic data:', error instanceof Error ? error.message : error);
  }

  return records;
}

