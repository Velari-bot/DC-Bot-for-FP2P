/**
 * Script to send launch reminder emails to all whitelisted emails
 * Run with: node apps/web/scripts/send-launch-reminder.js
 * 
 * Or call the API endpoint directly:
 * POST https://pathgen.dev/api/email/send-launch-reminder
 */

const https = require('https');
const http = require('http');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const ENDPOINT = '/api/email/send-launch-reminder';

console.log('🚀 Sending launch reminder emails...');
console.log(`📧 Endpoint: ${API_URL}${ENDPOINT}\n`);

const url = new URL(`${API_URL}${ENDPOINT}`);
const options = {
  hostname: url.hostname,
  port: url.port || (url.protocol === 'https:' ? 443 : 80),
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
};

const client = url.protocol === 'https:' ? https : http;

const req = client.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('\n✅ Result:');
      console.log(JSON.stringify(result, null, 2));
      
      if (result.success) {
        console.log(`\n🎉 Successfully sent ${result.stats.sent} emails!`);
      } else {
        console.log(`\n⚠️  Some emails failed: ${result.stats.failed} failed`);
        if (result.failedEmails && result.failedEmails.length > 0) {
          console.log('\nFailed emails:', result.failedEmails);
        }
      }
    } catch (e) {
      console.error('Error parsing response:', e);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
  console.log('\n💡 Make sure your Next.js server is running!');
  console.log('   Run: npm run dev (or yarn dev)');
});

req.end();
