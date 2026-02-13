import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.TWEX_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'TWEX_API_KEY not configured' },
        { status: 500 }
      );
    }

    const username = 'osirion_gg';
    const url = `https://api.twitterxapi.com/v1/user?username=${encodeURIComponent(username)}`;

    const testResults: any = {
      url,
      apiKeyPresent: !!apiKey,
      apiKeyLength: apiKey.length,
      testStart: new Date().toISOString(),
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();
      
      testResults.status = response.status;
      testResults.statusText = response.statusText;
      testResults.headers = Object.fromEntries(response.headers.entries());
      testResults.responseText = responseText;

      try {
        testResults.responseJson = JSON.parse(responseText);
      } catch {
        testResults.responseJson = null;
      }

      testResults.success = response.ok;
    } catch (fetchError: any) {
      testResults.fetchError = {
        name: fetchError.name,
        message: fetchError.message,
        code: fetchError.code,
        cause: fetchError.cause?.message || fetchError.cause,
        stack: fetchError.stack,
      };
      testResults.success = false;
    }

    testResults.testEnd = new Date().toISOString();

    return NextResponse.json(testResults, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Test failed', message: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}

