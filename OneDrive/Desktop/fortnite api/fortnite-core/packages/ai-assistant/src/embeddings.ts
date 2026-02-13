/**
 * Embeddings Module
 * Generates vector embeddings using OpenAI
 */

import OpenAI from 'openai';
import { config } from './config';
import { FortniteDataRecord, EmbeddingRecord } from './types';
import { chunkText } from './data-loader';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

/**
 * Generate embeddings for a single text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    if (!config.openai.apiKey || !config.openai.apiKey.startsWith('sk-')) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await openai.embeddings.create({
      model: config.openai.embeddingModel,
      input: text,
    });

    return response.data[0].embedding;
  } catch (error: any) {
    if (error.status === 403 || error.message?.includes('does not have access')) {
      console.error('⚠️  OpenAI project does not have access to embeddings model');
      throw new Error('OpenAI embeddings not available - check your project permissions');
    }
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Generate embeddings for multiple texts in batches
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  const batchSize = config.ingestion.batchSize;

  console.log(`🔄 Generating embeddings for ${texts.length} texts...`);

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    
    try {
      const response = await openai.embeddings.create({
        model: config.openai.embeddingModel,
        input: batch,
      });

      const batchEmbeddings = response.data.map(d => d.embedding);
      embeddings.push(...batchEmbeddings);

      console.log(`  ✓ Processed ${Math.min(i + batchSize, texts.length)}/${texts.length}`);
    } catch (error) {
      console.error(`Error generating batch ${i}-${i + batchSize}:`, error);
      throw error;
    }

    // Rate limiting pause (optional)
    if (i + batchSize < texts.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return embeddings;
}

/**
 * Prepare data records for embedding
 * Chunks long texts and creates embedding records
 */
export async function prepareEmbeddingRecords(
  records: FortniteDataRecord[]
): Promise<EmbeddingRecord[]> {
  const embeddingRecords: EmbeddingRecord[] = [];

  console.log(`📝 Preparing ${records.length} records for embedding...`);

  for (const record of records) {
    // Prepare content for embedding
    let embeddingText = record.content;

    // Add title if available
    if (record.title) {
      embeddingText = `${record.title}\n\n${embeddingText}`;
    }

    // Add author context
    if (record.author) {
      embeddingText = `Author: ${record.author}\n\n${embeddingText}`;
    }

    // Chunk if too long
    const chunks = chunkText(embeddingText, config.ingestion.chunkSize, config.ingestion.chunkOverlap);

    for (let i = 0; i < chunks.length; i++) {
      const chunkId = chunks.length > 1 ? `${record.id}-chunk-${i}` : record.id;
      
      embeddingRecords.push({
        id: chunkId,
        values: [], // Will be filled in after embedding
        metadata: {
          source: record.source,
          author: record.author,
          title: record.title,
          content: chunks[i],
          created_at: record.created_at,
          url: record.url,
          tags: record.tags,
          ...record.metadata,
        },
      });
    }
  }

  console.log(`✅ Prepared ${embeddingRecords.length} embedding records (with chunks)`);

  return embeddingRecords;
}

/**
 * Generate embeddings for all prepared records
 */
export async function embedRecords(records: EmbeddingRecord[]): Promise<EmbeddingRecord[]> {
  // Extract texts
  const texts = records.map(r => r.metadata.content);

  // Generate embeddings
  const embeddings = await generateEmbeddingsBatch(texts);

  // Attach embeddings to records
  return records.map((record, i) => ({
    ...record,
    values: embeddings[i],
  }));
}

