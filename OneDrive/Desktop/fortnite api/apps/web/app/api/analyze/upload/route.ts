import { NextRequest, NextResponse } from 'next/server';
import { db, admin } from '@/lib/firebase-admin';
import { COLLECTIONS, ADDON_LIMITS } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds for file processing

const OSIRION_API_KEY = process.env.OSIRION_API_KEY || '35402b9d-c247-4408-96cc-cd158547baaa';
const OSIRION_API_BASE = 'https://api.osirion.gg/fortnite/v1';

// File size limits
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB
const ALLOWED_FILE_TYPES = ['.replay', '.Replay'];

/**
 * Check if user can upload more replays this period
 */
async function checkReplayUploadLimits(userId: string): Promise<{ allowed: boolean; reason?: string; limit?: number; used?: number }> {
  try {
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    const usageDoc = await db.collection(COLLECTIONS.USAGE).doc(userId).get();

    if (!userDoc.exists) {
      return { allowed: false, reason: 'User not found' };
    }

    const userData = userDoc.data()!;
    const hasGameplayAddon = userData.addons?.includes('Gameplay Analysis') || false;

    if (!hasGameplayAddon) {
      return { 
        allowed: false, 
        reason: 'Gameplay Analysis add-on required for replay uploads',
        limit: 0,
        used: 0,
      };
    }

    // Get usage data
    const usageData = usageDoc.exists ? usageDoc.data()! : {};
    const replaysThisPeriod = usageData.replaysUploadedThisPeriod || 0;
    const monthlyLimit = ADDON_LIMITS.gameplay.replaysPerMonth; // 15/month

    if (replaysThisPeriod >= monthlyLimit) {
      return { 
        allowed: false, 
        reason: `You have reached your monthly limit of ${monthlyLimit} replay uploads`,
        limit: monthlyLimit,
        used: replaysThisPeriod,
      };
    }

    return { 
      allowed: true,
      limit: monthlyLimit,
      used: replaysThisPeriod,
    };
  } catch (error) {
    console.error('[ERROR] Failed to check replay limits:', error);
    return { allowed: true }; // Allow on error to not block users
  }
}

/**
 * Log replay upload to usage
 */
async function logReplayUpload(userId: string): Promise<void> {
  try {
    const now = admin.firestore.Timestamp.now();
    const usageRef = db.collection(COLLECTIONS.USAGE).doc(userId);

    await usageRef.set({
      replaysUploadedThisPeriod: admin.firestore.FieldValue.increment(1),
      lastReplayUpload: now,
      lastUpdated: now,
    }, { merge: true });

    console.log(`[USAGE] Logged replay upload for user ${userId}`);
  } catch (error) {
    console.error('[ERROR] Failed to log replay upload:', error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` 
      }, { status: 400 });
    }

    // Validate file type (optional but recommended)
    const fileName = file.name.toLowerCase();
    const hasValidExtension = ALLOWED_FILE_TYPES.some(ext => fileName.endsWith(ext.toLowerCase()));
    
    if (!hasValidExtension) {
      return NextResponse.json({ 
        error: `Invalid file type. Only .replay files are allowed.` 
      }, { status: 400 });
    }

    // Check usage limits if userId provided
    if (userId) {
      const canUpload = await checkReplayUploadLimits(userId);
      if (!canUpload.allowed) {
        return NextResponse.json({
          error: 'Upload limit exceeded',
          message: canUpload.reason || 'You have reached your monthly replay upload limit',
          limit: canUpload.limit,
          used: canUpload.used,
        }, { status: 429 });
      }
    }

    console.log('[UPLOAD] Processing replay file:', {
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      userId: userId || 'anonymous',
    });

    // Step 1: Get upload URL from Osirion
    const utcOffset = -(new Date().getTimezoneOffset() / 60);
    const urlResponse = await fetch(`${OSIRION_API_BASE}/uploads/url?utcOffset=${utcOffset}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${OSIRION_API_KEY}`,
      },
    });

    if (!urlResponse.ok) {
      const error = await urlResponse.json().catch(() => ({ error: 'Failed to get upload URL' }));
      return NextResponse.json(
        { error: error.error || 'Failed to get upload URL' },
        { status: urlResponse.status }
      );
    }

    const { url, trackingId } = await urlResponse.json();

    // Step 2: Read file buffer
    const fileBuffer = await file.arrayBuffer();

    // Step 3: Upload file to Google Cloud Storage (server-side, no CORS issues)
    const uploadResponse = await fetch(url, {
      method: 'PUT',
      body: fileBuffer,
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    });

    if (!uploadResponse.ok) {
      return NextResponse.json(
        { 
          error: 'Upload to storage failed', 
          details: `${uploadResponse.status} ${uploadResponse.statusText}` 
        },
        { status: uploadResponse.status }
      );
    }

    // Log replay upload usage
    if (userId) {
      try {
        await logReplayUpload(userId);
      } catch (usageError) {
        console.error('[ERROR] Failed to log replay upload:', usageError);
        // Don't block the response
      }
    }

    return NextResponse.json({
      trackingId,
      status: 'pending',
      message: 'Replay uploaded successfully. Processing...',
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file', details: error.message || String(error) },
      { status: 500 }
    );
  }
}

