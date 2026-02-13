/**
 * Retriever Module
 * Vector search and context retrieval using Pinecone
 */

import { Pinecone } from '@pinecone-database/pinecone';
import { config } from './config';
import { VectorSearchResult, EmbeddingRecord } from './types';
import { generateEmbedding, prepareEmbeddingRecords } from './embeddings';
import { loadAllData, loadVideos } from './data-loader';

let pineconeClient: Pinecone | null = null;

/**
 * Initialize Pinecone client
 */
export async function initPinecone(): Promise<void> {
  if (!config.pinecone.apiKey) {
    console.warn('⚠️  Pinecone API key not set - using in-memory fallback');
    return;
  }

  try {
    pineconeClient = new Pinecone({
      apiKey: config.pinecone.apiKey,
    });

    console.log('✅ Pinecone client initialized');

    // Check if index exists
    const indexes = await pineconeClient.listIndexes();
    const indexExists = indexes.indexes?.some(idx => idx.name === config.pinecone.indexName);

    if (!indexExists) {
      console.log(`Creating Pinecone index: ${config.pinecone.indexName}...`);
      await pineconeClient.createIndex({
        name: config.pinecone.indexName,
        dimension: config.pinecone.dimension,
        metric: config.pinecone.metric,
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1',
          },
        },
      });
      console.log('✅ Index created successfully');
    }
  } catch (error) {
    console.error('Error initializing Pinecone:', error);
    throw error;
  }
}

/**
 * Upsert embedding records to Pinecone
 */
export async function upsertEmbeddings(records: EmbeddingRecord[]): Promise<void> {
  if (!pineconeClient) {
    console.warn('Pinecone not initialized - skipping upsert');
    return;
  }

  try {
    const index = pineconeClient.index(config.pinecone.indexName);
    
    console.log(`⬆️  Upserting ${records.length} vectors to Pinecone...`);

    // Batch upsert
    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      await index.upsert(batch.map(r => ({
        id: r.id,
        values: r.values,
        metadata: r.metadata as Record<string, any>,
      })));

      console.log(`  ✓ Upserted ${Math.min(i + batchSize, records.length)}/${records.length}`);
    }

    console.log('✅ All vectors upserted successfully');
  } catch (error) {
    console.error('Error upserting embeddings:', error);
    throw error;
  }
}

/**
 * Query Pinecone for relevant context
 */
export async function queryPinecone(queryText: string, topK: number = 5): Promise<VectorSearchResult[]> {
  if (!pineconeClient) {
    console.warn('Pinecone not initialized - returning empty results');
    return [];
  }

  try {
    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(queryText);

    // Query Pinecone
    const index = pineconeClient.index(config.pinecone.indexName);
    const queryResponse = await index.query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
    });

    // Transform results
    return queryResponse.matches.map(match => ({
      id: match.id,
      score: match.score || 0,
      metadata: match.metadata as VectorSearchResult['metadata'],
    }));
  } catch (error) {
    console.error('Error querying Pinecone:', error);
    return [];
  }
}

/**
 * Retrieve context for a user query
 */
export async function retrieveContext(query: string): Promise<VectorSearchResult[]> {
  console.log(`🔍 Retrieving context for: "${query}"`);

  // Check if we can even do vector search
  if (!config.openai.apiKey) {
    console.warn('⚠️  OpenAI API key not set - skipping vector search');
    return [];
  }

  const results = await queryPinecone(query, config.retrieval.topK);

  // Filter by minimum score
  const filtered = results.filter(r => r.score >= config.retrieval.minScore);

  console.log(`✅ Found ${filtered.length} relevant documents (score >= ${config.retrieval.minScore})`);

  return filtered;
}

// In-memory fallback for development without Pinecone
let inMemoryVectors: EmbeddingRecord[] = [];

export function setInMemoryVectors(vectors: EmbeddingRecord[]): void {
  inMemoryVectors = vectors;
  console.log(`📝 Stored ${vectors.length} vectors in memory`);
}

export async function queryInMemory(queryText: string, topK: number = 5): Promise<VectorSearchResult[]> {
  // Lazy-load plain chunks into memory if empty (no embeddings/Pinecone)
  if (inMemoryVectors.length === 0) {
    try {
      const all = await loadAllData();
      const vids = await loadVideos();
      const data = [...(all || []), ...(vids || [])];
      const prepped = await prepareEmbeddingRecords(data);
      setInMemoryVectors(prepped);
      console.log(`🧠 Lazy-loaded ${prepped.length} transcript chunks into memory (videos: ${vids?.length || 0}, other: ${all?.length || 0})`);
    } catch (e) {
      console.warn('Failed to lazy-load data into memory:', (e as Error).message);
    }
  }

  // If we have vectors with values, use cosine similarity
  let hasValues = false;
  for (const v of inMemoryVectors) {
    if (Array.isArray(v.values) && v.values.length > 0) {
      hasValues = true;
      break;
    }
  }

  if (hasValues) {
    const queryEmbedding = await generateEmbedding(queryText);
    const results = inMemoryVectors
      .map(vec => ({
        id: vec.id,
        score: cosineSimilarity(queryEmbedding, vec.values),
        metadata: vec.metadata,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .filter(r => r.score >= config.retrieval.minScore);
    return results;
  }

  // Keyword scoring fallback (no embeddings available)
  const q = queryText.toLowerCase();
  const terms = Array.from(new Set(q.split(/\W+/).filter(Boolean)));
  const scoreFor = (text: string): number => {
    const t = text.toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (t.includes(term)) score += 1;
    }
    // boost matches appearing earlier slightly
    const firstIdx = Math.max(0, Math.min(...terms.map(term => {
      const idx = t.indexOf(term);
      return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
    })));
    const posBoost = firstIdx === Number.MAX_SAFE_INTEGER ? 0 : Math.max(0, (1000 - firstIdx) / 1000);
    return score + posBoost;
  };

  const results = inMemoryVectors
    .map(vec => {
      const content = vec.metadata.content || '';
      const title = (vec.metadata.title || '') + ' ' + (vec.metadata.author || '');
      const sContent = scoreFor(content);
      const sTitle = scoreFor(title) * 1.5; // small boost for title/author matches
      const score = sContent + sTitle;
      return {
        id: vec.id,
        score,
        metadata: vec.metadata,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  console.log(`🔎 Keyword fallback: searched ${inMemoryVectors.length} chunks, found ${results.length}`);
  return results;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

