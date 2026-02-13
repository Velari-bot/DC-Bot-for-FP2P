import { NextRequest, NextResponse } from 'next/server';

type ExtractRequest = {
  videoUrls: string[];
};

type YouTubeItem = {
  id: string;
  snippet?: {
    title?: string;
    channelTitle?: string;
    publishedAt?: string;
    thumbnails?: {
      default?: { url?: string };
      medium?: { url?: string };
      high?: { url?: string };
    };
    tags?: string[];
  };
};

function extractVideoId(raw: string): string | null {
  const input = String(raw || '').trim();
  if (!input) return null;
  // If already a bare 11-char ID
  if (/^[A-Za-z0-9_-]{11}$/.test(input)) return input;
  try {
    const u = new URL(input);
    const host = (u.hostname || '').toLowerCase();
    if (host.includes('youtu.be')) {
      const path = (u.pathname || '').replace(/^\//, '');
      return path ? path.split('/')[0] : null;
    }
    if (host.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return v;
      const parts = (u.pathname || '').split('/');
      const idx = parts.indexOf('shorts');
      if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
    }
    return null;
  } catch {
    return null;
  }
}

function chunkArray<T>(arr: T[], size: number): T[][];
function chunkArray<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<ExtractRequest>;
    const videoUrls = Array.isArray(body.videoUrls) ? body.videoUrls : [];
    if (!videoUrls.length) {
      return NextResponse.json({ error: 'No videoUrls provided' }, { status: 400 });
    }

    const ids = Array.from(
      new Set(
        videoUrls
          .map(String)
          .map((u) => extractVideoId(u))
          .filter((v): v is string => !!v)
      )
    ).slice(0, 50); // cap at 50 per request per YouTube API

    const invalid = videoUrls
      .map(String)
      .filter((u) => !extractVideoId(u))
      .map((u) => ({ id: u, error: 'invalid_url' }));

    if (!ids.length) {
      return NextResponse.json({ results: [], errors: invalid }, { status: 200 });
    }

    const apiKey =
      process.env.YOUTUBE_API_KEY ||
      process.env.NEXT_PUBLIC_YOUTUBE_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      '';
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing YOUTUBE_API_KEY in environment' }, { status: 500 });
    }

    const url = new URL('https://www.googleapis.com/youtube/v3/videos');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('id', ids.join(','));
    url.searchParams.set('key', apiKey);

    const resp = await fetch(url.toString(), { cache: 'no-store' });
    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json({ error: `YouTube API error: ${resp.status} ${text}` }, { status: 500 });
    }

    const data = (await resp.json()) as { items?: YouTubeItem[] };
    const items = data.items || [];
    const foundIds = new Set(items.map((it) => it.id));

    const results = items.map((item) => {
      const vid = item.id;
      const sn = item.snippet || {};
      const thumb = sn.thumbnails?.high?.url || sn.thumbnails?.medium?.url || sn.thumbnails?.default?.url || '';
      return {
        id: `${'v'}id-${vid}`.replace('vid-vid-', 'vid-'), // ensure single prefix
        title: sn.title || '',
        url: `https://www.youtube.com/watch?v=${vid}`,
        transcript: `${vid}.vtt`,
        author: sn.channelTitle || '',
        created_at: sn.publishedAt || '',
        thumbnail: thumb,
        tags: sn.tags || ['fortnite'],
      };
    });

    // collect not-found IDs
    const notFound = ids
      .filter((id) => !foundIds.has(id))
      .map((id) => ({ id, error: 'not_found' }));

    return NextResponse.json({
      results,
      errors: [...invalid, ...notFound],
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}


