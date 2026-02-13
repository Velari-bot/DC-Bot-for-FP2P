import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body as { userId?: string };

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log(`🗑️ Deleting account for user: ${userId}`);

    // Delete all user data in a batch
    const batch = db.batch();

    // Delete from users collection
    const userRef = db.collection('users').doc(userId);
    batch.delete(userRef);

    // Delete from subscriptions collection
    const subscriptionRef = db.collection('subscriptions').doc(userId);
    batch.delete(subscriptionRef);

    // Delete from usage collection
    const usageRef = db.collection('usage').doc(userId);
    batch.delete(usageRef);

    // Delete from chatHistory collection
    const chatHistoryRef = db.collection('chatHistory').doc(userId);
    batch.delete(chatHistoryRef);

    // Commit all deletions
    await batch.commit();

    console.log(`✅ Successfully deleted account data for user: ${userId}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Account deleted successfully' 
    });

  } catch (error: any) {
    console.error('❌ Error deleting account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account', message: error.message },
      { status: 500 }
    );
  }
}

