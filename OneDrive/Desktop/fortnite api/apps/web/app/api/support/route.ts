import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { notifySupportRequest } from '@/lib/discord-webhook';

export const dynamic = 'force-dynamic';

/**
 * Handle support request submissions
 * Sends email to support@pathgen.dev and Discord webhook notification
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, category, subject, message, userId } = body as {
      name: string;
      email: string;
      category: string;
      subject: string;
      message: string;
      userId?: string;
    };

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    console.log('[SUPPORT] New support request:', {
      email,
      name,
      category,
      subject,
      userId,
    });

    // Prepare email content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background: #0A0A0A;
              color: #FFFFFF;
            }
            .header {
              background: linear-gradient(135deg, #00FFAA 0%, #00CC88 100%);
              padding: 30px;
              border-radius: 12px 12px 0 0;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              color: #0A0A0A;
              font-size: 24px;
              font-weight: 700;
            }
            .content {
              background: rgba(255, 255, 255, 0.05);
              padding: 30px;
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-top: none;
              border-radius: 0 0 12px 12px;
            }
            .field {
              margin-bottom: 20px;
            }
            .field-label {
              font-weight: 600;
              color: #00FFAA;
              margin-bottom: 8px;
              display: block;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .field-value {
              color: #FFFFFF;
              font-size: 16px;
              padding: 12px;
              background: rgba(255, 255, 255, 0.03);
              border-radius: 8px;
              border: 1px solid rgba(255, 255, 255, 0.1);
            }
            .message-box {
              white-space: pre-wrap;
              word-wrap: break-word;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid rgba(255, 255, 255, 0.1);
              text-align: center;
              color: #A0A0A0;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📧 New Support Request</h1>
          </div>
          <div class="content">
            <div class="field">
              <span class="field-label">From</span>
              <div class="field-value">${name} &lt;${email}&gt;</div>
            </div>
            ${userId ? `
            <div class="field">
              <span class="field-label">User ID</span>
              <div class="field-value">${userId}</div>
            </div>
            ` : ''}
            <div class="field">
              <span class="field-label">Category</span>
              <div class="field-value">${category || 'General'}</div>
            </div>
            <div class="field">
              <span class="field-label">Subject</span>
              <div class="field-value">${subject}</div>
            </div>
            <div class="field">
              <span class="field-label">Message</span>
              <div class="field-value message-box">${message.replace(/\n/g, '<br>')}</div>
            </div>
            <div class="footer">
              <p>This support request was submitted through the PathGen support page.</p>
              <p>Reply directly to this email to respond to the user.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailText = `
New Support Request

From: ${name} <${email}>
${userId ? `User ID: ${userId}\n` : ''}Category: ${category || 'General'}
Subject: ${subject}

Message:
${message}

---
This support request was submitted through the PathGen support page.
Reply directly to this email to respond to the user.
    `.trim();

    // Send email to support@pathgen.dev and BCC to personal email
    let emailResult: { success: boolean; error?: string; sentCount?: number } = {
      success: false,
      sentCount: 0,
    };
    
    try {
      const emailResponse = await sendEmail({
        to: 'support@pathgen.dev',
        bcc: 'benderaiden826@gmail.com', // BCC to personal email
        subject: `[Support Request] ${subject}`,
        html: emailHtml,
        text: emailText,
        userId: userId,
      });
      
      emailResult = {
        success: emailResponse.success || false,
        error: emailResponse.error,
        sentCount: emailResponse.sentCount || 0,
      };
      
      console.log('[SUPPORT] Email sent successfully:', {
        success: emailResult.success,
        sentCount: emailResult.sentCount,
      });
    } catch (emailError: any) {
      console.error('[SUPPORT] Email sending error:', emailError);
      emailResult = {
        success: false,
        error: emailError.message || 'Failed to send email',
        sentCount: 0,
      };
    }

    if (!emailResult.success) {
      console.error('[SUPPORT] Failed to send email:', emailResult.error || 'Unknown error');
      // Continue anyway - we'll still send Discord notification
    }

    // Send Discord webhook notification
    let discordResult: { success: boolean; error?: string } = {
      success: false,
    };
    
    try {
      const discordResponse = await notifySupportRequest({
        userId: userId,
        email: email,
        name: name,
        subject: subject,
        message: message,
        category: category || 'general',
      });
      
      discordResult = {
        success: discordResponse.success || false,
        error: discordResponse.error,
      };
      
      console.log('[SUPPORT] Discord notification sent:', {
        success: discordResult.success,
      });
    } catch (discordError: any) {
      console.error('[SUPPORT] Discord webhook error:', discordError);
      discordResult = {
        success: false,
        error: discordError.message || 'Failed to send Discord webhook',
      };
    }

    if (!discordResult.success) {
      console.error('[SUPPORT] Failed to send Discord webhook:', discordResult.error || 'Unknown error');
      // Continue anyway - email was sent
    }

    console.log('[SUPPORT] Support request processed:', {
      emailSent: emailResult.success,
      emailSentCount: emailResult.sentCount,
      discordSent: discordResult.success,
    });

    // Return success even if email/Discord failed - the request was received
    return NextResponse.json({
      success: true,
      message: 'Support request submitted successfully',
    });
  } catch (error: any) {
    console.error('[SUPPORT] Error processing support request:', error);
    return NextResponse.json(
      {
        error: 'Failed to process support request',
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
