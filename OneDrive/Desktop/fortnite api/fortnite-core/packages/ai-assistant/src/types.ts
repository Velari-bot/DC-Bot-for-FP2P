/**
 * AI Assistant Types
 * Unified type definitions for multi-source data ingestion and RAG
 */

export type DataSource = 'twitter' | 'epic' | 'analytics' | 'reddit' | 'news' | 'fortnite-api' | 'video' | 'doc';

export interface FortniteDataRecord {
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

export interface EmbeddingRecord {
  id: string;
  values: number[];
  metadata: {
    source: DataSource;
    author?: string;
    title?: string;
    content: string;
    created_at: string;
    url?: string;
    tags?: string[];
    // Optional video metadata (if source === 'video')
    videoUrl?: string;
    videoStart?: number; // seconds
    videoEnd?: number;   // seconds
    thumbnailUrl?: string;
  };
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  query: string;
  conversation_history?: ChatMessage[];
  max_context?: number;
}

export interface ChatResponse {
  response: string;
  sources: Array<{
    source: DataSource;
    author?: string;
    title?: string;
    content: string;
    created_at: string;
    relevance_score: number;
    url?: string;
    // Optional video metadata passthrough
    videoUrl?: string;
    videoStart?: number;
    videoEnd?: number;
    thumbnailUrl?: string;
  }>;
  timestamp: string;
}

export interface VectorSearchResult {
  id: string;
  score: number;
  metadata: {
    source: DataSource;
    author?: string;
    title?: string;
    content: string;
    created_at: string;
    url?: string;
    tags?: string[];
    videoUrl?: string;
    videoStart?: number;
    videoEnd?: number;
    thumbnailUrl?: string;
  };
}

