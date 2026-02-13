import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      return NextResponse.json({
        error: 'OPENAI_API_KEY not set'
      }, { status: 500 });
    }

    // Test basic OpenAI connection
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    // Test 1: List models to see what's available
    try {
      const models = await openai.models.list();
      const hasWhisper = models.data.some(m => m.id === 'whisper-1');
      const hasTTS = models.data.some(m => m.id === 'tts-1');
      const hasGPT4o = models.data.some(m => m.id.includes('gpt-4o'));

      return NextResponse.json({
        status: 'ok',
        apiKeyFormat: OPENAI_API_KEY.substring(0, 7) + '...',
        modelsAvailable: {
          whisper1: hasWhisper,
          tts1: hasTTS,
          gpt4o: hasGPT4o
        },
        totalModels: models.data.length,
        message: 'OpenAI connection successful'
      });
    } catch (modelError: any) {
      return NextResponse.json({
        status: 'error',
        error: 'Failed to list models',
        message: modelError.message,
        code: modelError.code,
        type: modelError.type
      }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

