import { NextRequest, NextResponse } from 'next/server';
import { db, admin } from '@/lib/firebase-admin';

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

// Get audit logs
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
    const action = searchParams.get('action');
    const adminId = searchParams.get('adminId');
    const limit = parseInt(searchParams.get('limit') || '100');

    let query = db.collection('auditLogs').orderBy('timestamp', 'desc');
    
    if (action) {
      query = query.where('action', '==', action) as any;
    }
    if (adminId) {
      query = query.where('adminId', '==', adminId) as any;
    }

    const snapshot = await query.limit(limit).get();

    const logs = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        
        // Get admin user info
        let adminUser = null;
        try {
          const adminDoc = await db.collection('users').doc(data.adminId).get();
          if (adminDoc.exists) {
            adminUser = {
              email: adminDoc.data()!.email,
              username: adminDoc.data()!.username,
            };
          }
        } catch {}

        return {
          id: doc.id,
          ...data,
          adminUser,
          timestamp: data.timestamp?.toDate?.()?.toISOString(),
        };
      })
    );

    return NextResponse.json({ logs, total: logs.length });
  } catch (error: any) {
    console.error('[ERROR] Get audit logs failed:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

