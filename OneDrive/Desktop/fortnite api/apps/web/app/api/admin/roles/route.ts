import { NextRequest, NextResponse } from 'next/server';
import { db, admin } from '@/lib/firebase-admin';

// Helper to check admin access (owner only for role changes)
async function checkOwner(userId: string): Promise<boolean> {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return false;
    const userData = userDoc.data()!;
    return userData.role === 'owner';
  } catch {
    return false;
  }
}

// Get all admin users
export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || req.headers.get('user-id');
    
    if (!userId || !(await checkOwner(userId))) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Owner access required' },
        { status: 403 }
      );
    }

    // Get all users with admin roles
    const usersSnapshot = await db.collection('users')
      .where('role', 'in', ['owner', 'admin', 'support', 'readonly'])
      .get();

    const admins = usersSnapshot.docs.map((doc: any) => ({
      uid: doc.id,
      email: doc.data().email,
      username: doc.data().username,
      role: doc.data().role || 'user',
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
    }));

    return NextResponse.json({ admins, total: admins.length });
  } catch (error: any) {
    console.error('[ERROR] Get admins failed:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

// Update user role
export async function PATCH(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || req.headers.get('user-id');
    
    if (!userId || !(await checkOwner(userId))) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Owner access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { targetUserId, role } = body;

    if (!targetUserId || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: targetUserId, role' },
        { status: 400 }
      );
    }

    const validRoles = ['owner', 'admin', 'support', 'readonly', 'user'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be: owner, admin, support, readonly, user' },
        { status: 400 }
      );
    }

    // Prevent removing owner role
    if (targetUserId === userId && role !== 'owner') {
      return NextResponse.json(
        { error: 'Cannot remove owner role from yourself' },
        { status: 400 }
      );
    }

    await db.collection('users').doc(targetUserId).update({
      role,
      isAdmin: role !== 'user',
    });

    // Log audit
    await db.collection('auditLogs').add({
      action: 'update_user_role',
      adminId: userId,
      targetUserId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      metadata: { role },
    });

    return NextResponse.json({ success: true, message: 'User role updated' });
  } catch (error: any) {
    console.error('[ERROR] Update role failed:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

