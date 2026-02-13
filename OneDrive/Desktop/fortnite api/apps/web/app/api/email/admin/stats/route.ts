// PathGen Email API — Admin Stats Endpoint

import { NextRequest, NextResponse } from "next/server";
import { admin } from "../../../../../lib/firebase-admin";
import { getEmailStats, getDeliverabilityStats } from "../../../../../lib/email";

/**
 * GET /api/email/admin/stats
 * Get email system statistics (admin only)
 */
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(decodedToken.uid)
      .get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    if (!userData?.isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Get days parameter (default: 7)
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "7", 10);

    // Get stats
    const [stats, deliverability] = await Promise.all([
      getEmailStats(),
      getDeliverabilityStats(days),
    ]);

    return NextResponse.json({
      success: true,
      stats,
      deliverability,
    });
  } catch (error: any) {
    console.error("[EMAIL] Stats API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}

