/**
 * Script to ingest specific Osirion tweets into AI memory
 * Calls the API endpoint to process tweets through the Twitter ingestion pipeline
 */

async function ingestOsirionTweets() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                 (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  
  try {
    console.log('🔄 Ingesting Osirion tweets...');
    const response = await fetch(`${baseUrl}/api/twitter/ingest-osirion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error:', response.status, errorText);
      process.exit(1);
    }

    const data = await response.json();
    console.log('✅ Results:', JSON.stringify(data, null, 2));
  } catch (error: any) {
    console.error('❌ Exception:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  ingestOsirionTweets();
}

