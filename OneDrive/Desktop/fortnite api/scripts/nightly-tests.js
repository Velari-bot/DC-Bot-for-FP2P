#!/usr/bin/env node
/**
 * Nightly Automated Tests for PathGen
 * 
 * Tests:
 * - Movement advice accuracy
 * - Loadout meta updates
 * - Map rotation & POI changes
 * - Competitive updates (cups, formats, loot pool)
 * 
 * Run: node scripts/nightly-tests.js
 * Schedule: 0 2 * * * (2 AM daily)
 */

const fs = require('fs').promises;
const path = require('path');

const TEST_RESULTS_DIR = path.join(__dirname, '../data/test-results');
const TEST_LOG_FILE = path.join(TEST_RESULTS_DIR, 'nightly-tests.log');

// Ensure test results directory exists
async function ensureTestDir() {
  await fs.mkdir(TEST_RESULTS_DIR, { recursive: true });
}

// Test 1: Movement Advice Accuracy
async function testMovementAdvice() {
  console.log('🧪 Testing movement advice accuracy...');
  
  const results = {
    test: 'movement-advice',
    passed: true,
    errors: [],
    timestamp: new Date().toISOString(),
  };

  try {
    // Check if AI assistant can provide movement advice
    // This would typically call the AI API with test queries
    const testQueries = [
      'How do I improve my movement?',
      'What are the best movement techniques?',
      'How do I practice side jumps?',
    ];

    // For now, we'll just verify the data exists
    // In production, you'd call the actual AI API
    const dataFile = path.join(__dirname, '../fortnite-core/data/ingestion/records.json');
    const dataExists = await fs.access(dataFile).then(() => true).catch(() => false);

    if (!dataExists) {
      results.passed = false;
      results.errors.push('Movement advice data file not found');
    }

    console.log(`  ${results.passed ? '✅' : '❌'} Movement advice test: ${results.passed ? 'PASSED' : 'FAILED'}`);
  } catch (error) {
    results.passed = false;
    results.errors.push(error.message);
    console.log(`  ❌ Movement advice test: FAILED - ${error.message}`);
  }

  return results;
}

// Test 2: Loadout Meta Updates
async function testLoadoutMeta() {
  console.log('🧪 Testing loadout meta updates...');
  
  const results = {
    test: 'loadout-meta',
    passed: true,
    errors: [],
    timestamp: new Date().toISOString(),
  };

  try {
    // Check if meta data is recent (within last 7 days)
    const dataFile = path.join(__dirname, '../fortnite-core/data/ingestion/records.json');
    
    try {
      const data = JSON.parse(await fs.readFile(dataFile, 'utf-8'));
      const metaRecords = data.filter(r => 
        r.content?.toLowerCase().includes('meta') ||
        r.content?.toLowerCase().includes('loadout') ||
        r.content?.toLowerCase().includes('weapon')
      );

      if (metaRecords.length === 0) {
        results.passed = false;
        results.errors.push('No meta-related records found');
      } else {
        // Check if any records are recent (within 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const recentRecords = metaRecords.filter(r => {
          const recordDate = new Date(r.created_at);
          return recordDate > sevenDaysAgo;
        });

        if (recentRecords.length === 0) {
          results.passed = false;
          results.errors.push('No recent meta updates found (last 7 days)');
        }
      }
    } catch (error) {
      results.passed = false;
      results.errors.push(`Failed to read data file: ${error.message}`);
    }

    console.log(`  ${results.passed ? '✅' : '❌'} Loadout meta test: ${results.passed ? 'PASSED' : 'FAILED'}`);
  } catch (error) {
    results.passed = false;
    results.errors.push(error.message);
    console.log(`  ❌ Loadout meta test: FAILED - ${error.message}`);
  }

  return results;
}

