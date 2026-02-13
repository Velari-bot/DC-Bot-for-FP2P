// PathGen Backend — Voice Coach API
// Processes voice audio and returns AI response

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { db, admin } from '../../../../lib/firebase-admin';
import { COLLECTIONS, DEFAULT_FREE_LIMITS, DEFAULT_PRO_LIMITS, ADDON_LIMITS } from '../../../../lib/constants';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds max for voice processing

// PathGen AI Voice Assistant System Prompt
const VOICE_COACH_SYSTEM_PROMPT = `You are PathGen AI Voice Assistant. You are helpful, friendly, and conversational.

🎤 VOICE RESPONSE STYLE:
- Keep responses SHORT (10-15 seconds max when spoken)
- Be natural and conversational
- Friendly and helpful tone
- Clear and easy to understand

💬 CONVERSATION STYLE:
- Remember context from previous messages
- Have natural back-and-forth dialogue
- Ask clarifying questions when needed
- Be personable and engaging

IMPORTANT: Return responses in JSON format:
{"type": "voice", "text": "Your conversational response here.", "emotion": "friendly"}`;

/**
 * Check voice usage limits
 */
async function checkVoiceUsage(userId: string, durationSeconds: number, email?: string): Promise<{ allowed: boolean; remaining: number; limit: number; reason?: string; interactionsRemaining?: number; actualUserId?: string }> {
  try {
    // Try multiple lookup methods: direct ID, email query, discordId query
    let userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    let actualUserId = userId;

    // If not found by direct ID, try querying by email
    if (!userDoc.exists && userId.includes('@')) {
      const emailQuery = await db.collection(COLLECTIONS.USERS)
        .where('email', '==', userId)
        .limit(1)
        .get();
      if (!emailQuery.empty) {
        userDoc = emailQuery.docs[0];
        actualUserId = userDoc.id;
      }
    }

    // If still not found, try querying by discordId
    if (!userDoc.exists) {
      const discordQuery = await db.collection(COLLECTIONS.USERS)
        .where('discordId', '==', userId)
        .limit(1)
        .get();
      if (!discordQuery.empty) {
        userDoc = discordQuery.docs[0];
        actualUserId = userDoc.id;
      }
    }

    // If still not found and we have an email parameter, try querying by email
    if (!userDoc.exists && email) {
      const emailQuery = await db.collection(COLLECTIONS.USERS)
        .where('email', '==', email)
        .limit(1)
        .get();
      if (!emailQuery.empty) {
        userDoc = emailQuery.docs[0];
        actualUserId = userDoc.id;
      }
    }

    // Get usage document using the actual user ID
    const usageDoc = await db.collection(COLLECTIONS.USAGE).doc(actualUserId).get();

    if (!userDoc.exists || !usageDoc.exists) {
      console.error(`[ERROR] User or usage not found for userId: ${userId}, tried actualUserId: ${actualUserId}`);
      return { allowed: false, remaining: 0, limit: 0, reason: 'User not found' };
    }

    const userData = userDoc.data()!;
    const usageData = usageDoc.data()!;
    const now = admin.firestore.Timestamp.now();

    // Check if period has expired
    if (usageData.periodEnd && now.toMillis() > usageData.periodEnd.toMillis()) {
      // Period expired - will be reset by webhook, but check current limits
    }

    const isPremium = userData.isPremium || userData.plan === 'pro';
    const hasVoiceAddon = userData.addons?.includes('voice') || userData.hasVoiceAddon || false;
    const isFreeTier = !isPremium;

    // Free tier limits: 10 interactions/month, 60 seconds/month
    if (isFreeTier && !hasVoiceAddon) {
      const voiceSecondsThisPeriod = usageData.voiceSecondsThisPeriod || 0;
      const voiceInteractionsThisPeriod = usageData.voiceInteractionsThisPeriod || 0;
      const monthlySecondsLimit = DEFAULT_FREE_LIMITS.maxVoiceSecondsPerMonth; // 60 seconds/month
      const monthlyInteractionsLimit = DEFAULT_FREE_LIMITS.maxVoiceInteractionsPerMonth; // 10 interactions/month
      const newSecondsTotal = voiceSecondsThisPeriod + durationSeconds;
      const newInteractionsTotal = voiceInteractionsThisPeriod + 1;

      if (newInteractionsTotal > monthlyInteractionsLimit) {
        return {
          allowed: false,
          remaining: Math.max(0, monthlyInteractionsLimit - voiceInteractionsThisPeriod),
          limit: monthlyInteractionsLimit,
          reason: 'Free tier: Maximum 10 voice interactions per month reached'
        };
      }

      if (newSecondsTotal > monthlySecondsLimit) {
        return {
          allowed: false,
          remaining: Math.max(0, monthlySecondsLimit - voiceSecondsThisPeriod),
          limit: monthlySecondsLimit,
          reason: 'Free tier: Maximum 60 seconds per month reached'
        };
      }

      return {
        allowed: true,
        remaining: monthlySecondsLimit - newSecondsTotal,
        limit: monthlySecondsLimit,
        interactionsRemaining: monthlyInteractionsLimit - newInteractionsTotal,
        actualUserId
      };
    }

    // Voice add-on limits: 550 interactions/month, 3,600 seconds/month (60 minutes)
    if (hasVoiceAddon) {
      const voiceSecondsThisPeriod = usageData.voiceSecondsThisPeriod || 0;
      const voiceInteractionsThisPeriod = usageData.voiceInteractionsThisPeriod || 0;
      const totalInteractionsLimit = ADDON_LIMITS.voice.totalInteractionsPerMonth || 550; // 550 interactions/month
      const maxSecondsPerMonth = ADDON_LIMITS.voice.maxSecondsPerMonth || 3600; // 3,600 seconds/month (60 minutes)
      const sessionLimit = ADDON_LIMITS.voice.maxSecondsPerSession || 1800; // 30 minutes per session (hard cap)
      
      const newInteractionsTotal = voiceInteractionsThisPeriod + 1;
      const newSecondsTotal = voiceSecondsThisPeriod + durationSeconds;

      // Check session limit (30 minutes max per session)
      if (durationSeconds > sessionLimit) {
        return {
          allowed: false,
          remaining: 0,
          limit: sessionLimit,
          reason: 'Session limit exceeded (30 minutes max per session)'
        };
      }

      // Check monthly seconds limit (3,600 seconds/month = 60 minutes)
      if (newSecondsTotal > maxSecondsPerMonth) {
        return {
          allowed: false,
          remaining: Math.max(0, maxSecondsPerMonth - voiceSecondsThisPeriod),
          limit: maxSecondsPerMonth,
          reason: 'Monthly seconds limit reached (3,600 seconds/month)'
        };
      }

      // Check interaction limit (550 interactions/month)
      if (newInteractionsTotal > totalInteractionsLimit) {
        return {
          allowed: false,
          remaining: Math.max(0, totalInteractionsLimit - voiceInteractionsThisPeriod),
          limit: totalInteractionsLimit,
          reason: 'Monthly interaction limit reached (550 interactions/month)'
        };
      }

      // All checks passed
      return {
        allowed: true,
        remaining: maxSecondsPerMonth - newSecondsTotal,
        limit: maxSecondsPerMonth,
        interactionsRemaining: totalInteractionsLimit - newInteractionsTotal,
        actualUserId
      };
    }

    // Base pro has no voice access
    if (isPremium && !hasVoiceAddon) {
      return {
        allowed: false,
        remaining: 0,
        limit: 0,
        reason: 'Voice interaction requires Voice Add-On. Upgrade to unlock voice coaching.'
      };
    }

    return { allowed: false, remaining: 0, limit: 0, reason: 'Voice not available for your tier' };
  } catch (error: any) {
    console.error('[ERROR] Failed to check voice usage:', error);
    return { allowed: false, remaining: 0, limit: 0, reason: 'Error checking usage' };
  }
}

