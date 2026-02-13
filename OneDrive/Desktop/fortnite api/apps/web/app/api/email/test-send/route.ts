import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

/**
 * Test email sending to a single address
 * Use this to debug email delivery issues
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body as { email?: string };

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    console.log(`[TEST EMAIL] Sending test email to: ${email}`);

    const result = await sendEmail({
      to: email,
      subject: '🧪 PathGen Test Email',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; background: #0A0A0A; color: #FFFFFF; padding: 40px;">
          <div style="max-width: 600px; margin: 0 auto; background: #151515; padding: 40px; border-radius: 16px;">
            <h1 style="color: #8B5CF6; margin-bottom: 20px;">🧪 Test Email</h1>
            <p style="color: #E5E5E5; line-height: 1.6;">
              This is a test email from PathGen to verify email delivery is working.
            </p>
            <p style="color: #A0A0A0; margin-top: 30px; font-size: 14px;">
              If you received this, email sending is working correctly!
            </p>
          </div>
        </body>
        </html>
      `,
      text: 'This is a test email from PathGen to verify email delivery is working.',
    });

    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? `Test email sent successfully to ${email}` 
        : `Failed to send test email: ${result.error}`,
      details: {
        messageId: result.messageId,
        sentCount: result.sentCount,
        rejected: result.rejected,
        accepted: (result as any).accepted,
        error: result.error,
      },
    });
  } catch (error: any) {
    console.error('[TEST EMAIL] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send test email',
      },
      { status: 500 }
    );
  }
}
