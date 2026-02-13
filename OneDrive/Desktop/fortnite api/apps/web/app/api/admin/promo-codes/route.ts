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

// Get all promo codes or create new one
export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || req.headers.get('user-id');
    
    if (!userId || !(await checkAdmin(userId))) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Admin access required' },
        { status: 403 }
      );
    }

    const codesSnapshot = await db.collection('promoCodes')
      .orderBy('createdAt', 'desc')
      .get();

    const codes = await Promise.all(
      codesSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const code = doc.id;

        // Get redemption count
        const redemptionsSnapshot = await db.collection('promoRedemptions')
          .where('code', '==', code)
          .get();

        return {
          code,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString(),
          expiresAt: data.expiresAt?.toDate?.()?.toISOString(),
          redemptions: redemptionsSnapshot.size,
          isExpired: data.expiresAt ? data.expiresAt.toDate() < new Date() : false,
        };
      })
    );

    return NextResponse.json({ codes, total: codes.length });
  } catch (error: any) {
    console.error('[ERROR] Get promo codes failed:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

// Create promo code
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
    const { code, discountPercent, duration, maxRedemptions, expiresAt } = body;

    if (!code || discountPercent === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: code, discountPercent' },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existing = await db.collection('promoCodes').doc(code).get();
    if (existing.exists) {
      return NextResponse.json(
        { error: 'Promo code already exists' },
        { status: 400 }
      );
    }

    // Calculate expiration
    let expiresTimestamp = null;
    if (expiresAt) {
      expiresTimestamp = admin.firestore.Timestamp.fromDate(new Date(expiresAt));
    } else if (duration) {
      const expiry = new Date();
      if (duration === '1month') expiry.setMonth(expiry.getMonth() + 1);
      else if (duration === 'forever') expiresTimestamp = null;
      else expiry.setDate(expiry.getDate() + parseInt(duration));
      if (expiresTimestamp === null && duration !== 'forever') {
        expiresTimestamp = admin.firestore.Timestamp.fromDate(expiry);
      }
    }

    // Create promo code
    await db.collection('promoCodes').doc(code).set({
      discountPercent,
      duration: duration || '1month',
      maxRedemptions: maxRedemptions || null,
      active: true,
      expiresAt: expiresTimestamp,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Log audit
    await db.collection('auditLogs').add({
      action: 'create_promo_code',
      adminId: userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      metadata: { code, discountPercent, duration, maxRedemptions },
    });

    return NextResponse.json({ success: true, message: 'Promo code created' });
  } catch (error: any) {
    console.error('[ERROR] Create promo code failed:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

