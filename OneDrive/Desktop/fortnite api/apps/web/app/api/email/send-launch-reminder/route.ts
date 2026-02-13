import { NextRequest, NextResponse } from 'next/server';
import { EMAIL_WHITELIST } from '@/lib/email-whitelist';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

/**
 * Send launch reminder email to all whitelisted emails
 * "4 days away, get ready" message
 */
export async function POST(req: NextRequest) {
  try {
    // Optional: Add authentication check here if needed
    // const authHeader = req.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const allEmails = EMAIL_WHITELIST as readonly string[];
    const totalEmails = allEmails.length;

    console.log(`[LAUNCH REMINDER] Sending to ${totalEmails} emails`);

    // Email HTML template
    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PathGen Launch - 4 Days Away!</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0A0A0A; color: #FFFFFF;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background: #0A0A0A; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: #151515; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1); overflow: hidden;">
                    <!-- Header with gradient -->
                    <tr>
                        <td style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(59, 130, 246, 0.3)); padding: 40px 40px 30px; text-align: center;">
                            <h1 style="margin: 0; font-size: 2.5rem; font-weight: 800; color: #FFFFFF; letter-spacing: -0.02em;">
                                🚀 4 Days Away!
                            </h1>
                            <p style="margin: 12px 0 0; font-size: 1.1rem; color: #A0A0A0; font-weight: 500;">
                                PathGen v2 Launch Countdown
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 24px; font-size: 1.1rem; line-height: 1.7; color: #E5E5E5;">
                                <strong style="color: #FFFFFF;">Get ready!</strong> PathGen v2 is launching in just <strong style="color: #8B5CF6;">4 days</strong>, and we're hyped to have you on board.
                            </p>
                            
                            <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; padding: 24px; margin: 32px 0;">
                                <h2 style="margin: 0 0 16px; font-size: 1.5rem; font-weight: 700; color: #FFFFFF;">
                                    What's Coming:
                                </h2>
                                <ul style="margin: 0; padding-left: 24px; color: #D1D5DB; line-height: 1.8; font-size: 1rem;">
                                    <li style="margin-bottom: 12px;"><strong style="color: #FFFFFF;">AI-Powered Coaching</strong> - Real-time feedback on your gameplay</li>
                                    <li style="margin-bottom: 12px;"><strong style="color: #FFFFFF;">Replay Analysis</strong> - Upload clips and get instant breakdowns</li>
                                    <li style="margin-bottom: 12px;"><strong style="color: #FFFFFF;">Voice Interaction</strong> - Talk to your AI coach during matches</li>
                                    <li style="margin-bottom: 12px;"><strong style="color: #FFFFFF;">Competitive Insights</strong> - FNCS reports, meta analysis, and more</li>
                                </ul>
                            </div>
                            
                            <p style="margin: 24px 0; font-size: 1rem; line-height: 1.7; color: #A0A0A0;">
                                This is your chance to <strong style="color: #FFFFFF;">level up your Fortnite game</strong> faster than ever. Whether you're grinding ranked, practicing for tournaments, or just trying to outplay your friends — PathGen has your back.
                            </p>
                            
                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="https://pathgen.dev" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #8B5CF6, #3B82F6); color: #FFFFFF; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 1rem; box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);">
                                            Get Ready → 
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 32px 0 0; font-size: 0.9rem; line-height: 1.6; color: #666; text-align: center;">
                                See you in 4 days! 🔥<br>
                                <strong style="color: #8B5CF6;">- The PathGen Team</strong>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 40px; background: rgba(255, 255, 255, 0.02); border-top: 1px solid rgba(255, 255, 255, 0.1); text-align: center;">
                            <p style="margin: 0 0 12px; font-size: 0.85rem; color: #666;">
                                <a href="https://pathgen.dev" style="color: #8B5CF6; text-decoration: none;">pathgen.dev</a> | 
                                <a href="https://pathgen.dev/support" style="color: #8B5CF6; text-decoration: none;">Support</a> | 
                                <a href="https://pathgen.dev/faq" style="color: #8B5CF6; text-decoration: none;">FAQ</a>
                            </p>
                            <p style="margin: 0; font-size: 0.75rem; color: #555;">
                                You're receiving this because you're on our launch list. 
                                <a href="https://pathgen.dev/unsubscribe?email={{email}}" style="color: #666; text-decoration: underline;">Unsubscribe</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;

    const emailText = `🚀 4 Days Away! PathGen v2 Launch Countdown

Get ready! PathGen v2 is launching in just 4 days, and we're hyped to have you on board.

What's Coming:
• AI-Powered Coaching - Real-time feedback on your gameplay
• Replay Analysis - Upload clips and get instant breakdowns
• Voice Interaction - Talk to your AI coach during matches
• Competitive Insights - FNCS reports, meta analysis, and more

This is your chance to level up your Fortnite game faster than ever. Whether you're grinding ranked, practicing for tournaments, or just trying to outplay your friends — PathGen has your back.

Visit https://pathgen.dev to get ready!

See you in 4 days! 🔥
- The PathGen Team

---
Unsubscribe: https://pathgen.dev/unsubscribe?email={{email}}
`;

    // Send emails individually to ensure proper personalization and tracking
    // AWS SES rate limits: Sandbox = 1/sec, Production = 14/sec
    // We'll send sequentially with 1 second delay to work in both modes
    let totalSent = 0;
    let totalFailed = 0;
    const failedEmails: string[] = [];
    const results: any[] = [];

    // Send emails sequentially (one at a time) to respect AWS SES rate limits
    // Delay: 1000ms (1 second) - works for sandbox (1/sec) and production (14/sec)
    const DELAY_BETWEEN_EMAILS = 1000; // 1 second
    
    for (let i = 0; i < allEmails.length; i++) {
      const email = allEmails[i];
      
      try {
        // Personalize unsubscribe URL for each email
        const personalizedHtml = emailHtml.replace(/\{\{email\}\}/g, email);
        const personalizedText = emailText.replace(/\{\{email\}\}/g, email);

        const result = await sendEmail({
          to: email,
          subject: 'PathGen v2 Launch Update - 4 Days Away',
          html: personalizedHtml,
          text: personalizedText,
        });

        console.log(`[LAUNCH REMINDER] [${i + 1}/${totalEmails}] Email to ${email}:`, {
          success: result.success,
          sentCount: result.sentCount,
          messageId: result.messageId,
          rejected: result.rejected,
          accepted: (result as any).accepted,
        });

        if (result.success && result.sentCount > 0) {
          totalSent++;
          results.push({ success: true, email, messageId: result.messageId });
        } else {
          totalFailed++;
          failedEmails.push(email);
          const errorMsg = result.error || `Sent count: ${result.sentCount}, Rejected: ${result.rejected?.join(', ') || 'none'}`;
          console.error(`[LAUNCH REMINDER] Failed to send to ${email}:`, errorMsg);
          results.push({ success: false, email, error: errorMsg });
        }
      } catch (error: any) {
        totalFailed++;
        failedEmails.push(email);
        console.error(`[LAUNCH REMINDER] Failed to send to ${email}:`, error);
        results.push({ success: false, email, error: error.message });
      }

      // Wait before sending next email to respect rate limits
      // Only delay if not the last email
      if (i < allEmails.length - 1) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_EMAILS));
      }
    }

    return NextResponse.json({
      success: totalFailed === 0,
      message: `Launch reminder emails sent`,
      stats: {
        totalEmails: totalEmails,
        sent: totalSent,
        failed: totalFailed,
        successRate: totalEmails > 0 ? ((totalSent / totalEmails) * 100).toFixed(2) + '%' : '0%',
      },
      failedEmails: failedEmails.length > 0 ? failedEmails : undefined,
      results: results,
    });
  } catch (error: any) {
    console.error('[LAUNCH REMINDER] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send launch reminder emails',
      },
      { status: 500 }
    );
  }
}
