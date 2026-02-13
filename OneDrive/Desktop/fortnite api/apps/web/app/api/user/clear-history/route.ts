import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body as { userId?: string };

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log(`🧹 Clearing chat history for user: ${userId}`);

    // Delete chat history document
    await db.collection('chatHistory').doc(userId).delete();

    console.log(`✅ Successfully cleared chat history for user: ${userId}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Chat history cleared successfully' 
    });

  } catch (error: any) {
    console.error('❌ Error clearing chat history:', error);
    return NextResponse.json(
      { error: 'Failed to clear chat history', message: error.message },
      { status: 500 }
    );
  }
}

