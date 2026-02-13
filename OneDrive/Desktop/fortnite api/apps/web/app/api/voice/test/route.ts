import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Test environment variables
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasFirebase = !!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    const hasFirebaseProject = !!process.env.FIREBASE_PROJECT_ID;

    return NextResponse.json({
      status: 'ok',
      environment: {
        OPENAI_API_KEY: hasOpenAI ? 'Set ✅' : 'Missing ❌',
        GOOGLE_APPLICATION_CREDENTIALS_JSON: hasFirebase ? 'Set ✅' : 'Missing ❌',
        FIREBASE_PROJECT_ID: hasFirebaseProject ? 'Set ✅' : 'Missing ❌',
        NODE_ENV: process.env.NODE_ENV,
      },
      message: 'Voice API test endpoint - all systems check'
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

