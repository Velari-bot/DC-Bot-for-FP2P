#!/usr/bin/env node
/**
 * Test AI Assistant Video Loading
 * Verifies that the AI assistant can properly load and access video transcripts
 */

const path = require('path');

// Try to load the AI assistant
let dataLoader;
try {
  // Try to import from built version
  const aiAssistantPath = path.join(__dirname, 'packages', 'ai-assistant', 'dist', 'data-loader.js');
  dataLoader = require(aiAssistantPath);
} catch (error) {
  console.log('⚠️  Could not load built AI assistant, checking if it needs to be built...');
  console.log('   Run: cd fortnite-core && npm run build\n');
  
  // Try alternative path
  try {
    const altPath = path.join(__dirname, 'packages', 'ai-assistant', 'src', 'data-loader.ts');
    console.log('   Note: TypeScript files need to be compiled first');
  } catch (e) {
    // Ignore
  }
  
  // Check if videos can be loaded manually
  console.log('\n📋 Manual Video Check:');
  checkVideosManually();
  process.exit(0);
}

async function checkVideosManually() {
  const fs = require('fs');
  const videosDir = path.join(__dirname, 'data', 'videos');
  const indexFile = path.join(videosDir, 'index.json');
  
  if (!fs.existsSync(indexFile)) {
    console.log('❌ index.json not found');
    return;
  }
  
  const index = JSON.parse(fs.readFileSync(indexFile, 'utf8'));
  console.log(`✅ Found ${index.length} videos in index`);
  
  let loaded = 0;
  let failed = 0;
  
  for (const video of index.slice(0, 5)) {
    const videoId = video.id.replace('vid-', '');
    const transcriptFile = path.join(videosDir, `${videoId}.txt`);
    
    if (fs.existsSync(transcriptFile)) {
      const content = fs.readFileSync(transcriptFile, 'utf8');
      if (content.trim().length > 50) {
        loaded++;
        console.log(`   ✅ ${videoId}: ${content.length} chars`);
      } else {
        failed++;
        console.log(`   ❌ ${videoId}: Empty or too short`);
      }
    } else {
      failed++;
      console.log(`   ❌ ${videoId}: File not found`);
    }
  }
  
  console.log(`\n📊 Sample check: ${loaded} loaded, ${failed} failed`);
}

async function testAIAssistant() {
  console.log('🤖 Testing AI Assistant Video Loading...\n');
  
  try {
    const { loadVideos } = dataLoader;
    const videos = await loadVideos();
    
    console.log(`✅ Successfully loaded ${videos.length} videos`);
    
    if (videos.length > 0) {
      console.log('\n📄 Sample video:');
      const sample = videos[0];
      console.log(`   ID: ${sample.id}`);
      console.log(`   Title: ${sample.title || 'N/A'}`);
      console.log(`   Content length: ${sample.content?.length || 0} chars`);
      console.log(`   Source: ${sample.source || 'N/A'}`);
    }
    
    // Check if videos have content
    const withContent = videos.filter(v => v.content && v.content.length > 100);
    const withoutContent = videos.length - withContent.length;
    
    console.log(`\n📊 Content check:`);
    console.log(`   Videos with content: ${withContent.length}`);
    console.log(`   Videos without content: ${withoutContent}`);
    
    if (withoutContent > 0) {
      console.log(`\n⚠️  ${withoutContent} videos may need to be re-ingested`);
    }
    
    console.log('\n✅ AI Assistant can access video data!');
    
  } catch (error) {
    console.error('❌ Error loading videos:', error.message);
    console.error('\nStack:', error.stack);
    console.log('\n💡 Try running: cd fortnite-core && npm run build');
  }
}

// Run test
if (dataLoader) {
  testAIAssistant().catch(console.error);
} else {
  checkVideosManually();
}

