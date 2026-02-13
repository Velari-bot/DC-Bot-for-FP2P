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

// Get all affiliates or create new one
export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || req.headers.get('user-id');
    
    if (!userId || !(await checkAdmin(userId))) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Admin access required' },
        { status: 403 }
      );
    }

    const affiliatesSnapshot = await db.collection('affiliates')
      .orderBy('createdAt', 'desc')
      .get();

    const affiliates = await Promise.all(
      affiliatesSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const code = doc.id;

        // Get conversion stats
        const conversionsSnapshot = await db.collection('affiliateConversions')
          .where('affiliateCode', '==', code)
          .get();

        const clicks = conversionsSnapshot.docs.filter(d => d.data().type === 'click').length;
        const signups = conversionsSnapshot.docs.filter(d => d.data().type === 'signup').length;
        const paid = conversionsSnapshot.docs.filter(d => d.data().type === 'paid').length;

        // Calculate revenue
        let revenue = 0;
        conversionsSnapshot.docs.forEach(d => {
          if (d.data().type === 'paid' && d.data().revenue) {
            revenue += d.data().revenue;
          }
        });

        return {
          code,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString(),
          stats: {
            clicks,
            signups,
            paid,
            revenue: Math.round(revenue * 100) / 100,
            conversionRate: clicks > 0 ? Math.round((signups / clicks) * 10000) / 100 : 0,
          },
        };
      })
    );

    return NextResponse.json({ affiliates, total: affiliates.length });
  } catch (error: any) {
    console.error('[ERROR] Get affiliates failed:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

// Create new affiliate
export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || req.headers.get('user-id');
    
    if (!userId || !(await checkAdmin(userId))) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { code, name, email, commissionPercent } = body;

    if (!code || !name || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: code, name, email' },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existing = await db.collection('affiliates').doc(code).get();
    if (existing.exists) {
      return NextResponse.json(
        { error: 'Affiliate code already exists' },
        { status: 400 }
      );
    }

    // Create affiliate
    await db.collection('affiliates').doc(code).set({
      name,
      email,
      commissionPercent: commissionPercent || 10,
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Log audit
    await db.collection('auditLogs').add({
      action: 'create_affiliate',
      adminId: userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      metadata: { code, name, email, commissionPercent },
    });

    return NextResponse.json({ success: true, message: 'Affiliate created' });
  } catch (error: any) {
    console.error('[ERROR] Create affiliate failed:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

