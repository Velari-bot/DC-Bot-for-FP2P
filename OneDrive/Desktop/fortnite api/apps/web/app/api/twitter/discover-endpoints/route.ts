import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const apiKey = process.env.TWEX_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'TWEX_API_KEY not configured' }, { status: 500 });
  }

  const username = 'osirion_gg';
  const baseUrl = 'https://api.twitterxapi.com';
  const endpoints = [
    '/v1/user?username=osirion_gg',
    '/v1/user/by/username/osirion_gg',
    '/v1/users/by/username/osirion_gg',
    '/v1/user/osirion_gg',
    '/v1/users/osirion_gg',
    '/v2/user/by/username/osirion_gg',
    '/v2/users/by/username/osirion_gg',
    '/user?username=osirion_gg',
    '/user/by/username/osirion_gg',
    '/users/by/username/osirion_gg',
  ];

  const results: any[] = [];

  for (const endpoint of endpoints) {
    const url = `${baseUrl}${endpoint}`;
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      const text = await response.text();
      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch {}

      results.push({
        endpoint,
        status: response.status,
        statusText: response.statusText,
        success: response.ok,
        response: json || text.substring(0, 200),
      });
    } catch (error: any) {
      results.push({
        endpoint,
        error: error.message,
        success: false,
      });
    }
  }

  return NextResponse.json({
    baseUrl,
    username,
    results,
  });
}

