/**
 * Test script for data ingestion
 */

const { ingestData } = require('./packages/data-ingestion/dist/index.js');

async function main() {
  try {
    await ingestData();
    console.log('Data ingestion test completed successfully!');
  } catch (error) {
    console.error('Data ingestion failed:', error);
    process.exit(1);
  }
}

main();

