// PathGen Email System — Template Loader and Variable Injection

import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";
import { convert } from "html-to-text";
import { COLLECTIONS } from "../utils/constants";

const db = admin.firestore();

/**
 * Template variables interface
 */
export interface TemplateVariables {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Load template from file system or Firestore
 * Priority: Firestore (for dynamic updates) > File system (for static templates)
 */
export async function loadTemplate(
  templateName: string
): Promise<string> {
  // Try Firestore first (allows admin to update templates without redeploy)
  try {
    const templateDoc = await db
      .collection(COLLECTIONS.EMAIL_TEMPLATES)
      .doc(templateName)
      .get();

    if (templateDoc.exists) {
      const data = templateDoc.data();
      if (data?.html) {
        return data.html;
      }
    }
  } catch (error) {
    console.warn(
      `[EMAIL] Template ${templateName} not found in Firestore, trying file system`
    );
  }

  // Fallback to file system
  const templatePath = path.join(
    __dirname,
    "../../emails/templates",
    `${templateName}.html`
  );

  if (!fs.existsSync(templatePath)) {
    throw new Error(
      `Email template "${templateName}" not found in Firestore or file system`
    );
  }

  return fs.readFileSync(templatePath, "utf-8");
}

/**
 * Inject variables into template
 * Replaces {{variable}} with actual values
 */
export function injectVariables(
  template: string,
  variables: TemplateVariables
): string {
  let result = template;

  // Replace all {{variable}} patterns
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    const replacement = value !== undefined && value !== null ? String(value) : "";
    result = result.replace(regex, replacement);
  }

  // Warn about missing variables (but don't fail)
  const missingVars = result.match(/{{[^}]+}}/g);
  if (missingVars) {
    console.warn(
      `[EMAIL] Template has unreplaced variables: ${missingVars.join(", ")}`
    );
  }

  return result;
}

/**
 * Generate plain text version from HTML
 */
export function htmlToText(html: string): string {
  return convert(html, {
    wordwrap: 80,
    preserveNewlines: true,
    selectors: [
      { selector: "a", options: { ignoreHref: false } },
      { selector: "img", format: "skip" },
    ],
  });
}

/**
 * Add tracking pixel to HTML email (for open tracking)
 * Only add if messageId is provided
 */
export function addTrackingPixel(
  html: string,
  messageId: string,
  email: string
): string {
  const trackingUrl = `https://pathgen.dev/api/email/track/open?messageId=${encodeURIComponent(messageId)}&email=${encodeURIComponent(email)}`;
  const pixel = `<img src="${trackingUrl}" width="1" height="1" style="display:none; width:1px; height:1px; border:0;" alt="" />`;

  // Insert before </body> or at the end
  if (html.includes("</body>")) {
    return html.replace("</body>", `${pixel}</body>`);
  }

  return html + pixel;
}

/**
 * Add click tracking to links in HTML
 * Wraps links with tracking URL
 */
export function addClickTracking(
  html: string,
  messageId: string,
  email: string
): string {
  // Match all <a href="..."> tags
  const linkRegex = /<a\s+([^>]*href=["']([^"']+)["'][^>]*)>/gi;
  
  return html.replace(linkRegex, (match, attributes, url) => {
    // Skip if already a tracking URL or unsubscribe
    if (url.includes('/api/email/track/') || url.includes('unsubscribe')) {
      return match;
    }

    // Create tracking URL
    const trackingUrl = `https://pathgen.dev/api/email/track/click?messageId=${encodeURIComponent(messageId)}&email=${encodeURIComponent(email)}&url=${encodeURIComponent(url)}`;
    
    // Replace href with tracking URL
    return match.replace(url, trackingUrl);
  });
}

/**
 * Add unsubscribe footer to HTML email
 * Required for Gmail compliance
 */
export function addUnsubscribeFooter(
  html: string,
  unsubscribeUrl: string
): string {
  // Check if unsubscribe footer already exists
  if (html.includes("{{unsubscribe_url}}") || html.includes("unsubscribe")) {
    // Replace placeholder if exists
    return html.replace(/{{unsubscribe_url}}/g, unsubscribeUrl);
  }

  // Add unsubscribe footer before closing body tag
  const footer = `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #333; text-align: center; font-size: 12px; color: #666;">
      <p style="margin: 8px 0;">
        <a href="${unsubscribeUrl}" style="color: #A78BFA; text-decoration: underline;">Unsubscribe</a> from these emails.
      </p>
      <p style="margin: 8px 0; color: #666;">
        You're receiving this email because you're a PathGen user.
      </p>
    </div>
  `;

  // Insert before </body> or at the end if no body tag
  if (html.includes("</body>")) {
    return html.replace("</body>", `${footer}</body>`);
  }

  return html + footer;
}

/**
 * Add contact info to email footer
 */
export function addContactFooter(html: string): string {
  const contactInfo = `
    <div style="margin-top: 20px; text-align: center; font-size: 12px; color: #A0A0A0;">
      <p style="margin: 4px 0;">
        <a href="https://pathgen.dev" style="color: #A78BFA; text-decoration: none;">pathgen.dev</a> | 
        <a href="https://discord.gg/G8ph5P9HAw" style="color: #A78BFA; text-decoration: none;">Discord</a>
      </p>
    </div>
  `;

  // Insert before </body> or at the end
  if (html.includes("</body>")) {
    return html.replace("</body>", `${contactInfo}</body>`);
  }

  return html + contactInfo;
}

