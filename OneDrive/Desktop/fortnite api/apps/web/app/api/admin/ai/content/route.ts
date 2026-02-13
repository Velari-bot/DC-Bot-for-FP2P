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

// Get AI training content
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
    const type = searchParams.get('type'); // patchNotes, tips, questions, weapons

    let query = db.collection('aiContent').orderBy('createdAt', 'desc');
    
    if (type) {
      query = query.where('type', '==', type) as any;
    }

    const snapshot = await query.limit(100).get();

    const content = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString(),
    }));

    return NextResponse.json({ content, total: content.length });
  } catch (error: any) {
    console.error('[ERROR] Get AI content failed:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

// Add/Update AI training content
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
    const { type, title, content, id } = body;

    if (!type || !title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: type, title, content' },
        { status: 400 }
      );
    }

    const contentData: any = {
      type,
      title,
      content,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (id) {
      // Update existing
      await db.collection('aiContent').doc(id).update(contentData);
    } else {
      // Create new
      contentData.createdAt = admin.firestore.FieldValue.serverTimestamp();
      await db.collection('aiContent').add(contentData);
    }

    // Log audit
    await db.collection('auditLogs').add({
      action: id ? 'update_ai_content' : 'create_ai_content',
      adminId: userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      metadata: { type, title, id },
    });

    return NextResponse.json({ success: true, message: id ? 'Content updated' : 'Content created' });
  } catch (error: any) {
    console.error('[ERROR] Update AI content failed:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

