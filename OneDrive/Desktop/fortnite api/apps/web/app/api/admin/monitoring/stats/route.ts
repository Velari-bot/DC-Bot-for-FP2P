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

// Get system monitoring stats
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
    const timeRange = searchParams.get('range') || '24h'; // 1h, 24h, 7d, 30d

    // Calculate time range
    const now = new Date();
    let startTime: Date;
    switch (timeRange) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const startTimestamp = admin.firestore.Timestamp.fromDate(startTime);

    // Active users (last 5 minutes)
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const fiveMinTimestamp = admin.firestore.Timestamp.fromDate(fiveMinutesAgo);
    
    const activeUsersSnapshot = await db.collection('users')
      .where('lastLogin', '>=', fiveMinTimestamp)
      .get();
    const activeUsers = activeUsersSnapshot.size;

    // Total users
    const totalUsersSnapshot = await db.collection('users').get();
    const totalUsers = totalUsersSnapshot.size;

    // Recent signups
    const recentSignupsSnapshot = await db.collection('users')
      .where('createdAt', '>=', startTimestamp)
      .get();
    const recentSignups = recentSignupsSnapshot.size;

    // Active subscriptions
    const activeSubsSnapshot = await db.collection('subscriptions')
      .where('status', '==', 'active')
      .get();
    const activeSubscriptions = activeSubsSnapshot.size;

    // Get usage stats from messages (approximate)
    // Count messages in time range
    const messagesSnapshot = await db.collectionGroup('messages')
      .where('timestamp', '>=', startTimestamp)
      .get();
    
    const messages = messagesSnapshot.size;
    const voiceMessages = messagesSnapshot.docs.filter(
      doc => doc.data().audioUrl || doc.data().type === 'voice'
    ).length;

    // Calculate messages per minute (approximate)
    const minutesInRange = (now.getTime() - startTime.getTime()) / (60 * 1000);
    const messagesPerMinute = minutesInRange > 0 ? messages / minutesInRange : 0;
    const voicePerMinute = minutesInRange > 0 ? voiceMessages / minutesInRange : 0;

    // Get error logs (if stored in Firestore)
    let errorCount = 0;
    try {
      const errorsSnapshot = await db.collection('errorLogs')
        .where('timestamp', '>=', startTimestamp)
        .get();
      errorCount = errorsSnapshot.size;
    } catch {}

    // Get total revenue (from subscriptions)
    let totalRevenue = 0;
    try {
      const allSubs = await db.collection('subscriptions')
        .where('status', '==', 'active')
        .get();
      
      // Approximate revenue (this is a rough estimate)
      // In production, you'd query Stripe for actual revenue
      allSubs.docs.forEach(doc => {
        const planId = doc.data().planId;
        if (planId === 'pro_monthly') totalRevenue += 6.99;
        else if (planId === 'pro_yearly') totalRevenue += 69.99;
      });
    } catch {}

    return NextResponse.json({
      timeRange,
      stats: {
        activeUsers,
        totalUsers,
        recentSignups,
        activeSubscriptions,
        messages,
        messagesPerMinute: Math.round(messagesPerMinute * 100) / 100,
        voiceMessages,
        voicePerMinute: Math.round(voicePerMinute * 100) / 100,
        errorCount,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
      },
      timestamp: now.toISOString(),
    });
  } catch (error: any) {
    console.error('[ERROR] Get monitoring stats failed:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

