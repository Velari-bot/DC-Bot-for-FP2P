// PathGen Email Memory Ingestion Worker
// Processes incoming emails and extracts information for AI long-term memory

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ALLOWED_EMAIL_SENDERS } from '@/lib/constants';

// System prompt for the email memory worker
const MEMORY_WORKER_PROMPT = `You are the Pathgen Email Memory Ingestion Worker.

Your only job is to process emails pulled from the Gmail account: "jlbender2005".

The backend will send you a JSON payload with:
- email.sender
- email.subject
- email.body
- allowed_sender (a single email address that is allowed)

Follow these rules EXACTLY:

1. Only process emails where:
   email.account == "jlbender2005"
   AND email.sender == allowed_sender

2. If either condition fails:
   Respond EXACTLY with: "IGNORE_EMAIL"
   Do NOT output anything else.

3. If the email IS from the allowed sender:
   - Read the full email body.
   - FIRST: Correct any misspellings, typos, or grammatical errors in the content.
   - Convert informal language, abbreviations, and slang to proper English.
   - Fix any autocorrect errors or garbled text.
   - THEN: Extract ONLY the meaningful, long-term useful information from the CORRECTED text.
   - Remove filler, greetings, footers, disclaimers, signatures.
   - Summarize into a maximum of 1–3 short sentences using proper English.
   - The summary must be plain text (no markdown, no bullets) with correct spelling and grammar.

4. NEVER store:
   - API keys, passwords, tokens, or credentials
   - personal/private info unrelated to AI behavior
   - Gmail metadata or headers
   - spam, promotions, or fluff

5. Only save information that:
   - updates the AI about new features, rules, changes
   - contains instructions that should influence the AI's long-term behavior
   - clarifies a new policy, update, schedule, or technical change

6. IMPORTANT - Text Correction:
   - Always correct misspellings before extracting information
   - Fix typos, autocorrect errors, and garbled text
   - Convert abbreviations to full words when appropriate
   - Ensure proper grammar and spelling in the final memory text
   - Example: "u r probly skiping this" → "You are probably skipping this"

7. Your OUTPUT must be one of the following:
   A) "IGNORE_EMAIL"
   B) A short plain-text summary that will be written directly into the AI's memory.
      - Must have correct spelling and grammar
      - Must use proper English words (no typos, no misspellings)
      - Must be clear and professional

8. Do NOT explain why. Do NOT add commentary. Do NOT reason out loud.
   Output ONLY the final memory text or "IGNORE_EMAIL".`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      allowed_sender,
      email,
    } = body as {
      allowed_sender?: string;
      email?: {
        account?: string;
        sender: string;
        subject?: string;
        body?: string;
        text?: string;
        html?: string;
      };
    };

    // Validate required fields
    if (!email || !email.sender) {
      return NextResponse.json(
        { error: 'email object with sender field is required' },
        { status: 400 }
      );
    }

    if (!allowed_sender) {
      return NextResponse.json(
        { error: 'allowed_sender is required' },
        { status: 400 }
      );
    }

    // Check account (must be jlbender2005)
    const emailAccount = email.account || '';
    if (emailAccount !== 'jlbender2005') {
      // Return IGNORE_EMAIL immediately without calling AI
      return NextResponse.json(
        { memory: 'IGNORE_EMAIL' },
        { status: 200 }
      );
    }

    // Check if sender matches allowed_sender
    const normalizedSender = email.sender.toLowerCase().trim();
    const normalizedAllowed = allowed_sender.toLowerCase().trim();
    
    if (normalizedSender !== normalizedAllowed) {
      // Return IGNORE_EMAIL immediately without calling AI
      return NextResponse.json(
        { memory: 'IGNORE_EMAIL' },
        { status: 200 }
      );
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Initialize OpenAI
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Extract email content (prefer text, fallback to html, then body)
    // Limit content length to prevent token overflow (max ~8000 chars for safety)
    const rawContent = email.text || email.body || email.html || '';
    const emailContent = rawContent.length > 8000 ? rawContent.substring(0, 8000) + '...' : rawContent;
    const emailSubject = email.subject || '';

    // Build the prompt for the AI
    const userPrompt = `email.account: "${emailAccount}"
email.sender: "${email.sender}"
allowed_sender: "${allowed_sender}"
email.subject: "${emailSubject}"
email.body: "${emailContent}"

IMPORTANT: Before extracting information:
1. Correct any misspellings, typos, or grammatical errors
2. Fix autocorrect errors and garbled text
3. Convert abbreviations to proper English when appropriate
4. Then extract the meaningful information from the CORRECTED text

Process this email and output ONLY the corrected memory text or "IGNORE_EMAIL".`;

    // Call OpenAI API with timeout protection
    let memoryText = 'IGNORE_EMAIL';
    try {
      // Use Promise.race for timeout (timeout option doesn't exist in OpenAI SDK)
      const completionPromise = openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: MEMORY_WORKER_PROMPT,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        max_tokens: 200, // Short responses only
        temperature: 0.3, // Low temperature for consistent extraction
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('OpenAI API timeout')), 30000)
      ) as Promise<never>;

      const completion = await Promise.race([completionPromise, timeoutPromise]);

      memoryText = completion.choices[0].message.content?.trim() || 'IGNORE_EMAIL';
    } catch (openaiError: any) {
      console.error('[ERROR] OpenAI API call failed:', openaiError.message);
      console.error('[ERROR] OpenAI error type:', openaiError.constructor.name);
      // Return IGNORE_EMAIL on OpenAI errors to allow Gmail reader to continue
      return NextResponse.json(
        { memory: 'IGNORE_EMAIL' },
        { status: 200 }
      );
    }

    // Log the extracted memory for debugging
    if (memoryText !== 'IGNORE_EMAIL') {
      console.log('[MEMORY] Extracted memory:', memoryText);
    }

    // Return the memory text (either "IGNORE_EMAIL" or the extracted memory)
    return NextResponse.json(
      { memory: memoryText },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[ERROR] Email memory ingestion failed:', error);
    console.error('[ERROR] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    // Handle OpenAI API errors - return IGNORE_EMAIL instead of error
    // This allows Gmail reader to continue processing other emails
    if (error instanceof OpenAI.APIError) {
      console.error('[ERROR] OpenAI API error:', {
        status: error.status,
        code: error.code,
        message: error.message,
      });
      // Return 200 with IGNORE_EMAIL so Gmail reader doesn't fail
      return NextResponse.json(
        {
          memory: 'IGNORE_EMAIL',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
        { status: 200 }
      );
    }

    // Return IGNORE_EMAIL on any other error to prevent blocking the Gmail reader
    // This allows the system to continue processing other emails
    return NextResponse.json(
      {
        memory: 'IGNORE_EMAIL',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 200 } // Always return 200 so Gmail reader can continue
    );
  }
}

