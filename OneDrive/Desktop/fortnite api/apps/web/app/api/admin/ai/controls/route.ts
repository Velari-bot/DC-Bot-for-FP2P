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

// Get AI controls config
export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || req.headers.get('user-id');
    
    if (!userId || !(await checkAdmin(userId))) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get global config
    const configDoc = await db.collection('config').doc('global').get();
    
    if (!configDoc.exists) {
      // Return defaults
      return NextResponse.json({
        limits: {
          freeMessagesPerDay: 15,
          proMessagesPerMonth: 300,
          freeVoiceSecondsPerDay: 30,
          proVoiceMinutesPerMonth: 100,
        },
        models: {
          enabled: ['gpt-4o-mini'],
          default: 'gpt-4o-mini',
        },
        gameKnowledge: {
          enabled: true,
          lastUpdated: null,
        },
        behavior: {
          strictness: 'medium',
          allowedTopics: ['fortnite', 'gameplay', 'strategy', 'mechanics'],
        },
      });
    }

    const config = configDoc.data()!;

    return NextResponse.json({
      limits: {
        freeMessagesPerDay: config.freeMessageLimit || 15,
        proMessagesPerMonth: config.proMessageLimit || 300,
        freeVoiceSecondsPerDay: config.freeVoiceLimit || 30,
        proVoiceMinutesPerMonth: config.proVoiceLimit || 100,
      },
      models: config.models || {
        enabled: ['gpt-4o-mini'],
        default: 'gpt-4o-mini',
      },
      gameKnowledge: config.gameKnowledge || {
        enabled: true,
        lastUpdated: null,
      },
      behavior: config.behavior || {
        strictness: 'medium',
        allowedTopics: ['fortnite', 'gameplay', 'strategy', 'mechanics'],
      },
    });
  } catch (error: any) {
    console.error('[ERROR] Get AI controls failed:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

// Update AI controls
export async function PATCH(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || req.headers.get('user-id');
    
    if (!userId || !(await checkAdmin(userId))) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { limits, models, gameKnowledge, behavior } = body;

    const updates: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (limits) {
      if (limits.freeMessagesPerDay !== undefined) updates.freeMessageLimit = limits.freeMessagesPerDay;
      if (limits.proMessagesPerMonth !== undefined) updates.proMessageLimit = limits.proMessagesPerMonth;
      if (limits.freeVoiceSecondsPerDay !== undefined) updates.freeVoiceLimit = limits.freeVoiceSecondsPerDay;
      if (limits.proVoiceMinutesPerMonth !== undefined) updates.proVoiceLimit = limits.proVoiceMinutesPerMonth;
    }

    if (models) updates.models = models;
    if (gameKnowledge) updates.gameKnowledge = gameKnowledge;
    if (behavior) updates.behavior = behavior;

    await db.collection('config').doc('global').set(updates, { merge: true });

    // Log audit
    await db.collection('auditLogs').add({
      action: 'update_ai_controls',
      adminId: userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      metadata: { limits, models, gameKnowledge, behavior },
    });

    return NextResponse.json({ success: true, message: 'AI controls updated' });
  } catch (error: any) {
    console.error('[ERROR] Update AI controls failed:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

