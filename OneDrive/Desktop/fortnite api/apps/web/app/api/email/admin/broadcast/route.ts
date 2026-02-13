// PathGen Email API — Admin Broadcast Endpoint

import { NextRequest, NextResponse } from "next/server";
import { admin, db } from "../../../../../lib/firebase-admin";
import { broadcastEmail } from "../../../../../lib/email";

/**
 * POST /api/email/admin/broadcast
 * Broadcast email to all users (admin only)
 */
export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { template, subject, variables } = body;

    // Validate required fields
    if (!template || !subject) {
      return NextResponse.json(
        { error: "Missing required fields: template, subject" },
        { status: 400 }
      );
    }

    // Broadcast email
    const result = await broadcastEmail({
      template,
      subject,
      variables,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        totalUsers: result.totalUsers,
        sent: result.sent,
        failed: result.failed,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Broadcast failed",
          totalUsers: result.totalUsers,
          sent: result.sent,
          failed: result.failed,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[EMAIL] Broadcast API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}

