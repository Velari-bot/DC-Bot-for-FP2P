import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const source = searchParams.get('source');
    const author = searchParams.get('author');

    // Firestore requires composite indexes for queries with both where() and orderBy()
    // To avoid index requirement, we'll fetch and sort in memory when filtering
    let query: any = db.collection('memories');
    
    // Build where clauses
    if (source) {
      query = query.where('source', '==', source);
    }

    if (author) {
      query = query.where('author', '==', author);
    }

    // Only use orderBy if we're not filtering (no composite index needed)
    // If filtering, we'll sort in memory
    if (!source && !author) {
      query = query.orderBy('timestamp', 'desc');
    }

    const snapshot = await query.limit(limit * 2).get(); // Fetch more if we need to sort
    
    // Map and sort in memory if we filtered
    let memories = snapshot.docs.map((doc: QueryDocumentSnapshot) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
    }));

    // Sort by timestamp if we filtered (to avoid index requirement)
    if (source || author) {
      memories = memories.sort((a: any, b: any) => {
        const aTime = typeof a.timestamp === 'number' ? a.timestamp : 
                     (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const bTime = typeof b.timestamp === 'number' ? b.timestamp : 
                     (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return bTime - aTime; // Descending
      }).slice(0, limit); // Take only the requested limit
    }

    return NextResponse.json({
      success: true,
      count: memories.length,
      memories,
    });
  } catch (error: any) {
    console.error('[ERROR] Failed to list memories:', error);
    
    // Check if it's a Firestore index error
    if (error.code === 9 || error.message?.includes('index') || error.message?.includes('FAILED_PRECONDITION')) {
      return NextResponse.json(
        { 
          error: 'Firestore index required',
          message: error.details || error.message,
          indexUrl: error.details?.match(/https:\/\/[^\s]+/)?.[0] || 'https://console.firebase.google.com/project/pathgen-v2/firestore/indexes'
        },
        { status: 503 }
      );
    }
    
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
      { error: 'Failed to list memories', message: error.message },
      { status: 500 }
    );
  }
}

