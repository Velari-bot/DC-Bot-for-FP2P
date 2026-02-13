// PathGen Email API — Send Email Endpoint

import { NextRequest, NextResponse } from "next/server";
import { admin } from "../../../../lib/firebase-admin";
import { sendEmail, SendEmailOptions } from "../../../../lib/email";

/**
 * POST /api/email/send
 * Send an email
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

    const body = await req.json();
    const { to, subject, html, text, template, variables, userId } = body;

    // Validate required fields
    if (!to || !subject) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject" },
        { status: 400 }
      );
    }

    if (!html && !template) {
      return NextResponse.json(
        { error: "Either html or template must be provided" },
        { status: 400 }
      );
    }

    // Prepare email options
    const emailOptions: SendEmailOptions = {
      to,
      subject,
      html,
      text,
      template,
      variables,
      userId: userId || decodedToken.uid,
    };

    // Send email
    const result = await sendEmail(emailOptions);

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        sentCount: result.sentCount,
        rejected: result.rejected,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to send email",
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[EMAIL] Send email API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}

