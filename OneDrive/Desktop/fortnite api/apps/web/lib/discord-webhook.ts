// Discord Webhook Utility
// Sends notifications to Discord webhook for major events

// Default webhook URL (can be overridden by environment variable)
const DEFAULT_WEBHOOK_URL = 'https://discord.com/api/webhooks/1447053863751258163/ylJTvWEPYxi1ynXT-1FVDiu6Q6FPcAJKSrHRFrvNjVL1KsbjTw-VLlzr5EDroknO5LvJ';
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || DEFAULT_WEBHOOK_URL;

export interface DiscordWebhookPayload {
  content?: string;
  embeds?: Array<{
    title?: string;
    description?: string;
    color?: number;
    fields?: Array<{
      name: string;
      value: string;
      inline?: boolean;
    }>;
    timestamp?: string;
    footer?: {
      text: string;
    };
    author?: {
      name: string;
      icon_url?: string;
    };
  }>;
  username?: string;
  avatar_url?: string;
}

/**
 * Send a notification to Discord webhook
 */
export async function sendDiscordWebhook(
  payload: DiscordWebhookPayload
): Promise<{ success: boolean; error?: string }> {
  const webhookUrl = DISCORD_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL || '';
  
  if (!webhookUrl) {
    console.warn('[DISCORD] Webhook URL not configured');
    return { success: false, error: 'Discord webhook URL not configured' };
  }

  console.log('[DISCORD] Sending webhook to:', webhookUrl.substring(0, 50) + '...');
  console.log('[DISCORD] Payload:', JSON.stringify(payload, null, 2).substring(0, 200) + '...');

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[DISCORD] Webhook failed:', response.status, errorText);
      return {
        success: false,
        error: `Discord webhook failed: ${response.status} ${errorText}`,
      };
    }

    console.log('[DISCORD] Webhook sent successfully');
    return { success: true };
  } catch (error: any) {
    console.error('[DISCORD] Webhook error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send Discord webhook',
    };
  }
}

/**
 * Send notification for user signup
 */
export async function notifyUserSignup(data: {
  userId: string;
  email: string;
  username?: string;
}): Promise<{ success: boolean; error?: string }> {
  return await sendDiscordWebhook({
    embeds: [
      {
        title: '🎉 New User Signup',
        description: 'A new user has signed up for PathGen',
        color: 0x8B5CF6, // Purple accent color matching website theme
        fields: [
          {
            name: 'User ID',
            value: data.userId,
            inline: true,
          },
          {
            name: 'Email',
            value: data.email,
            inline: true,
          },
          {
            name: 'Username',
            value: data.username || 'N/A',
            inline: true,
          },
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: 'PathGen Support System',
        },
      },
    ],
  });
}

/**
 * Send notification for purchase/subscription
 */
export async function notifyPurchase(data: {
  userId: string;
  email: string;
  customerId: string;
  subscriptionId?: string;
  amount?: number;
  currency?: string;
  plan?: string;
  addons?: string[];
}): Promise<{ success: boolean; error?: string }> {
  const amountText = data.amount
    ? `${(data.amount / 100).toFixed(2)} ${data.currency?.toUpperCase() || 'USD'}`
    : 'N/A';

  return await sendDiscordWebhook({
    embeds: [
      {
        title: '💰 New Purchase',
        description: 'A user has made a purchase or subscription',
        color: 0x8B5CF6, // Purple accent color matching website theme
        fields: [
          {
            name: 'User ID',
            value: data.userId,
            inline: true,
          },
          {
            name: 'Email',
            value: data.email,
            inline: true,
          },
          {
            name: 'Plan',
            value: data.plan || 'Pro',
            inline: true,
          },
          {
            name: 'Amount',
            value: amountText,
            inline: true,
          },
          {
            name: 'Customer ID',
            value: data.customerId,
            inline: true,
          },
          {
            name: 'Subscription ID',
            value: data.subscriptionId || 'N/A',
            inline: true,
          },
          ...(data.addons && data.addons.length > 0
            ? [
                {
                  name: 'Add-ons',
                  value: data.addons.join(', '),
                  inline: false,
                },
              ]
            : []),
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: 'PathGen Support System',
        },
      },
    ],
  });
}

/**
 * Send notification for support request
 */
export async function notifySupportRequest(data: {
  userId?: string;
  email: string;
  name?: string;
  subject: string;
  message: string;
  category?: string;
}): Promise<{ success: boolean; error?: string }> {
  // Format category for display
  const categoryMap: Record<string, string> = {
    general: '📋 General Question',
    technical: '🔧 Technical Issue',
    billing: '💳 Billing & Subscription',
    feature: '💡 Feature Request',
    bug: '🐛 Bug Report',
    other: '❓ Other',
  };
  const categoryDisplay = categoryMap[data.category || 'general'] || `📋 ${(data.category || 'general').charAt(0).toUpperCase() + (data.category || 'general').slice(1)}`;

  // Truncate message if too long (Discord has a 1024 char limit per field value)
  // Code blocks add extra characters, so we need to account for that
  const maxMessageLength = 900; // Leave room for code block wrapper
  let formattedMessage = data.message;
  if (formattedMessage.length > maxMessageLength) {
    formattedMessage = formattedMessage.substring(0, maxMessageLength) + '\n\n[Message truncated - see full message in email]';
  }
  
  // Escape backticks in the message to prevent breaking code blocks
  formattedMessage = formattedMessage.replace(/```/g, '`\u200b`\u200b`');

  // Format message with proper line breaks and ensure readability
  // Use code block for message to ensure dark background and readable text
  const messageCodeBlock = `\`\`\`\n${formattedMessage}\n\`\`\``;

  return await sendDiscordWebhook({
    embeds: [
      {
        title: '📧 New Support Request',
        description: `**Subject:** ${data.subject}`,
        color: 0x8B5CF6, // Purple accent color matching website theme (#8B5CF6 = rgba(139, 92, 246))
        fields: [
          {
            name: '👤 Contact Information',
            value: `**Name:** ${data.name || 'Not provided'}\n**Email:** ${data.email}`,
            inline: false,
          },
          {
            name: '📂 Category',
            value: categoryDisplay,
            inline: true,
          },
          ...(data.userId
            ? [
                {
                  name: '🆔 User ID',
                  value: `\`${data.userId}\``,
                  inline: true,
                },
              ]
            : [
                {
                  name: '🆔 User ID',
                  value: '`Not logged in`',
                  inline: true,
                },
              ]),
          {
            name: '💬 Message',
            value: messageCodeBlock,
            inline: false,
          },
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: 'PathGen Support System',
        },
        author: {
          name: data.name || 'Anonymous User',
          icon_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || data.email)}&background=8B5CF6&color=fff&size=128`,
        },
      },
    ],
  });
}
