/**
 * Data Ingestion Types
 * Unified schema for all data sources
 */

export type DataSource = 'twitter' | 'epic' | 'fortnite-api' | 'reddit' | 'news' | 'analytics';

export interface FortniteRecord {
  id: string;
  source: DataSource;
  author?: string;
  title?: string;
  content: string;
  created_at: string;
  url?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface IngestionResult {
  source: DataSource;
  success: boolean;
  newRecords: number;
  totalFetched: number;
  error?: string;
  timestamp: string;
}

export interface IngestionStats {
  totalRecords: number;
  recordsBySource: Record<DataSource, number>;
  lastIngestion: string;
  oldestRecord?: string;
  newestRecord?: string;
}

export interface DataStore {
  records: FortniteRecord[];
  lastUpdate: string;
  stats: IngestionStats;
}

