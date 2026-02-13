// PathGen Email API — Send Launch Announcement
// This endpoint sends the launch announcement email to all subscribers

import { NextRequest, NextResponse } from "next/server";
import { admin, db } from "@/lib/firebase-admin";
import { sendEmail, SendEmailOptions } from "@/lib/email";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * POST /api/email/send-launch-announcement
 * Send launch announcement email to all users or specified recipients
 */
export async function POST(req: NextRequest) {
  try {
    // Verify authentication (admin only)
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized - Bearer token required" },
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

    // Check if user is admin (you can customize this check)
    const userDoc = await db.collection("users").doc(decodedToken.uid).get();
    const userData = userDoc.data();
    if (!userData?.isAdmin && !userData?.admin) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { 
      to, // Optional: specific email addresses, or null to send to all users
      testMode = false // If true, only sends to test email
    } = body;

    // Load HTML email template
    let html: string;
    try {
      const templatePath = join(process.cwd(), "public", "launch-email.html");
      const templateContent = readFileSync(templatePath, "utf-8");
      
      // Extract body content from HTML file (remove DOCTYPE, html, head tags)
      const bodyMatch = templateContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        html = bodyMatch[1];
      } else {
        // Fallback: use entire template
        html = templateContent;
      }
    } catch (error) {
      console.error("[EMAIL] Failed to load template:", error);
      return NextResponse.json(
        { error: "Failed to load email template" },
        { status: 500 }
      );
    }

    // Determine recipients
    let recipients: string[] = [];

    if (testMode) {
      // Test mode: send to a test email
      recipients = [process.env.TEST_EMAIL || "test@pathgen.dev"];
    } else if (to && Array.isArray(to)) {
      // Specific recipients provided
      recipients = to;
    } else if (to && typeof to === "string") {
      // Single recipient
      recipients = [to];
    } else {
      // Send to all users with email addresses
      try {
        const usersSnapshot = await db.collection("users")
          .where("email", "!=", null)
          .get();
        
        recipients = usersSnapshot.docs
          .map(doc => doc.data().email)
          .filter((email: string) => email && email.includes("@"));
        
        console.log(`[EMAIL] Found ${recipients.length} users with email addresses`);
      } catch (error) {
        console.error("[EMAIL] Failed to fetch users:", error);
        return NextResponse.json(
          { error: "Failed to fetch user list" },
          { status: 500 }
        );
      }
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "No recipients found" },
        { status: 400 }
      );
    }

    // Send emails in batches (to avoid rate limits)
    const batchSize = 10;
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      for (const email of batch) {
        try {
          const emailOptions: SendEmailOptions = {
            to: email,
            subject: "🚀 PathGen Launch Tomorrow! Get 1 Month FREE",
            html: html,
            userId: decodedToken.uid,
            skipRateLimit: true, // Skip rate limit for broadcast
          };

          const result = await sendEmail(emailOptions);
          
          if (result.success) {
            results.sent++;
            console.log(`[EMAIL] Sent launch announcement to ${email}`);
          } else {
            results.failed++;
            results.errors.push(`${email}: ${result.error || "Unknown error"}`);
          }

          // Small delay between emails to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error: any) {
          results.failed++;
          results.errors.push(`${email}: ${error.message || "Failed to send"}`);
          console.error(`[EMAIL] Failed to send to ${email}:`, error);
        }
      }

      // Delay between batches
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return NextResponse.json({
      success: true,
      message: `Launch announcement sent to ${results.sent} recipients`,
      stats: {
        total: recipients.length,
        sent: results.sent,
        failed: results.failed,
      },
      errors: results.errors.length > 0 ? results.errors : undefined,
    });
  } catch (error: any) {
    console.error("[EMAIL] Launch announcement error:", error);
    return NextResponse.json(
      {
        error: "Failed to send launch announcement",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

