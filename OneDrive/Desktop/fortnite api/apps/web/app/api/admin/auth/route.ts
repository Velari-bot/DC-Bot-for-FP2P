import { NextRequest, NextResponse } from 'next/server';
import { db, admin } from '@/lib/firebase-admin';

// Check if user is admin
export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || req.headers.get('user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'User ID required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data()!;
    const isAdmin = userData.role === 'owner' || userData.role === 'admin' || userData.isAdmin === true;

    return NextResponse.json({
      isAdmin,
      role: userData.role || 'user',
      email: userData.email,
      username: userData.username,
    });
  } catch (error: any) {
    console.error('[ERROR] Admin auth check failed:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

