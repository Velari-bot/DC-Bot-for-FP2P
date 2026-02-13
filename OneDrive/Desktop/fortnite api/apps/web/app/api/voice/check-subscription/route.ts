// PathGen Backend — Voice Subscription Check API
// Check if user has Voice Interaction add-on subscription

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body as { userId: string };

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Try to access Firestore - will fail if Firebase Admin not configured
    try {
      const userDoc = await db.collection('users').doc(userId).get();

      if (!userDoc.exists) {
        return NextResponse.json({
          hasAccess: false,
          reason: 'User not found. Voice Interaction requires the Voice Add-On subscription. Please purchase it to continue.'
        });
      }

      const userData = userDoc.data()!;
      
      // Check subscription document FIRST (more reliable - webhook updates this)
      let hasVoiceAddon = false;
      
      try {
        const subscriptionDoc = await db.collection('subscriptions').doc(userId).get();
        if (subscriptionDoc.exists) {
          const subscriptionData = subscriptionDoc.data()!;
          console.log(`[INFO] Subscription data for user ${userId}:`, {
            addons: subscriptionData.addons,
            plan: subscriptionData.plan,
            status: subscriptionData.status
          });
          
          // Check subscription addons object { voice: true, gameplay: false, ... }
          if (subscriptionData.addons?.voice === true) {
            hasVoiceAddon = true;
            console.log(`[INFO] Found voice add-on in subscription document (object format) for user ${userId}`);
          }
          // Also check addons array format
          if (Array.isArray(subscriptionData.addons) && subscriptionData.addons.includes('voice')) {
            hasVoiceAddon = true;
            console.log(`[INFO] Found voice add-on in subscription document (array format) for user ${userId}`);
          }
        }
      } catch (subError) {
        console.warn(`[WARN] Could not check subscription document for user ${userId}:`, subError);
        // Continue with user document check
      }
      
      // Also check user document (fallback)
      if (!hasVoiceAddon) {
        hasVoiceAddon = userData.addons?.includes('voice') || userData.hasVoiceAddon || false;
        if (hasVoiceAddon) {
          console.log(`[INFO] Found voice add-on in user document for user ${userId}`);
        }
      }
      
      const isPremium = userData.isPremium || userData.plan === 'pro';
      const isFreeTier = !isPremium;
      
      console.log(`[INFO] Subscription check for user ${userId}: hasVoiceAddon=${hasVoiceAddon}, isPremium=${isPremium}, plan=${userData.plan}`);

      // Free tier users don't have access (only add-on subscribers)
      if (isFreeTier && !hasVoiceAddon) {
        return NextResponse.json({
          hasAccess: false,
          reason: 'Voice Interaction requires the Voice Add-On subscription. Please purchase it to continue.',
          tier: 'free'
        });
      }

      // Pro users without voice add-on don't have access
      if (isPremium && !hasVoiceAddon) {
        return NextResponse.json({
          hasAccess: false,
          reason: 'Voice Interaction requires the Voice Add-On subscription. Please purchase it to continue.',
          tier: 'pro'
        });
      }

      // User has access (has voice add-on)
      return NextResponse.json({
        hasAccess: true,
        tier: hasVoiceAddon ? 'voice_addon' : 'free'
      });

    } catch (firestoreError: any) {
      // Check if it's a Firebase Admin credentials error
      const errorMessage = firestoreError.message || '';
      if (errorMessage.includes('Could not load the default credentials') || 
          errorMessage.includes('default credentials') ||
          errorMessage.includes('getApplicationDefaultAsync')) {
        console.warn('[WARNING] Firebase Admin not configured for subscription check - denying access in local dev');
        // In local dev, deny access to prevent unauthorized use
        // In production (pathgen.dev), Firebase Admin will be configured
        return NextResponse.json({
          hasAccess: false,
          reason: 'Voice Interaction requires the Voice Add-On subscription. Please purchase it to continue.',
          error: 'Firebase Admin not configured (local development)'
        }, { status: 200 }); // Return 200 to avoid connection errors
      }
      
      // Re-throw other Firestore errors
      throw firestoreError;
    }

  } catch (error: any) {
    console.error('[ERROR] Voice subscription check error:', error);
    
    // On any other error, deny access for safety
    return NextResponse.json({
      hasAccess: false,
      reason: 'Voice Interaction requires the Voice Add-On subscription. Please purchase it to continue.',
      error: error.message || 'Unknown error'
    }, { status: 200 }); // Always return 200 to prevent connection resets
  }
}

