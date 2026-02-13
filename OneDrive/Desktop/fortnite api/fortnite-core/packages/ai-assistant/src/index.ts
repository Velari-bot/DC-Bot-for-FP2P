/**
 * AI Assistant Package
 * Main entry point for Fortnite AI RAG system
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Re-export all modules
export * from './types';
export * from './config';
export * from './data-loader';
export * from './embeddings';
export * from './retriever';
export * from './chat';

// Main exports
export { handleChatQuery, chat } from './chat';
export { loadAllData, loadTweets, loadFortniteData } from './data-loader';
export { initPinecone, upsertEmbeddings, retrieveContext, setInMemoryVectors } from './retriever';
export { prepareEmbeddingRecords, embedRecords } from './embeddings';

console.log('🤖 AI Assistant package loaded');

