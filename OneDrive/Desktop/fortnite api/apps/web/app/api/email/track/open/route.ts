import { NextRequest, NextResponse } from 'next/server';
import { admin, db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * Track email open event
 * Called when email is opened (via tracking pixel or webhook)
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const messageId = searchParams.get('messageId');
    const email = searchParams.get('email');

    if (!messageId || !email) {
      return NextResponse.json(
        { error: 'Missing messageId or email' },
        { status: 400 }
      );
    }

    // Find the email log
    const logsSnapshot = await db.collection('emailLogs')
      .where('messageId', '==', messageId)
      .where('to', 'array-contains', email)
      .limit(1)
      .get();

    if (!logsSnapshot.empty) {
      const doc = logsSnapshot.docs[0];
      await doc.ref.update({
        opened: true,
        openedAt: admin.firestore.FieldValue.serverTimestamp(),
        openCount: admin.firestore.FieldValue.increment(1),
      });
    }

    // Track in engagement collection
    await db.collection('emailEngagement').add({
      email,
      messageId,
      event: 'open',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Return 1x1 transparent pixel
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );

    return new NextResponse(pixel, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error: any) {
    console.error('[EMAIL] Failed to track open:', error);
    // Still return pixel even on error (don't break email rendering)
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    return new NextResponse(pixel, {
      headers: { 'Content-Type': 'image/gif' },
    });
  }
}

