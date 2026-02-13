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

// Update affiliate
export async function PATCH(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const userId = req.headers.get('x-user-id') || req.headers.get('user-id');
    
    if (!userId || !(await checkAdmin(userId))) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Admin access required' },
        { status: 403 }
      );
    }

    const { code } = params;
    const body = await req.json();
    const { commissionPercent, active, name, email } = body;

    const updates: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (commissionPercent !== undefined) updates.commissionPercent = commissionPercent;
    if (active !== undefined) updates.active = active;
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;

    await db.collection('affiliates').doc(code).update(updates);

    // Log audit
    await db.collection('auditLogs').add({
      action: 'update_affiliate',
      adminId: userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      metadata: { code, ...updates },
    });

    return NextResponse.json({ success: true, message: 'Affiliate updated' });
  } catch (error: any) {
    console.error('[ERROR] Update affiliate failed:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

// Get affiliate conversions
export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const userId = req.headers.get('x-user-id') || req.headers.get('user-id');
    
    if (!userId || !(await checkAdmin(userId))) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Admin access required' },
        { status: 403 }
      );
    }

    const { code } = params;

    const conversionsSnapshot = await db.collection('affiliateConversions')
      .where('affiliateCode', '==', code)
      .orderBy('timestamp', 'desc')
      .limit(1000)
      .get();

    const conversions = conversionsSnapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate?.()?.toISOString(),
      };
    });

    return NextResponse.json({ conversions, total: conversions.length });
  } catch (error: any) {
    console.error('[ERROR] Get affiliate conversions failed:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

