/**
 * Data Ingestion Script
 * Loads all data, generates embeddings, and uploads to Pinecone
 */

import { validateConfig } from './config';
import { loadAllData } from './data-loader';
import { prepareEmbeddingRecords, embedRecords } from './embeddings';
import { initPinecone, upsertEmbeddings, setInMemoryVectors } from './retriever';

async function ingestData() {
  console.log('🚀 Starting data ingestion...\n');

  try {
    // Validate configuration
    validateConfig();

    // Load all data
    const records = await loadAllData();

    if (records.length === 0) {
      console.warn('⚠️  No data to ingest');
      return;
    }

    // Prepare for embedding
    const embeddingRecords = await prepareEmbeddingRecords(records);

    // Generate embeddings (fallback to in-memory keyword search if embeddings are unavailable)
    let embeddedRecords = embeddingRecords;
    try {
      embeddedRecords = await embedRecords(embeddingRecords);
    } catch (embedErr: any) {
      console.warn('⚠️  Embedding generation failed, using keyword-based in-memory fallback');
      console.warn(embedErr?.message || embedErr);
      // Store plain chunks (values remain empty). queryInMemory will use keyword scoring.
      setInMemoryVectors(embeddingRecords);
      console.log('✅ Stored plain chunks in memory for keyword retrieval');
      console.log('\n🎉 Ingestion complete (keyword fallback)!');
      console.log(`   Total records processed: ${records.length}`);
      console.log(`   Chunks available (no vectors): ${embeddingRecords.length}`);
      return;
    }

    // Try Pinecone upload
    try {
      await initPinecone();
      await upsertEmbeddings(embeddedRecords);
      console.log('✅ Data uploaded to Pinecone');
    } catch (pineconeError) {
      console.warn('⚠️  Pinecone upload failed, using in-memory fallback');
      setInMemoryVectors(embeddedRecords);
      console.log('✅ Data stored in memory');
    }

    console.log('\n🎉 Ingestion complete!');
    console.log(`   Total records processed: ${records.length}`);
    console.log(`   Embedding chunks created: ${embeddingRecords.length}`);
  } catch (error) {
    console.error('❌ Ingestion failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  ingestData().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { ingestData };

