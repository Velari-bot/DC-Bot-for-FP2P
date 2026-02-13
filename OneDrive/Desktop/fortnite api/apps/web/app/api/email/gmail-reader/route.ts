// PathGen Gmail API Reader
// Fetches emails from Gmail and processes them through the memory ingestion worker

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { ALLOWED_EMAIL_SENDERS } from '@/lib/constants';

/**
 * Gmail API Reader Endpoint
 * 
 * This endpoint:
 * 1. Authenticates with Gmail API using OAuth2
 * 2. Fetches unread emails (or emails matching a query)
 * 3. Processes each email through the memory ingestion worker
 * 4. Returns processed memories
 * 
 * Setup required:
 * - Gmail API credentials (OAuth2 client ID/secret)
 * - OAuth2 access token (or refresh token for automatic refresh)
 */

interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    body?: {
      data?: string;
    };
    parts?: Array<{
      mimeType: string;
      body?: { data?: string };
      parts?: Array<{ mimeType: string; body?: { data?: string } }>;
    }>;
  };
}

function getHeader(headers: Array<{ name: string; value: string }>, name: string): string {
  return headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';
}

function decodeBase64(data: string): string {
  try {
    return Buffer.from(data, 'base64').toString('utf-8');
  } catch {
    return '';
  }
}

function extractEmailContent(message: GmailMessage): {
  sender: string;
  subject: string;
  text: string;
  html: string;
} {
  const headers = message.payload.headers;
  const sender = getHeader(headers, 'From');
  const subject = getHeader(headers, 'Subject');
  
  let text = '';
  let html = '';

  // Extract from body (simple messages without parts)
  if (message.payload.body?.data) {
    const content = decodeBase64(message.payload.body.data);
    // Check Content-Type header to determine if HTML or plain text
    const contentType = getHeader(headers, 'Content-Type');
    if (contentType?.includes('text/html')) {
      html = content;
    } else {
      text = content;
    }
  }

  // Extract from parts (multipart messages)
  if (message.payload.parts) {
    for (const part of message.payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        text = decodeBase64(part.body.data);
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        html = decodeBase64(part.body.data);
      }
      
      // Check nested parts
      if (part.parts) {
        for (const nestedPart of part.parts) {
          if (nestedPart.mimeType === 'text/plain' && nestedPart.body?.data) {
            text = decodeBase64(nestedPart.body.data);
          } else if (nestedPart.mimeType === 'text/html' && nestedPart.body?.data) {
            html = decodeBase64(nestedPart.body.data);
          }
        }
      }
    }
  }

  // Extract email address from "Name <email@domain.com>" format
  const senderMatch = sender.match(/<(.+?)>/) || sender.match(/([\w\.-]+@[\w\.-]+\.\w+)/);
  const senderEmail = senderMatch ? senderMatch[1] || senderMatch[0] : sender;

  return {
    sender: senderEmail.trim(),
    subject: subject,
    text: text,
    html: html,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      access_token,
      refresh_token,
      query = 'is:unread', // Default: fetch unread emails
      max_results = 10,
      process_memory = true, // Whether to process through memory worker
    } = body as {
      access_token?: string;
      refresh_token?: string;
      query?: string;
      max_results?: number;
      process_memory?: boolean;
    };

    // Validate OAuth token
    if (!access_token && !refresh_token) {
      return NextResponse.json(
        { error: 'access_token or refresh_token is required' },
        { status: 400 }
      );
    }

    // Initialize Gmail API client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/api/email/gmail-callback'
    );

    // Set credentials
    if (access_token) {
      oauth2Client.setCredentials({ access_token });
    } else if (refresh_token) {
      oauth2Client.setCredentials({ refresh_token });
      // Refresh the token
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);
    }

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Fetch messages
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: max_results,
    });

    const messages = listResponse.data.messages || [];
    const results = [];

    // Process each message
    for (const messageRef of messages) {
      try {
        // Get full message details
        const messageResponse = await gmail.users.messages.get({
          userId: 'me',
          id: messageRef.id!,
          format: 'full',
        });

        const message = messageResponse.data as GmailMessage;
        const emailContent = extractEmailContent(message);

        // Check if sender is allowed
        const normalizedSender = emailContent.sender.toLowerCase().trim();
        const matchedAllowedSender = ALLOWED_EMAIL_SENDERS.find(
          (sender) => sender.toLowerCase().trim() === normalizedSender
        );

        if (!matchedAllowedSender) {
          results.push({
            messageId: message.id,
            sender: emailContent.sender,
            subject: emailContent.subject,
            snippet: message.snippet,
            text: emailContent.text, // Full text for reference
            html: emailContent.html, // Full HTML for reference
            status: 'ignored',
            reason: 'Sender not in allowed list',
            memory: 'IGNORE_EMAIL',
          });
          continue;
        }

        // Process through memory worker if requested
        let memory = null;
        if (process_memory) {
          try {
            // Use internal API call (server-side)
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                           process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                           'http://localhost:3000';
            
            const memoryResponse = await fetch(
              `${baseUrl}/api/email/memory`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  allowed_sender: matchedAllowedSender,
                  email: {
                    account: 'jlbender2005',
                    sender: emailContent.sender,
                    subject: emailContent.subject,
                    text: emailContent.text,
                    html: emailContent.html,
                    body: emailContent.text || emailContent.html,
                  },
                }),
              }
            );

            if (!memoryResponse.ok) {
              const errorText = await memoryResponse.text();
              console.error(`[GMAIL] Memory worker returned ${memoryResponse.status}:`, errorText);
              memory = 'ERROR_PROCESSING';
            } else {
              const memoryData = await memoryResponse.json();
              memory = memoryData.memory || 'IGNORE_EMAIL';
              
              // Log successful memory extraction
              if (memory && memory !== 'IGNORE_EMAIL' && memory !== 'ERROR_PROCESSING') {
                console.log(`[GMAIL] Memory extracted for ${emailContent.sender}:`, memory);
              }
            }
          } catch (memoryError: any) {
            console.error('[ERROR] Memory processing failed:', memoryError);
            memory = 'ERROR_PROCESSING';
          }
        }

        results.push({
          messageId: message.id,
          sender: emailContent.sender,
          subject: emailContent.subject,
          snippet: message.snippet,
          text: emailContent.text,
          html: emailContent.html,
          status: memory === 'IGNORE_EMAIL' ? 'ignored' : 'processed',
          memory: memory,
        });
      } catch (messageError: any) {
        console.error(`[ERROR] Failed to process message ${messageRef.id}:`, messageError);
        results.push({
          messageId: messageRef.id,
          status: 'error',
          error: messageError.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      totalMessages: messages.length,
      processed: results.length,
      results: results,
    });
  } catch (error: any) {
    console.error('[ERROR] Gmail reader failed:', error);

    // Handle Gmail API errors
    if (error.code === 401) {
      return NextResponse.json(
        { error: 'Gmail authentication failed. Please refresh your access token.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to read Gmail messages',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint for OAuth callback
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json(
      { error: 'Authorization code is required' },
      { status: 400 }
    );
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/api/email/gmail-callback'
    );

    const { tokens } = await oauth2Client.getToken(code);

    return NextResponse.json({
      success: true,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expiry_date,
    });
  } catch (error: any) {
    console.error('[ERROR] OAuth callback failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to exchange authorization code',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

