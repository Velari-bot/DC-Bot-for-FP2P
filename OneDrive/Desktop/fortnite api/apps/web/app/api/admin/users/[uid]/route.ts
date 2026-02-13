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

// Get user profile with full details
export async function GET(
  req: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    const userId = req.headers.get('x-user-id') || req.headers.get('user-id');
    
    if (!userId || !(await checkAdmin(userId))) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Admin access required' },
        { status: 403 }
      );
    }

    const { uid } = params;

    // Get user data
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data()!;

    // Get subscription data
    let subscription = null;
    try {
      const subDoc = await db.collection('subscriptions').doc(uid).get();
      if (subDoc.exists) {
        const subData = subDoc.data()!;
        subscription = {
          ...subData,
          currentPeriodStart: subData.currentPeriodStart?.toDate?.()?.toISOString(),
          currentPeriodEnd: subData.currentPeriodEnd?.toDate?.()?.toISOString(),
          updatedAt: subData.updatedAt?.toDate?.()?.toISOString(),
        };
      }
    } catch {}

    // Get usage data
    let usage = null;
    try {
      const usageDoc = await db.collection('usage').doc(uid).get();
      if (usageDoc.exists) {
        const usageData = usageDoc.data()!;
        usage = {
          ...usageData,
          periodStart: usageData.periodStart?.toDate?.()?.toISOString(),
          periodEnd: usageData.periodEnd?.toDate?.()?.toISOString(),
        };
      }
    } catch {}

    // Get abuse record
    let abuse = null;
    try {
      const abuseDoc = await db.collection('abuse').doc(uid).get();
      if (abuseDoc.exists) {
        const abuseData = abuseDoc.data()!;
        abuse = {
          ...abuseData,
          lastFlagAt: abuseData.lastFlagAt?.toDate?.()?.toISOString(),
          bannedUntil: abuseData.bannedUntil?.toDate?.()?.toISOString(),
        };
      }
    } catch {}

    return NextResponse.json({
      user: {
        uid,
        ...userData,
        createdAt: userData.createdAt?.toDate?.()?.toISOString(),
        lastLogin: userData.lastLogin?.toDate?.()?.toISOString(),
      },
      subscription,
      usage,
      abuse,
    });
  } catch (error: any) {
    console.error('[ERROR] Get user failed:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

// Update user (ban/unban, update subscription)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    const userId = req.headers.get('x-user-id') || req.headers.get('user-id');
    
    if (!userId || !(await checkAdmin(userId))) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Admin access required' },
        { status: 403 }
      );
    }

    const { uid } = params;
    const body = await req.json();
    const { action, ...updateData } = body;

    // Handle ban/unban
    if (action === 'ban') {
      const { bannedUntil } = body;
      await db.collection('abuse').doc(uid).set({
        bannedUntil: bannedUntil ? admin.firestore.Timestamp.fromDate(new Date(bannedUntil)) : null,
        lastFlagAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      // Log audit
      await db.collection('auditLogs').add({
        action: 'ban_user',
        adminId: userId,
        targetUserId: uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        metadata: { bannedUntil },
      });

      return NextResponse.json({ success: true, message: 'User banned' });
    }

    if (action === 'unban') {
      await db.collection('abuse').doc(uid).update({
        bannedUntil: admin.firestore.FieldValue.delete(),
      });

      // Log audit
      await db.collection('auditLogs').add({
        action: 'unban_user',
        adminId: userId,
        targetUserId: uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return NextResponse.json({ success: true, message: 'User unbanned' });
    }

    // Handle manual subscription update
    if (action === 'update_subscription') {
      const { isPremium, activePlanId, extendDays } = body;

      const updates: any = {};
      if (isPremium !== undefined) updates.isPremium = isPremium;
      if (activePlanId !== undefined) updates.activePlanId = activePlanId;

      if (Object.keys(updates).length > 0) {
        await db.collection('users').doc(uid).update(updates);
      }

      // Extend subscription period if requested
      if (extendDays) {
        const subDoc = await db.collection('subscriptions').doc(uid).get();
        if (subDoc.exists) {
          const subData = subDoc.data()!;
          const currentEnd = subData.currentPeriodEnd?.toDate() || new Date();
          const newEnd = new Date(currentEnd);
          newEnd.setDate(newEnd.getDate() + extendDays);

          await db.collection('subscriptions').doc(uid).update({
            currentPeriodEnd: admin.firestore.Timestamp.fromDate(newEnd),
          });
        }
      }

      // Log audit
      await db.collection('auditLogs').add({
        action: 'update_subscription',
        adminId: userId,
        targetUserId: uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        metadata: { ...updates, extendDays },
      });

      return NextResponse.json({ success: true, message: 'Subscription updated' });
    }

    // Handle grant free premium
    if (action === 'grant_premium') {
      const { days } = body;
      
      // Get user data first
      const userDoc = await db.collection('users').doc(uid).get();
      if (!userDoc.exists) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      const userData = userDoc.data()!;
      
      await db.collection('users').doc(uid).update({
        isPremium: true,
        activePlanId: 'pro_monthly',
      });

      // Create or update subscription
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + (days || 30));

      await db.collection('subscriptions').doc(uid).set({
        stripeCustomerId: userData.stripeCustomerId || '',
        stripeSubscriptionId: `manual_${Date.now()}`,
        planId: 'pro_monthly',
        status: 'active',
        currentPeriodStart: admin.firestore.Timestamp.now(),
        currentPeriodEnd: admin.firestore.Timestamp.fromDate(endDate),
        cancelAtPeriodEnd: false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      // Log audit
      await db.collection('auditLogs').add({
        action: 'grant_premium',
        adminId: userId,
        targetUserId: uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        metadata: { days },
      });

      return NextResponse.json({ success: true, message: 'Premium granted' });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[ERROR] Update user failed:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

