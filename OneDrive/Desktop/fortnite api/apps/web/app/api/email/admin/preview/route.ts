// PathGen Email API — Admin Template Preview Endpoint

import { NextRequest, NextResponse } from "next/server";
import { admin, db } from "../../../../../lib/firebase-admin";

/**
 * GET /api/email/admin/preview
 * Preview email template (admin only)
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

    const { searchParams } = new URL(req.url);
    const templateName = searchParams.get("template");
    const variablesParam = searchParams.get("variables");

    if (!templateName) {
      return NextResponse.json(
        { error: "Missing template parameter" },
        { status: 400 }
      );
    }

    let variables: Record<string, any> = {};
    if (variablesParam) {
      try {
        variables = JSON.parse(variablesParam);
      } catch (error) {
        return NextResponse.json(
          { error: "Invalid variables JSON" },
          { status: 400 }
        );
      }
    }

    // Load template from Firestore
    const templateDoc = await db
      .collection("emailTemplates")
      .doc(templateName)
      .get();

    if (!templateDoc.exists) {
      return NextResponse.json(
        { success: false, error: `Template ${templateName} not found` },
        { status: 404 }
      );
    }

    let html = templateDoc.data()?.html || "";

    // Inject variables
    if (variables) {
      for (const [key, value] of Object.entries(variables)) {
        html = html.replace(
          new RegExp(`{{\\s*${key}\\s*}}`, "g"),
          value !== undefined && value !== null ? String(value) : ""
        );
      }
    }

    // Generate text version
    const htmlToText = require("html-to-text");
    const text = htmlToText.convert(html, {
      wordwrap: 80,
      preserveNewlines: true,
    });

    return NextResponse.json({
      success: true,
      html,
      text,
    });
  } catch (error: any) {
    console.error("[EMAIL] Preview API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/email/admin/preview
 * Save or update email template (admin only)
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
    const { template, html } = body;

    if (!template || !html) {
      return NextResponse.json(
        { error: "Missing required fields: template, html" },
        { status: 400 }
      );
    }

    // Save template to Firestore
    await db.collection("emailTemplates").doc(template).set({
      html,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[EMAIL] Save template API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}


