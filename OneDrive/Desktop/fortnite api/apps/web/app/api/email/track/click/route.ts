import { NextRequest, NextResponse } from 'next/server';
import { admin, db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * Track email click event
 * Redirects to target URL and tracks the click
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const messageId = searchParams.get('messageId');
    const email = searchParams.get('email');
    const url = searchParams.get('url');

    if (!messageId || !email || !url) {
      return NextResponse.json(
        { error: 'Missing messageId, email, or url' },
        { status: 400 }
      );
    }

    // Decode the target URL
    const targetUrl = decodeURIComponent(url);

    // Track the click
    const logsSnapshot = await db.collection('emailLogs')
      .where('messageId', '==', messageId)
      .where('to', 'array-contains', email)
      .limit(1)
      .get();

    if (!logsSnapshot.empty) {
      const doc = logsSnapshot.docs[0];
      await doc.ref.update({
        clicked: true,
        clickedAt: admin.firestore.FieldValue.serverTimestamp(),
        clickCount: admin.firestore.FieldValue.increment(1),
        clickedUrls: admin.firestore.FieldValue.arrayUnion(targetUrl),
      });
    }

    // Track in engagement collection
    await db.collection('emailEngagement').add({
      email,
      messageId,
      event: 'click',
      url: targetUrl,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Redirect to target URL
    return NextResponse.redirect(targetUrl);
  } catch (error: any) {
    console.error('[EMAIL] Failed to track click:', error);
    // Still redirect even on error
    const url = req.nextUrl.searchParams.get('url');
    if (url) {
      return NextResponse.redirect(decodeURIComponent(url));
    }
    return NextResponse.json(
      { error: 'Failed to track click' },
      { status: 500 }
    );
  }
}

