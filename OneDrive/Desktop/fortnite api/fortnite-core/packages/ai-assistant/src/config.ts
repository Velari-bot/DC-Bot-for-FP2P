/**
 * AI Assistant Configuration
 * Centralized configuration for OpenAI, Pinecone, and other services
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from root
dotenv.config({ path: path.join(__dirname, '../../../.env') });

export const config = {
  // OpenAI Configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    embeddingModel: 'text-embedding-3-small',
    chatModel: 'gpt-4o-mini', // Fast and efficient GPT-4o mini model
    maxTokens: 2000,
    temperature: 0.7,
  },

  // Pinecone Configuration
  pinecone: {
    apiKey: process.env.PINECONE_API_KEY || '',
    environment: process.env.PINECONE_ENV || 'us-east1-gcp',
    indexName: process.env.PINECONE_INDEX || 'fortnite-tracker',
    dimension: 1536, // text-embedding-3-small dimension
    metric: 'cosine' as const,
  },

  // Data Ingestion
  ingestion: {
    batchSize: 100,
    chunkSize: 500, // characters per chunk
    chunkOverlap: 50,
  },

  // Retrieval
  retrieval: {
    topK: 5, // number of context documents to retrieve
    minScore: 0.7, // minimum relevance score
  },

  // System
  dataDir: path.join(process.cwd(), 'data'),
  tweetsFile: path.join(process.cwd(), 'data', 'tweets', 'tweets.json'),
};

// Validate required config
export function validateConfig(requireOpenAI: boolean = true): void {
  if (!requireOpenAI) {
    console.log('⚠️  Running without OpenAI API key - AI features disabled');
    return;
  }

  const required = [
    { key: 'openai.apiKey', value: config.openai.apiKey, name: 'OPENAI_API_KEY' },
  ];

  const missing = required.filter(r => !r.value);
  
  if (missing.length > 0) {
    const keys = missing.map(m => m.name).join(', ');
    console.warn(`⚠️  Missing: ${keys} - AI features will be limited`);
    return;
  }

  console.log('✅ Configuration validated');
}

