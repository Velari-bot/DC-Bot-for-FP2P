import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

interface IngestRequest {
  source: string;
  author: string;
  content: string;
  images?: string[]; // Array of image URLs
  imageDescriptions?: string[]; // Array of image descriptions/alt text
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as IngestRequest;

    if (!body.source || !body.author || !body.content) {
      return NextResponse.json(
        { error: 'Missing required fields: source, author, content' },
        { status: 400 }
      );
    }

    if (!body.content.trim()) {
      return NextResponse.json(
        { error: 'Content cannot be empty' },
        { status: 400 }
      );
    }

    const memoryData = {
      source: body.source,
      author: body.author,
      content: body.content.trim(),
      images: body.images || [],
      imageDescriptions: body.imageDescriptions || [],
      createdAt: new Date(),
      timestamp: Date.now(),
    };

    await db.collection('memories').add(memoryData);

    return NextResponse.json(
      { success: true, message: 'Memory ingested successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[ERROR] Memory ingestion failed:', error);
    
    // Check if it's a Firebase credentials error
    if (error.message?.includes('Could not load the default credentials') || 
        error.message?.includes('credentials') ||
        error.code === 7 || // PERMISSION_DENIED
        error.code === 16) { // UNAUTHENTICATED
      return NextResponse.json(
        { 
          error: 'Firebase credentials not configured',
          message: 'Firebase Admin SDK needs credentials to access Firestore. Please set GOOGLE_APPLICATION_CREDENTIALS_JSON in .env.local',
          setupUrl: 'https://console.firebase.google.com/project/pathgen-v2/settings/serviceaccounts/adminsdk',
          instructions: 'Run: .\\setup-local-firebase.ps1 or add GOOGLE_APPLICATION_CREDENTIALS_JSON to .env.local'
        },
        { status: 503 } // Service Unavailable
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to ingest memory', message: error.message },
      { status: 500 }
    );
  }
}

