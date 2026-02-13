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

// Get analytics dashboard data
export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || req.headers.get('user-id');
    
    if (!userId || !(await checkAdmin(userId))) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Admin access required' },
        { status: 403 }
      );
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const todayTimestamp = admin.firestore.Timestamp.fromDate(today);
    const yesterdayTimestamp = admin.firestore.Timestamp.fromDate(yesterday);
    const lastWeekTimestamp = admin.firestore.Timestamp.fromDate(lastWeek);
    const lastMonthTimestamp = admin.firestore.Timestamp.fromDate(lastMonth);

    // Signups per day (last 7 days)
    const signupsLast7Days = await db.collection('users')
      .where('createdAt', '>=', lastWeekTimestamp)
      .get();
    
    const signupsByDay: Record<string, number> = {};
    signupsLast7Days.docs.forEach(doc => {
      const createdAt = doc.data().createdAt?.toDate();
      if (createdAt) {
        const day = createdAt.toISOString().split('T')[0];
        signupsByDay[day] = (signupsByDay[day] || 0) + 1;
      }
    });

    // Today's signups
    const todaySignups = await db.collection('users')
      .where('createdAt', '>=', todayTimestamp)
      .get();
    const signupsToday = todaySignups.size;

    // Active subscriptions
    const activeSubs = await db.collection('subscriptions')
      .where('status', '==', 'active')
      .get();
    const activeSubscriptions = activeSubs.size;

    // Calculate MRR (Monthly Recurring Revenue)
    let mrr = 0;
    activeSubs.docs.forEach(doc => {
      const planId = doc.data().planId;
      if (planId === 'pro_monthly') mrr += 6.99;
      else if (planId === 'pro_yearly') mrr += 69.99 / 12; // Annual divided by 12
    });

    // Usage stats (last 24 hours)
    const messagesLast24h = await db.collectionGroup('messages')
      .where('timestamp', '>=', yesterdayTimestamp)
      .get();
    
    const chatUsage = messagesLast24h.docs.filter(
      doc => !doc.data().audioUrl && doc.data().type !== 'voice'
    ).length;
    
    const voiceUsage = messagesLast24h.docs.filter(
      doc => doc.data().audioUrl || doc.data().type === 'voice'
    ).length;

    // Calculate voice minutes
    const voiceMinutes = Math.round(voiceUsage * 0.5); // Approximate 30 seconds per voice message

    // Refund rate (would need to query Stripe or store refunds in Firestore)
    // For now, return 0
    const refundRate = 0;

    // Hourly usage (last 24 hours)
    const hourlyUsage: Record<string, { chat: number; voice: number }> = {};
    messagesLast24h.docs.forEach(doc => {
      const timestamp = doc.data().timestamp?.toDate();
      if (timestamp) {
        const hour = timestamp.toISOString().substring(0, 13) + ':00:00Z';
        if (!hourlyUsage[hour]) {
          hourlyUsage[hour] = { chat: 0, voice: 0 };
        }
        if (doc.data().audioUrl || doc.data().type === 'voice') {
          hourlyUsage[hour].voice++;
        } else {
          hourlyUsage[hour].chat++;
        }
      }
    });

    return NextResponse.json({
      overview: {
        signupsToday,
        activeSubscriptions,
        mrr: Math.round(mrr * 100) / 100,
        refundRate,
      },
      usage: {
        chatLast24h: chatUsage,
        voiceLast24h: voiceMinutes,
        hourlyUsage: Object.entries(hourlyUsage)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([hour, data]) => ({ hour, ...data })),
      },
      signups: {
        last7Days: signupsByDay,
        total: signupsLast7Days.size,
      },
      timestamp: now.toISOString(),
    });
  } catch (error: any) {
    console.error('[ERROR] Get analytics dashboard failed:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

