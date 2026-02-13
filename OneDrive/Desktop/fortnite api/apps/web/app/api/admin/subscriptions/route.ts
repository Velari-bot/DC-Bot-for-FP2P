import { NextRequest, NextResponse } from 'next/server';
import { db, admin } from '@/lib/firebase-admin';
import Stripe from 'stripe';

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

// Get all active subscriptions
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
    const status = searchParams.get('status') || 'active';
    const limit = parseInt(searchParams.get('limit') || '100');

    // Get subscriptions from Firestore
    let query = db.collection('subscriptions').orderBy('updatedAt', 'desc');
    
    if (status !== 'all') {
      query = query.where('status', '==', status) as any;
    }

    const snapshot = await query.limit(limit).get();

    const subscriptions = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const subData = doc.data();
        const uid = doc.id;

        // Get user info
        let user = null;
        try {
          const userDoc = await db.collection('users').doc(uid).get();
          if (userDoc.exists) {
            user = {
              uid: userDoc.id,
              email: userDoc.data()!.email,
              username: userDoc.data()!.username,
            };
          }
        } catch {}

        return {
          uid,
          ...subData,
          user,
          currentPeriodStart: subData.currentPeriodStart?.toDate?.()?.toISOString(),
          currentPeriodEnd: subData.currentPeriodEnd?.toDate?.()?.toISOString(),
          updatedAt: subData.updatedAt?.toDate?.()?.toISOString(),
        };
      })
    );

    return NextResponse.json({ subscriptions, total: subscriptions.length });
  } catch (error: any) {
    console.error('[ERROR] Get subscriptions failed:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