// Test 3: Map Rotation & POI Changes
async function testMapRotation() {
  console.log('🧪 Testing map rotation & POI changes...');
  
  const results = {
    test: 'map-rotation',
    passed: true,
    errors: [],
    timestamp: new Date().toISOString(),
  };

  try {
    const dataFile = path.join(__dirname, '../fortnite-core/data/ingestion/records.json');
    
    try {
      const data = JSON.parse(await fs.readFile(dataFile, 'utf-8'));
      const mapRecords = data.filter(r => 
        r.content?.toLowerCase().includes('poi') ||
        r.content?.toLowerCase().includes('map') ||
        r.content?.toLowerCase().includes('location') ||
        r.title?.toLowerCase().includes('map')
      );

      if (mapRecords.length === 0) {
        results.passed = false;
        results.errors.push('No map-related records found');
      }
    } catch (error) {
      results.passed = false;
      results.errors.push(`Failed to read data file: ${error.message}`);
    }

    console.log(`  ${results.passed ? '✅' : '❌'} Map rotation test: ${results.passed ? 'PASSED' : 'FAILED'}`);
  } catch (error) {
    results.passed = false;
    results.errors.push(error.message);
    console.log(`  ❌ Map rotation test: FAILED - ${error.message}`);
  }

  return results;
}

// Test 4: Competitive Updates
async function testCompetitiveUpdates() {
  console.log('🧪 Testing competitive updates...');
  
  const results = {
    test: 'competitive-updates',
    passed: true,
    errors: [],
    timestamp: new Date().toISOString(),
  };

  try {
    const dataFile = path.join(__dirname, '../fortnite-core/data/ingestion/records.json');
    
    try {
      const data = JSON.parse(await fs.readFile(dataFile, 'utf-8'));
      const compRecords = data.filter(r => 
        r.content?.toLowerCase().includes('tournament') ||
        r.content?.toLowerCase().includes('fncs') ||
        r.content?.toLowerCase().includes('competitive') ||
        r.content?.toLowerCase().includes('cup') ||
        r.title?.toLowerCase().includes('tournament')
      );

      if (compRecords.length === 0) {
        results.passed = false;
        results.errors.push('No competitive update records found');
      } else {
        // Check if any records are recent (within 14 days)
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
        
        const recentRecords = compRecords.filter(r => {
          const recordDate = new Date(r.created_at);
          return recordDate > fourteenDaysAgo;
        });

        if (recentRecords.length === 0) {
          results.passed = false;
          results.errors.push('No recent competitive updates found (last 14 days)');
        }
      }
    } catch (error) {
      results.passed = false;
      results.errors.push(`Failed to read data file: ${error.message}`);
    }

    console.log(`  ${results.passed ? '✅' : '❌'} Competitive updates test: ${results.passed ? 'PASSED' : 'FAILED'}`);
  } catch (error) {
    results.passed = false;
    results.errors.push(error.message);
    console.log(`  ❌ Competitive updates test: FAILED - ${error.message}`);
  }

  return results;
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting nightly tests...\n');
  await ensureTestDir();

  const allResults = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
    },
  };

  // Run all tests
  const tests = [
    testMovementAdvice,
    testLoadoutMeta,
    testMapRotation,
    testCompetitiveUpdates,
  ];

  for (const test of tests) {
    const result = await test();
    allResults.tests.push(result);
    allResults.summary.total++;
    if (result.passed) {
      allResults.summary.passed++;
    } else {
      allResults.summary.failed++;
    }
  }

  // Save results
  const resultsFile = path.join(TEST_RESULTS_DIR, `nightly-${Date.now()}.json`);
  await fs.writeFile(resultsFile, JSON.stringify(allResults, null, 2), 'utf-8');

  // Log summary
  const logEntry = `[${new Date().toISOString()}] Tests: ${allResults.summary.passed}/${allResults.summary.total} passed\n`;
  await fs.appendFile(TEST_LOG_FILE, logEntry, 'utf-8');

  console.log('\n📊 Test Summary:');
  console.log(`  Total: ${allResults.summary.total}`);
  console.log(`  Passed: ${allResults.summary.passed}`);
  console.log(`  Failed: ${allResults.summary.failed}`);
  console.log(`\n✅ Results saved to: ${resultsFile}`);

  // Exit with error code if any tests failed
  process.exit(allResults.summary.failed > 0 ? 1 : 0);
}

// Run if called directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests };

