import { NextRequest, NextResponse } from 'next/server';

// Try common English caption codes in priority order
const CANDIDATE_LANGS = ['en', 'en-US', 'en-GB'];

function sToVttTime(s: number): string {
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = Math.floor(s % 60);
  const millis = Math.floor((s - Math.floor(s)) * 1000);
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${String(millis).padStart(3, '0')}`;
}

// Convert YouTube timedtext XML into WebVTT
function xmlToVtt(xml: string): string {
  // very light-weight parsing to keep dependencies minimal
  const entries: Array<{ start: number; dur: number; text: string }> = [];
  const regex = /<text[^>]*start="([^"]+)"[^>]*dur="([^"]+)"[^>]*>([\s\S]*?)<\/text>/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(xml))) {
    const start = parseFloat(m[1]);
    const dur = parseFloat(m[2]);
    // decode basic entities
    const raw = m[3]
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"');
    // YouTube inserts <br> for new lines
    const text = raw.replace(/<br\s*\/?>/gi, '\n');
    entries.push({ start, dur, text });
  }
  const lines: string[] = ['WEBVTT', ''];
  entries.forEach((e, i) => {
    const from = sToVttTime(e.start);
    const to = sToVttTime(e.start + e.dur);
    lines.push(String(i + 1));
    lines.push(`${from} --> ${to}`);
    lines.push(e.text.trim());
    lines.push('');
  });
  return lines.join('\n');
}

async function fetchYouTubeCaptions(videoId: string): Promise<string | null> {
  for (const lang of CANDIDATE_LANGS) {
    const url = `https://video.google.com/timedtext?lang=${encodeURIComponent(lang)}&v=${encodeURIComponent(videoId)}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      const txt = await res.text();
      if (txt && txt.includes('<transcript')) {
        return xmlToVtt(txt);
      }
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('videoId') || '';
    if (!videoId) {
      return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
    }
    const vtt = await fetchYouTubeCaptions(videoId);
    if (!vtt) {
      return NextResponse.json({ error: 'No public captions found (try uploading a .txt or use generate_vtt.js)' }, { status: 404 });
    }
    return new NextResponse(vtt, {
      status: 200,
      headers: {
        'Content-Type': 'text/vtt; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { videoIds?: string[] };
    const ids = Array.isArray(body.videoIds) ? body.videoIds.filter(Boolean) : [];
    if (!ids.length) {
      return NextResponse.json({ error: 'videoIds is required' }, { status: 400 });
    }
    const out: Record<string, { vtt?: string; error?: string }> = {};
    for (const id of ids) {
      try {
        const vtt = await fetchYouTubeCaptions(id);
        if (vtt) out[id] = { vtt };
        else out[id] = { error: 'no_public_captions' };
      } catch (err: any) {
        out[id] = { error: err?.message || 'failed' };
      }
      // brief delay to be nice
      await new Promise((r) => setTimeout(r, 100));
    }
    return NextResponse.json({ results: out });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}


