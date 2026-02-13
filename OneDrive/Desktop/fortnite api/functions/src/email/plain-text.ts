// PathGen Email System — Plain Text Email Generator
// Generates personal, conversational emails that land in Primary inbox

/**
 * Generate a plain text email that looks personal and conversational
 * This format has the best inbox placement (Primary tab, not Promotions)
 */
export function generatePlainTextEmail(options: {
  greeting?: string;
  body: string;
  question?: string; // Adding a question encourages replies (Gmail loves this)
  signature?: string;
  unsubscribeUrl?: string;
}): string {
  const {
    greeting = "Hey there,",
    body,
    question,
    signature = "- The PathGen Team",
    unsubscribeUrl,
  } = options;

  let email = greeting + "\n\n";
  email += body + "\n\n";

  if (question) {
    email += question + "\n\n";
  }

  email += signature + "\n\n";
  email += "---\n";
  email += "PathGen - Your Fortnite AI Coach\n";
  email += "https://pathgen.dev\n";
  email += "Discord: https://discord.gg/G8ph5P9HAw\n";

  if (unsubscribeUrl) {
    email += `\nUnsubscribe: ${unsubscribeUrl}`;
  }

  return email;
}

/**
 * Generate a simple HTML email that looks like plain text
 * Minimal styling, no buttons, no promotional elements
 */
export function generatePlainTextHTML(options: {
  greeting?: string;
  body: string;
  question?: string;
  signature?: string;
  unsubscribeUrl?: string;
}): string {
  const {
    greeting = "Hey there,",
    body,
    question,
    signature = "- The PathGen Team",
    unsubscribeUrl,
  } = options;

  // Convert line breaks to <br> tags
  const formatText = (text: string) => {
    return text
      .split("\n\n")
      .map((para) => `<p style="margin: 0 0 16px; line-height: 1.6; color: #333333; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">${para.replace(/\n/g, "<br>")}</p>`)
      .join("");
  };

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PathGen Update</title>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin: 0 auto;">
                    <tr>
                        <td style="padding: 0;">
                            ${formatText(greeting)}
                            ${formatText(body)}
                            ${question ? formatText(question) : ""}
                            ${formatText(signature)}
                            <p style="margin: 32px 0 0; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666666; line-height: 1.5;">
                                PathGen - Your Fortnite AI Coach<br>
                                <a href="https://pathgen.dev" style="color: #666666; text-decoration: underline;">pathgen.dev</a> | 
                                <a href="https://discord.gg/G8ph5P9HAw" style="color: #666666; text-decoration: underline;">Discord</a>
                                ${unsubscribeUrl ? `<br><br><a href="${unsubscribeUrl}" style="color: #666666; text-decoration: underline;">Unsubscribe</a>` : ""}
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `.trim();

  return html;
}

/**
 * Convert promotional email content to personal/conversational style
 */
export function convertToPersonalStyle(promotionalText: string): {
  greeting: string;
  body: string;
  question: string;
} {
  // Remove promotional language
  let text = promotionalText
    .replace(/🔥|🚀|💥|⚡/g, "") // Remove emojis
    .replace(/SIGN UP NOW|BUY TODAY|LIMITED TIME|CLICK HERE/gi, "")
    .replace(/!{2,}/g, "!") // Reduce multiple exclamation marks
    .trim();

  // Extract key information
  const greeting = "Hey there,";
  
  // Make it conversational
  let body = text
    .replace(/^Get ready!/i, "I wanted to give you a quick update")
    .replace(/^PathGen v2 is/i, "PathGen v2 is")
    .replace(/launching in just/i, "launching in")
    .replace(/we're hyped/i, "we're excited");

  // Add a question to encourage replies
  const question = "Have you been practicing your edits lately? I'd love to hear how your game is going.";

  return { greeting, body, question };
}

