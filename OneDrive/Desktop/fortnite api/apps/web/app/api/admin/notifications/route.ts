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

// Send notification (placeholder - integrate with Brevo API)
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
    const { type, targetUserId, subject, message, toAll } = body;

    if (!type || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: type, message' },
        { status: 400 }
      );
    }

    // Store notification in Firestore
    const notificationData: any = {
      type, // 'push', 'email', 'account'
      subject: subject || null,
      message,
      createdBy: userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending',
    };

    if (toAll) {
      // Send to all users
      notificationData.targetUserId = null;
      notificationData.toAll = true;
      
      // Store in notifications collection
      await db.collection('notifications').add(notificationData);
      
      // TODO: Integrate with Brevo API to send emails
      // TODO: Integrate with push notification service
    } else if (targetUserId) {
      // Send to specific user
      notificationData.targetUserId = targetUserId;
      notificationData.toAll = false;
      
      // Get user email
      const userDoc = await db.collection('users').doc(targetUserId).get();
      if (userDoc.exists) {
        const userEmail = userDoc.data()!.email;
        
        // Store notification
        await db.collection('notifications').add(notificationData);
        
        // TODO: Send email via Brevo API
        // TODO: Send push notification if user has app
      } else {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Either targetUserId or toAll must be provided' },
        { status: 400 }
      );
    }

    // Log audit
    await db.collection('auditLogs').add({
      action: 'send_notification',
      adminId: userId,
      targetUserId: targetUserId || 'all',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      metadata: { type, toAll: !!toAll },
    });

    return NextResponse.json({ 
      success: true, 
      message: toAll ? 'Notification queued for all users' : 'Notification sent' 
    });
  } catch (error: any) {
    console.error('[ERROR] Send notification failed:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

// Get notification history
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
    const limit = parseInt(searchParams.get('limit') || '50');

    const notificationsSnapshot = await db.collection('notifications')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const notifications = notificationsSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
    }));

    return NextResponse.json({ notifications, total: notifications.length });
  } catch (error: any) {
    console.error('[ERROR] Get notifications failed:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

