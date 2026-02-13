import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Discord OAuth token exchange endpoint
 * Exchanges authorization code for access token and user info
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, redirectUri } = body as {
      code: string;
      redirectUri?: string;
    };

    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code is required' },
        { status: 400 }
      );
    }

    const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '1430744947732250726';
    const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
    const REDIRECT_URI = redirectUri || 'https://pathgen.dev/setup.html';

    if (!DISCORD_CLIENT_SECRET) {
      console.warn('⚠️  DISCORD_CLIENT_SECRET not set - Discord OAuth will fail');
      return NextResponse.json(
        { error: 'Discord OAuth not configured' },
        { status: 500 }
      );
    }

    // Exchange code for access token
    try {
      const form = new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
      });

      const basicAuth = Buffer.from(`${DISCORD_CLIENT_ID}:${DISCORD_CLIENT_SECRET}`).toString('base64');

      const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${basicAuth}`,
        },
        body: form,
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        console.error('Discord token exchange failed:', tokenResponse.status, errorData);
        return NextResponse.json(
          {
            error: 'Discord OAuth failed',
            details: errorData,
          },
          { status: tokenResponse.status }
        );
      }

      const tokenData = await tokenResponse.json();
      const { access_token } = tokenData;

      // Get user info from Discord with email scope
      const userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.text();
        console.error('Discord user fetch failed:', userResponse.status, errorData);
        return NextResponse.json(
          {
            error: 'Failed to fetch Discord user info',
            details: errorData,
          },
          { status: userResponse.status }
        );
      }

      const userData = await userResponse.json();

      // Return both token and user data
      return NextResponse.json({
        access_token,
        user: {
          id: userData.id,
          username: userData.username,
          discriminator: userData.discriminator,
          email: userData.email,
          avatar: userData.avatar,
          verified: userData.verified,
        },
      });
    } catch (error: any) {
      console.error('Discord OAuth error:', error);
      return NextResponse.json(
        {
          error: 'Internal server error',
          message: error.message || 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Discord OAuth error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
