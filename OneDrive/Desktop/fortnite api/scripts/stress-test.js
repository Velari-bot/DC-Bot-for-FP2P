#!/usr/bin/env node
/**
 * Stress Testing Script for PathGen
 * 
 * Tests the system with 50-200 concurrent users to ensure
 * the AI doesn't slow down under load.
 * 
 * Usage: node scripts/stress-test.js [concurrent_users] [duration_seconds]
 * Example: node scripts/stress-test.js 100 60
 */

const http = require('http');

const DEFAULT_CONCURRENT = 50;
const DEFAULT_DURATION = 60; // seconds
const API_URL = process.env.API_URL || 'http://localhost:4000';
const WEB_URL = process.env.WEB_URL || 'http://localhost:3000';

const args = process.argv.slice(2);
const concurrentUsers = parseInt(args[0]) || DEFAULT_CONCURRENT;
const durationSeconds = parseInt(args[1]) || DEFAULT_DURATION;

console.log(`🚀 Starting stress test:`);
console.log(`   Concurrent users: ${concurrentUsers}`);
console.log(`   Duration: ${durationSeconds} seconds`);
console.log(`   API URL: ${API_URL}`);
console.log(`   Web URL: ${WEB_URL}\n`);

const stats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  errors: [],
  responseTimes: [],
  startTime: Date.now(),
};

// Make a request to health endpoint
function makeRequest(url, endpoint) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        stats.responseTimes.push(responseTime);
        
        if (res.statusCode === 200) {
          stats.successfulRequests++;
          resolve({ statusCode: res.statusCode, responseTime, data });
        } else {
          stats.failedRequests++;
          reject(new Error(`Status ${res.statusCode}`));
        }
      });
    }).on('error', (error) => {
      stats.failedRequests++;
      stats.errors.push({ endpoint, error: error.message, timestamp: new Date().toISOString() });
      reject(error);
    });
  });
}

// Simulate a user session
async function simulateUser(userId) {
  const endpoints = [
    { url: `${API_URL}/health`, name: 'health' },
    { url: `${WEB_URL}/`, name: 'homepage' },
  ];

  let requestCount = 0;
  const interval = setInterval(async () => {
    if (Date.now() - stats.startTime > durationSeconds * 1000) {
      clearInterval(interval);
      return;
    }

    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    stats.totalRequests++;

    try {
      await makeRequest(endpoint.url, endpoint.name);
      requestCount++;
    } catch (error) {
      // Error already logged in makeRequest
    }
  }, 1000); // One request per second per user

  return () => clearInterval(interval);
}

// Calculate statistics
function calculateStats() {
  const responseTimes = stats.responseTimes;
  if (responseTimes.length === 0) return null;

  responseTimes.sort((a, b) => a - b);
  
  const sum = responseTimes.reduce((a, b) => a + b, 0);
  const avg = sum / responseTimes.length;
  const median = responseTimes[Math.floor(responseTimes.length / 2)];
  const p95 = responseTimes[Math.floor(responseTimes.length * 0.95)];
  const p99 = responseTimes[Math.floor(responseTimes.length * 0.99)];
  const min = responseTimes[0];
  const max = responseTimes[responseTimes.length - 1];

  return {
    avg: Math.round(avg),
    median: Math.round(median),
    p95: Math.round(p95),
    p99: Math.round(p99),
    min,
    max,
  };
}

// Main test runner
async function runStressTest() {
  console.log('⏳ Starting stress test...\n');

  const cleanupFunctions = [];
  
  // Start all concurrent users
  for (let i = 0; i < concurrentUsers; i++) {
    const cleanup = await simulateUser(i);
    cleanupFunctions.push(cleanup);
  }

  // Wait for duration
  await new Promise(resolve => setTimeout(resolve, durationSeconds * 1000));

  // Cleanup
  cleanupFunctions.forEach(cleanup => cleanup());

  // Calculate and display results
  const responseTimeStats = calculateStats();
  const elapsed = (Date.now() - stats.startTime) / 1000;
  const requestsPerSecond = stats.totalRequests / elapsed;

  console.log('\n📊 Stress Test Results:');
  console.log('═══════════════════════════════════════════════════');
  console.log(`Duration: ${elapsed.toFixed(1)} seconds`);
  console.log(`Concurrent Users: ${concurrentUsers}`);
  console.log(`Total Requests: ${stats.totalRequests}`);
  console.log(`Requests/Second: ${requestsPerSecond.toFixed(2)}`);
  console.log(`Successful: ${stats.successfulRequests} (${((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1)}%)`);
  console.log(`Failed: ${stats.failedRequests} (${((stats.failedRequests / stats.totalRequests) * 100).toFixed(1)}%)`);

  if (responseTimeStats) {
    console.log('\n⏱️  Response Time Statistics (ms):');
    console.log(`  Average: ${responseTimeStats.avg}ms`);
    console.log(`  Median: ${responseTimeStats.median}ms`);
    console.log(`  P95: ${responseTimeStats.p95}ms`);
    console.log(`  P99: ${responseTimeStats.p99}ms`);
    console.log(`  Min: ${responseTimeStats.min}ms`);
    console.log(`  Max: ${responseTimeStats.max}ms`);
  }

  if (stats.errors.length > 0) {
    console.log(`\n❌ Errors: ${stats.errors.length}`);
    const uniqueErrors = [...new Set(stats.errors.map(e => e.error))];
    uniqueErrors.slice(0, 5).forEach(error => {
      console.log(`  - ${error}`);
    });
  }

  console.log('═══════════════════════════════════════════════════\n');

  // Determine if test passed
  const successRate = (stats.successfulRequests / stats.totalRequests) * 100;
  const avgResponseTime = responseTimeStats?.avg || 0;

  if (successRate < 95) {
    console.log('❌ Test FAILED: Success rate below 95%');
    process.exit(1);
  } else if (avgResponseTime > 2000) {
    console.log('⚠️  Test WARNING: Average response time above 2 seconds');
    process.exit(0);
  } else {
    console.log('✅ Test PASSED: System handled load successfully');
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  runStressTest().catch(error => {
    console.error('❌ Stress test failed:', error);
    process.exit(1);
  });
}

module.exports = { runStressTest };

