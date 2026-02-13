import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

// Helper to check admin access
async function checkAdmin(userId: string): Promise<boolean> {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return false;
    const userData = userDoc.data()!;
    return userData.role === 'owner' || userData.role === 'admin' || userData.isAdmin === true;
  } catch {
    return false;
  }
}

// Search users by email or UID
export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || req.headers.get('user-id');
    
    if (!userId || !(await checkAdmin(userId))) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Admin access required' },
        { status: 403 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!query) {
      // Return recent users if no query
      const usersSnapshot = await db.collection('users')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      const users = usersSnapshot.docs.map((doc: any) => ({
        uid: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
        lastLogin: doc.data().lastLogin?.toDate?.()?.toISOString(),
      }));

      return NextResponse.json({ users, total: users.length });
    }

    // Search by email or UID
    const users: any[] = [];
    
    // Try exact UID match first
    try {
      const userDoc = await db.collection('users').doc(query).get();
      if (userDoc.exists) {
        const data = userDoc.data()!;
        users.push({
          uid: userDoc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString(),
          lastLogin: data.lastLogin?.toDate?.()?.toISOString(),
        });
      }
    } catch {}

    // Search by email (case-insensitive)
    if (query.includes('@')) {
      const usersSnapshot = await db.collection('users')
        .where('email', '>=', query.toLowerCase())
        .where('email', '<=', query.toLowerCase() + '\uf8ff')
        .limit(limit)
        .get();

      usersSnapshot.docs.forEach(doc => {
        if (!users.find(u => u.uid === doc.id)) {
          const data = doc.data();
          users.push({
            uid: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toISOString(),
            lastLogin: data.lastLogin?.toDate?.()?.toISOString(),
          });
        }
      });
    }

    return NextResponse.json({ users, total: users.length });
  } catch (error: any) {
    console.error('[ERROR] User search failed:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