/**
 * Update voice usage in Firestore
 */
async function updateVoiceUsage(actualUserId: string, durationSeconds: number): Promise<void> {
  try {
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(actualUserId).get();
    const usageDoc = await db.collection(COLLECTIONS.USAGE).doc(actualUserId).get();

    if (!userDoc.exists || !usageDoc.exists) {
      throw new Error('User or usage document not found');
    }

    const userData = userDoc.data()!;
    const usageData = usageDoc.data()!;
    const isPremium = userData.isPremium || userData.plan === 'pro';
    const hasVoiceAddon = userData.addons?.includes('voice') || userData.hasVoiceAddon || false;
    const isFreeTier = !isPremium;

    const batch = db.batch();
    const now = admin.firestore.Timestamp.now();

    if (isFreeTier && !hasVoiceAddon) {
      // Free tier: track monthly seconds and interactions
      const currentSeconds = usageData.voiceSecondsThisPeriod || 0;
      const currentInteractions = usageData.voiceInteractionsThisPeriod || 0;
      batch.update(db.collection(COLLECTIONS.USAGE).doc(actualUserId), {
        voiceSecondsThisPeriod: currentSeconds + durationSeconds,
        voiceInteractionsThisPeriod: currentInteractions + 1,
        lastVoiceUsage: now
      });
    } else if (hasVoiceAddon) {
      // Voice add-on: track monthly interactions and seconds (unlimited seconds, but track for analytics)
      const currentSeconds = usageData.voiceSecondsThisPeriod || 0;
      const currentInteractions = usageData.voiceInteractionsThisPeriod || 0;
      batch.update(db.collection(COLLECTIONS.USAGE).doc(actualUserId), {
        voiceSecondsThisPeriod: currentSeconds + durationSeconds,
        voiceInteractionsThisPeriod: currentInteractions + 1,
        lastVoiceUsage: now
      });
    }

    await batch.commit();
    console.log(`[SUCCESS] Updated voice usage for user ${actualUserId}: +${durationSeconds}s`);
  } catch (error: any) {
    console.error('[ERROR] Failed to update voice usage:', error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('[VOICE] Voice coach API called');
    
    // Check OpenAI API key first
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      console.error('[ERROR] OPENAI_API_KEY not configured');
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.' },
        { status: 500 }
      );
    }
    
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const userId = formData.get('userId') as string;
    const email = formData.get('email') as string | null;
    const durationSeconds = parseInt(formData.get('durationSeconds') as string) || 0;
    const conversationHistory = formData.get('conversationHistory') as string | null;

    if (!audioFile || !userId) {
      console.error('[ERROR] Missing required fields:', { hasAudio: !!audioFile, hasUserId: !!userId });
      return NextResponse.json(
        { error: 'Audio file and userId are required' },
        { status: 400 }
      );
    }

    console.log(`[VOICE] Processing voice request from user ${userId} (email: ${email}), duration: ${durationSeconds}s`);

    // Check usage limits BEFORE processing
    console.log('[VOICE] Checking usage limits...');
    let usageCheck;
    let actualUserId = userId;
    try {
      usageCheck = await checkVoiceUsage(userId, durationSeconds, email || undefined);
      actualUserId = usageCheck.actualUserId || userId;
      console.log('[VOICE] Usage check result:', usageCheck);
    } catch (usageError: any) {
      console.error('[ERROR] Usage check failed:', usageError);
      console.error('[ERROR] Usage check error details:', usageError.message);
      // Continue anyway for testing - remove this in production
      usageCheck = { allowed: true, remaining: 3600, limit: 3600 };
    }
    
    if (!usageCheck.allowed) {
      console.log('[VOICE] Usage limit exceeded');
      return NextResponse.json(
        {
          error: 'Voice limit exceeded',
          limitExceeded: true,
          reason: usageCheck.reason,
          remaining: usageCheck.remaining,
          limit: usageCheck.limit
        },
        { status: 403 }
      );
    }

    console.log('[VOICE] Creating OpenAI client...');
    console.log('[VOICE] API key format:', OPENAI_API_KEY.substring(0, 10) + '...');
    
    const openai = new OpenAI({ 
      apiKey: OPENAI_API_KEY,
      maxRetries: 2,
      timeout: 60000 // 60 second timeout
    });

    // Convert audio file to buffer
    console.log('[VOICE] Converting audio to buffer...');
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    console.log(`[VOICE] Audio buffer size: ${audioBuffer.length} bytes`);

    // Transcribe audio using Whisper
    console.log('[VOICE] Calling Whisper API for transcription...');
    console.log(`[VOICE] Audio file size: ${audioBuffer.length} bytes, type: audio/webm`);
    
    let transcription;
    try {
      console.log('[VOICE] Creating File object from audio buffer...');
      const audioFile = new File([audioBuffer], 'recording.webm', { type: 'audio/webm' });
      console.log('[VOICE] File created, size:', audioFile.size, 'bytes');
      
      console.log('[VOICE] Calling openai.audio.transcriptions.create...');
      transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1'
      });
      console.log('[VOICE] Transcription complete, result:', transcription);
    } catch (whisperError: any) {
      console.error('[ERROR] Whisper API failed:', whisperError);
      console.error('[ERROR] Full error object:', JSON.stringify(whisperError, null, 2));
      console.error('[ERROR] Whisper error code:', whisperError.code);
      console.error('[ERROR] Whisper error status:', whisperError.status);
      console.error('[ERROR] Whisper error type:', whisperError.type);
      console.error('[ERROR] Whisper error message:', whisperError.message);
      
      // Return detailed error for debugging
      return NextResponse.json(
        {
          error: 'Speech recognition failed',
          message: whisperError.message || 'Whisper API error',
          code: whisperError.code,
          type: whisperError.type,
          details: whisperError.error || whisperError
        },
        { status: whisperError.status || 500 }
      );
    }

    const transcript = transcription.text.trim();

    if (!transcript || transcript.length === 0) {
      return NextResponse.json(
        { error: 'No speech detected in audio' },
        { status: 400 }
      );
    }

    console.log(`[VOICE] Transcript: "${transcript}"`);

    // Parse conversation history if provided
    let messages: any[] = [
      {
        role: 'system',
        content: VOICE_COACH_SYSTEM_PROMPT,
      }
    ];

    if (conversationHistory) {
      try {
        const history = JSON.parse(conversationHistory);
        messages.push(...history);
      } catch (e) {
        console.log('[VOICE] Could not parse conversation history');
      }
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: transcript,
    });

    // Generate AI response
    console.log('[VOICE] Generating AI response with', messages.length, 'messages...');
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: messages,
      max_tokens: 200, // Longer for conversational responses
      temperature: 0.8, // More creative for conversation
      response_format: { type: 'json_object' },
    });

    const responseContent = completion.choices[0].message.content || '{"type": "voice", "text": "I understand.", "emotion": "calm", "category": "strategy"}';
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseContent);
    } catch {
      parsedResponse = {
        type: 'voice',
        text: responseContent,
        emotion: 'calm',
        category: 'strategy'
      };
    }

    // Generate speech using TTS
    console.log('[VOICE] Generating speech with TTS...');
    const ttsResponse = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy', // Default voice, can be customized
      input: parsedResponse.text || responseContent,
    });

    const audioBufferResponse = Buffer.from(await ttsResponse.arrayBuffer());
    const audioBase64 = audioBufferResponse.toString('base64');
    console.log(`[VOICE] TTS audio generated, size: ${audioBase64.length} chars`);

    // Update usage AFTER successful processing
    console.log('[VOICE] Updating usage...');
    await updateVoiceUsage(actualUserId, durationSeconds);
    console.log('[VOICE] Voice processing complete!');

    // Calculate tokens (approximate)
    const tokensUsed = completion.usage?.total_tokens || 0;

    return NextResponse.json({
      transcript,
      responseText: parsedResponse.text || responseContent,
      responseAudio: audioBase64,
      audioFormat: 'mp3',
      metadata: {
        seconds: durationSeconds,
        tokens: tokensUsed,
        category: parsedResponse.category || 'strategy',
        emotion: parsedResponse.emotion || 'calm'
      },
      usage: {
        remaining: usageCheck.remaining - durationSeconds,
        limit: usageCheck.limit
      }
    });
  } catch (error: any) {
    console.error('[ERROR] Voice coach error:', error);
    console.error('[ERROR] Error stack:', error.stack);
    console.error('[ERROR] Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    
    return NextResponse.json(
      {
        error: 'Failed to process voice request',
        message: error.message || 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

