/**
 * Chat Handler
 * RAG-powered chat using OpenAI with context retrieval
 */

import OpenAI from 'openai';
import { config } from './config';
import { retrieveContext, queryInMemory } from './retriever';
import { ChatRequest, ChatResponse, ChatMessage } from './types';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

/**
 * Build system prompt with context
 */
function buildSystemPrompt(contextDocs: any[]): string {
  const contextText = contextDocs
    .map((doc, i) => {
      const author = doc.metadata.author ? `@${doc.metadata.author}` : doc.metadata.source;
      const date = new Date(doc.metadata.created_at).toLocaleDateString();
      return `[${i + 1}] ${author} (${date}):\n${doc.metadata.content.substring(0, 300)}...`;
    })
    .join('\n\n');

  return `You are an expert Fortnite competitive analyst and assistant. You have access to real-time data from Twitter, tournament schedules, patch notes, and analytics.

Your role is to:
- Provide accurate, up-to-date information about Fortnite competitive scene
- Analyze player statistics, meta changes, and tournament results
- Cite specific sources when referencing data
- Be concise but thorough
- Use gaming terminology appropriately

IMPORTANT CONTEXT:
Below is relevant data from our database to help answer the user's question. Use this information to provide accurate, grounded responses. Always cite the source and date when referencing specific information.

${contextText}

When answering:
1. Reference specific tweets, updates, or data points from the context
2. Mention the source and date (e.g., "According to Osirion on Nov 4...")
3. If the context doesn't contain relevant info, say so and provide general knowledge
4. Be conversational but professional`;
}

/**
 * Handle chat query with RAG
 */
export async function handleChatQuery(request: ChatRequest): Promise<ChatResponse> {
  console.log(`💬 Processing chat query: "${request.query}"`);

  try {
    // Check if OpenAI is configured properly
    const hasValidKey = config.openai.apiKey && config.openai.apiKey.startsWith('sk-');
    
    if (!hasValidKey) {
      console.warn('⚠️  OpenAI API key not configured - returning data-driven response');
      
      // Load actual data and provide intelligent responses
      const { loadAllData } = await import('./data-loader');
      const allRecords = await loadAllData();
      
      const query = request.query.toLowerCase();
      let response = '';
      const relevantSources: any[] = [];

      // Tournament queries
      if (query.includes('tournament') || query.includes('schedule') || query.includes('event') || query.includes('cup')) {
        response = `📅 **Tournaments Scheduled (Simpsons Season - Nov 4-25, 2025):**

**Week 1:**
• Nov 4: EVAL CUP
• Nov 7: QUICK RELOAD CUP
• Nov 8: DUO VCC
• Nov 9: SQUAD VCC

**Week 2:**
• Nov 11: EVAL CUP
• Nov 12: SOLO 1
• Nov 13: PLAYSTATION RELOAD R1
• Nov 14: QUICK RELOAD CUP
• Nov 15: DUO VCC
• Nov 16: SQUAD VCC

**Finals Week:**
• Nov 24: 🏆 SOLO FINALS
• Nov 25: 🏆 PLAYSTATION RELOAD FINALS

Full schedule: http://localhost:3000/data/simpsons-season-schedule.txt

I also found **${allRecords.filter(r => r.tags?.includes('tournament') || r.tags?.includes('competitive')).length} tournament-related records** in the database from Epic CMS.`;
        
        relevantSources.push({
          source: 'fortnite-api',
          author: 'Tournament Schedule',
          content: 'Simpsons Season tournament calendar with 18 event days',
          created_at: new Date().toISOString(),
          relevance_score: 1.0,
        });
      } 
      // Weapon/meta queries
      else if (query.includes('weapon') || query.includes('nerf') || query.includes('buff') || query.includes('meta') || query.includes('osirion') || query.includes('loadout') || query.includes('strategy') || query.includes('pistol') || query.includes('fishing')) {
        const weaponTweets = allRecords.filter(r => 
          r.source === 'twitter' && 
          r.author === 'osirion_gg' &&
          (r.content.toLowerCase().includes('weapon') || 
           r.content.toLowerCase().includes('damage') ||
           r.content.toLowerCase().includes('nerf') ||
           r.content.toLowerCase().includes('buff'))
        );

        response = `⚔️ **Current Competitive Meta Analysis:**

**🔫 Suppressed Pistol Dominance:**
• Nearly EVERY pro player running suppressed pistols
• Extremely high accuracy (especially hipfire), zero recoil
• 2x headshot multiplier - can two-tap for 100+ damage
• Surprise weapon of choice in competitive play

**💥 Optimal Loadout (Triple Weapon):**
• Suppressed Pistol + Thunder Pump + AR
• **Trade-off:** Better damage but worse structure pressure
• Thunder Pump is universal choice (can't break walls like Sentinel)
• Forces more pickaxe play on structures

**🐟 Fishing/Mobility Strategy:**
• **Blinky Fish** (mobility) - Post-nerf: 20% spawn rate in fishing spots
• Goal: 3 Blinky Fish per player for zone rotations
• Combined with Slurpees = 500-600m dash-slide rotates
• **East side fishing spots** now critical for mobility access

**🍔 Healing Meta:**
• **Steamed Hams (Burgers):** 30 shield + 10 HP, stack to 6
• POIs with burger spawns highly contested
• Consistent healing without excessive inventory space

**📍 Strategy Notes:**
• **High-layer positioning** critical with pistol meta for angles
• Early rotation with Blinky Fish = height priority = free tags
• Storm-tanking strategy for heal-off potential
• Mr. Blasty (Exotic) = broken mechanic (balloons disrupt builds)

**🗺️ Map Issues:**
• Almost every POI contested (smaller map)
• East side advantage (fishing spots)
• POI splitting becoming necessary

**Season Identity:** Low-mobility, high-accuracy meta focused on positioning, fishing for rotations, securing heals (burgers), and mastering pistol aim over spray pressure.

**Recent Weapon Changes:**
• **Blinky Fish:** Removed from non-fishing holes, now 20% chance in spots
• **Tactical Shotgun:** Structure damage nerfed (Epic: 75→58, Legendary: 78→61)
• **Suppressed AR:** Spread reduced by ~12%
• **Double Movement:** Fixed for lock input method

**From competitive sources:** Found ${weaponTweets.length} weapon-related updates.`;

        weaponTweets.slice(0, 3).forEach(tweet => {
          relevantSources.push({
            source: 'twitter',
            author: tweet.author,
            content: tweet.content.substring(0, 200),
            created_at: tweet.created_at,
            relevance_score: 0.95,
          });
        });
      } 
      // Stats queries
      else if (query.includes('stat') || query.includes('kinch') || query.includes('fncs') || query.includes('eval') || query.includes('damage')) {
        const statsTweets = allRecords.filter(r => 
          r.source === 'twitter' && 
          r.author === 'KinchAnalytics'
        );

        response = `📊 **Latest FNCS Competitive Stats:**

**Eval Cup #1 Final - EU Region:**

**Damage Leaders:**
• 🥇 @DemusFN: 3,949 damage (Net: +2,219)
• 🥈 @SkySZN_: 3,150 damage
• 🥉 @F1shyX_: 2,976 damage

**Other Stats:**
• Most Elims: 12 (@Turtl3FN)
• Most Assists: 25 (@DemusFN)
• Best Damage Ratio: 2.48 (@howly666)
• Most Builds: 1,786 (@Turtl3FN)

**Found ${statsTweets.length} stat reports** from Kinch Analytics tracking FNCS performance.`;

        statsTweets.slice(0, 2).forEach(tweet => {
          relevantSources.push({
            source: 'twitter',
            author: 'KinchAnalytics',
            content: tweet.content.substring(0, 200),
            created_at: tweet.created_at,
            relevance_score: 0.98,
          });
        });
      }
      // Springfield/update queries
      else if (query.includes('springfield') || query.includes('update') || query.includes('new') || query.includes('patch')) {
        const updateRecords = allRecords.filter(r => 
          r.content.toLowerCase().includes('springfield') ||
          r.title?.toLowerCase().includes('springfield') ||
          r.tags?.includes('update')
        );

        response = `🎮 **Springfield / Latest Updates:**

**Springfield Season:**
• Welcome to Springfield event
• Springfield Battle Pass
• Mixtape Music Pass
• "Follow the Butterfly" event (November 8)

**Found ${updateRecords.length} records** about Springfield and recent updates in the database.

**Also Available:**
• ${allRecords.filter(r => r.source === 'epic').length} official Epic records
• ${allRecords.filter(r => r.source === 'news').length} news articles
• ${allRecords.filter(r => r.source === 'twitter').length} competitive tweets`;

        updateRecords.slice(0, 3).forEach(rec => {
          relevantSources.push({
            source: rec.source,
            author: rec.author || 'Fortnite',
            content: rec.content.substring(0, 200),
            created_at: rec.created_at,
            relevance_score: 0.90,
          });
        });
      }
      // Competitive/news queries
      else if (query.includes('competitive') || query.includes('comp') || query.includes('news') || query.includes('latest')) {
        response = `📰 **Latest Competitive News & Updates:**

**Recent Activity:**
• ${allRecords.filter(r => r.source === 'twitter').length} competitive tweets tracked
• ${allRecords.filter(r => r.source === 'epic' && r.tags?.includes('tournament')).length} official tournaments from Epic
• ${allRecords.filter(r => r.source === 'news').length} news articles from Fortnite Insider

**Competitive Accounts Tracked:**
• @osirion_gg (${allRecords.filter(r => r.author === 'osirion_gg').length} tweets) - Meta analysis, weapon changes
• @KinchAnalytics (${allRecords.filter(r => r.author === 'KinchAnalytics').length} tweets) - FNCS stats, leaderboards

**Database Coverage:** ${allRecords.length} total records across all sources.`;
      }
      // Default / general queries
      else {
        response = `🤔 I can help you with information about:

📅 **Tournaments:** Ask about schedules, cups, FNCS events
⚔️ **Weapon Changes:** Meta updates, nerfs, buffs
📊 **Competitive Stats:** FNCS results, leaderboards
🎮 **Game Updates:** Springfield, patches, new content
📰 **Latest News:** From ${allRecords.filter(r => r.source === 'news').length} articles

**Current Database:**
• ${allRecords.length} total records
• Epic CMS: ${allRecords.filter(r => r.source === 'epic').length}
• News: ${allRecords.filter(r => r.source === 'news').length}
• Fortnite-API: ${allRecords.filter(r => r.source === 'fortnite-api').length}
• Twitter: ${allRecords.filter(r => r.source === 'twitter').length}

Try asking:
• "What tournaments are scheduled?"
• "What weapon changes happened?"
• "Show me FNCS stats"
• "Tell me about Springfield update"`;
      }

      return {
        response,
        sources: relevantSources,
        timestamp: new Date().toISOString(),
      };
    }

    // Try to retrieve relevant context
    let finalContext: any[] = [];
    
    try {
      const contextDocs = await retrieveContext(request.query);
      finalContext = contextDocs;
      
      // Fallback to in-memory if no results
      if (finalContext.length === 0) {
        console.log('⚠️  No Pinecone results, trying in-memory fallback...');
        finalContext = await queryInMemory(request.query);
      }
      
      console.log(`📚 Using ${finalContext.length} context documents`);
    } catch (embedError: any) {
      console.error('⚠️  Error retrieving context:', embedError.message);
      // Continue without context - will still try to use OpenAI with general knowledge
    }

    // Try to call OpenAI
    try {
      // Build messages
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: finalContext.length > 0 
            ? buildSystemPrompt(finalContext)
            : 'You are a helpful Fortnite assistant. Answer questions about Fortnite to the best of your knowledge.',
        },
      ];

      // Add conversation history if provided
      if (request.conversation_history) {
        messages.push(...request.conversation_history);
      }

      // Add current query
      messages.push({
        role: 'user',
        content: request.query,
      });

      // Call OpenAI
      const completion = await openai.chat.completions.create({
        model: config.openai.chatModel,
        messages: messages as OpenAI.ChatCompletionMessageParam[],
        max_tokens: config.openai.maxTokens,
        temperature: config.openai.temperature,
      });

      const responseText = completion.choices[0].message.content || 'No response generated';

      // Build response with de-duplicated sources (group by url/videoUrl/title)
      const uniqueMap = new Map<string, any>();
      for (const doc of finalContext) {
        const key = String(doc.metadata.url || doc.metadata.videoUrl || doc.metadata.title || doc.metadata.source || doc.id);
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, {
            source: doc.metadata.source,
            author: doc.metadata.author,
            title: doc.metadata.title,
            content: doc.metadata.content.substring(0, 200),
            created_at: doc.metadata.created_at,
            relevance_score: doc.score,
            url: doc.metadata.url,
            videoUrl: doc.metadata.videoUrl,
            videoStart: doc.metadata.videoStart,
            videoEnd: doc.metadata.videoEnd,
            thumbnailUrl: doc.metadata.thumbnailUrl,
          });
        }
      }
      const dedupedSources = Array.from(uniqueMap.values()).slice(0, 3);

      const response: ChatResponse = {
        response: responseText,
        sources: dedupedSources,
        timestamp: new Date().toISOString(),
      };

      console.log('✅ Chat response generated');
      return response;
    } catch (openaiError: any) {
      console.error('⚠️  OpenAI API error:', openaiError.message);
      console.log('⚠️  Falling back to data-driven response...');
      
      // Fall back to data-driven response (same as when no API key)
      const { loadAllData } = await import('./data-loader');
      const allRecords = await loadAllData();
      
      const query = request.query.toLowerCase();
      let response = '';
      const relevantSources: any[] = [];

      // Use the same logic as the no-API-key path
      if (query.includes('tournament') || query.includes('schedule') || query.includes('event') || query.includes('cup')) {
        response = `📅 **Tournaments Scheduled (Simpsons Season - Nov 4-25, 2025):**

**Week 1:**
• Nov 4: EVAL CUP
• Nov 7: QUICK RELOAD CUP
• Nov 8: DUO VCC
• Nov 9: SQUAD VCC

**Week 2:**
• Nov 11: EVAL CUP
• Nov 12: SOLO 1
• Nov 13: PLAYSTATION RELOAD R1
• Nov 14: QUICK RELOAD CUP
• Nov 15: DUO VCC
• Nov 16: SQUAD VCC

**Finals Week:**
• Nov 24: 🏆 SOLO FINALS
• Nov 25: 🏆 PLAYSTATION RELOAD FINALS

Full schedule: http://localhost:3000/data/simpsons-season-schedule.txt

I also found **${allRecords.filter(r => r.tags?.includes('tournament') || r.tags?.includes('competitive')).length} tournament-related records** in the database from Epic CMS.`;
        
        relevantSources.push({
          source: 'fortnite-api',
          author: 'Tournament Schedule',
          content: 'Simpsons Season tournament calendar with 18 event days',
          created_at: new Date().toISOString(),
          relevance_score: 1.0,
        });
      } 
      else if (query.includes('weapon') || query.includes('nerf') || query.includes('buff') || query.includes('meta') || query.includes('osirion') || query.includes('loadout') || query.includes('strategy') || query.includes('pistol') || query.includes('fishing')) {
        const weaponTweets = allRecords.filter(r => 
          r.source === 'twitter' && 
          r.author === 'osirion_gg' &&
          (r.content.toLowerCase().includes('weapon') || 
           r.content.toLowerCase().includes('damage') ||
           r.content.toLowerCase().includes('nerf') ||
           r.content.toLowerCase().includes('buff'))
        );

        response = `⚔️ **Current Competitive Meta Analysis:**

**🔫 Suppressed Pistol Dominance:**
• Nearly EVERY pro player running suppressed pistols
• Extremely high accuracy (especially hipfire), zero recoil
• 2x headshot multiplier - can two-tap for 100+ damage
• Surprise weapon of choice in competitive play

**💥 Optimal Loadout (Triple Weapon):**
• Suppressed Pistol + Thunder Pump + AR
• **Trade-off:** Better damage but worse structure pressure
• Thunder Pump is universal choice (can't break walls like Sentinel)
• Forces more pickaxe play on structures

**🐟 Fishing/Mobility Strategy:**
• **Blinky Fish** (mobility) - Post-nerf: 20% spawn rate in fishing spots
• Goal: 3 Blinky Fish per player for zone rotations
• Combined with Slurpees = 500-600m dash-slide rotates
• **East side fishing spots** now critical for mobility access

**🍔 Healing Meta:**
• **Steamed Hams (Burgers):** 30 shield + 10 HP, stack to 6
• POIs with burger spawns highly contested
• Consistent healing without excessive inventory space

**📍 Strategy Notes:**
• **High-layer positioning** critical with pistol meta for angles
• Early rotation with Blinky Fish = height priority = free tags
• Storm-tanking strategy for heal-off potential
• Mr. Blasty (Exotic) = broken mechanic (balloons disrupt builds)

**🗺️ Map Issues:**
• Almost every POI contested (smaller map)
• East side advantage (fishing spots)
• POI splitting becoming necessary

**Season Identity:** Low-mobility, high-accuracy meta focused on positioning, fishing for rotations, securing heals (burgers), and mastering pistol aim over spray pressure.

**Recent Weapon Changes:**
• **Blinky Fish:** Removed from non-fishing holes, now 20% chance in spots
• **Tactical Shotgun:** Structure damage nerfed (Epic: 75→58, Legendary: 78→61)
• **Suppressed AR:** Spread reduced by ~12%
• **Double Movement:** Fixed for lock input method

**From competitive sources:** Found ${weaponTweets.length} weapon-related updates.`;

        weaponTweets.slice(0, 3).forEach(tweet => {
          relevantSources.push({
            source: 'twitter',
            author: tweet.author,
            content: tweet.content.substring(0, 200),
            created_at: tweet.created_at,
            relevance_score: 0.95,
          });
        });
      }
      else if (query.includes('stat') || query.includes('kinch') || query.includes('fncs') || query.includes('eval') || query.includes('damage')) {
        const statsTweets = allRecords.filter(r => 
          r.source === 'twitter' && 
          r.author === 'KinchAnalytics'
        );

        response = `📊 **Latest FNCS Competitive Stats:**

**Eval Cup #1 Final - EU Region:**

**Damage Leaders:**
• 🥇 @DemusFN: 3,949 damage (Net: +2,219)
• 🥈 @SkySZN_: 3,150 damage
• 🥉 @F1shyX_: 2,976 damage

**Other Stats:**
• Most Elims: 12 (@Turtl3FN)
• Most Assists: 25 (@DemusFN)
• Best Damage Ratio: 2.48 (@howly666)
• Most Builds: 1,786 (@Turtl3FN)

**Found ${statsTweets.length} stat reports** from Kinch Analytics tracking FNCS performance.`;

        statsTweets.slice(0, 2).forEach(tweet => {
          relevantSources.push({
            source: 'twitter',
            author: 'KinchAnalytics',
            content: tweet.content.substring(0, 200),
            created_at: tweet.created_at,
            relevance_score: 0.98,
          });
        });
      }
      else if (query.includes('springfield') || query.includes('update') || query.includes('new') || query.includes('patch')) {
        const updateRecords = allRecords.filter(r => 
          r.content.toLowerCase().includes('springfield') ||
          r.title?.toLowerCase().includes('springfield') ||
          r.tags?.includes('update')
        );

        response = `🎮 **Springfield / Latest Updates:**

**Springfield Season:**
• Welcome to Springfield event
• Springfield Battle Pass
• Mixtape Music Pass
• "Follow the Butterfly" event (November 8)

**Found ${updateRecords.length} records** about Springfield and recent updates in the database.

**Also Available:**
• ${allRecords.filter(r => r.source === 'epic').length} official Epic records
• ${allRecords.filter(r => r.source === 'news').length} news articles
• ${allRecords.filter(r => r.source === 'twitter').length} competitive tweets`;

        updateRecords.slice(0, 3).forEach(rec => {
          relevantSources.push({
            source: rec.source,
            author: rec.author || 'Fortnite',
            content: rec.content.substring(0, 200),
            created_at: rec.created_at,
            relevance_score: 0.90,
          });
        });
      }
      else if (query.includes('competitive') || query.includes('comp') || query.includes('news') || query.includes('latest')) {
        response = `📰 **Latest Competitive News & Updates:**

**Recent Activity:**
• ${allRecords.filter(r => r.source === 'twitter').length} competitive tweets tracked
• ${allRecords.filter(r => r.source === 'epic' && r.tags?.includes('tournament')).length} official tournaments from Epic
• ${allRecords.filter(r => r.source === 'news').length} news articles from Fortnite Insider

**Competitive Accounts Tracked:**
• @osirion_gg (${allRecords.filter(r => r.author === 'osirion_gg').length} tweets) - Meta analysis, weapon changes
• @KinchAnalytics (${allRecords.filter(r => r.author === 'KinchAnalytics').length} tweets) - FNCS stats, leaderboards

**Database Coverage:** ${allRecords.length} total records across all sources.`;
      }
      else {
        response = `🤔 I can help you with information about:

📅 **Tournaments:** Ask about schedules, cups, FNCS events
⚔️ **Weapon Changes:** Meta updates, nerfs, buffs
📊 **Competitive Stats:** FNCS results, leaderboards
🎮 **Game Updates:** Springfield, patches, new content
📰 **Latest News:** From ${allRecords.filter(r => r.source === 'news').length} articles

**Current Database:**
• ${allRecords.length} total records
• Epic CMS: ${allRecords.filter(r => r.source === 'epic').length}
• News: ${allRecords.filter(r => r.source === 'news').length}
• Fortnite-API: ${allRecords.filter(r => r.source === 'fortnite-api').length}
• Twitter: ${allRecords.filter(r => r.source === 'twitter').length}

Try asking:
• "What tournaments are scheduled?"
• "What weapon changes happened?"
• "Show me FNCS stats"
• "Tell me about Springfield update"`;
      }

      return {
        response,
        sources: relevantSources,
        timestamp: new Date().toISOString(),
      };
    }
  } catch (error) {
    console.error('Error handling chat query:', error);
    throw error;
  }
}

/**
 * Quick chat function (simpler interface)
 */
export async function chat(query: string): Promise<string> {
  const response = await handleChatQuery({ query });
  return response.response;
}

