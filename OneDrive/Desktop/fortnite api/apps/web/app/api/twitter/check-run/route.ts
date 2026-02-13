import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const apiToken = process.env.APIFY_API_TOKEN;
    if (!apiToken) {
      return NextResponse.json({ error: 'APIFY_API_TOKEN not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const runId = searchParams.get('runId');

    if (!runId) {
      return NextResponse.json({ error: 'runId required' }, { status: 400 });
    }

    const runUrl = `https://api.apify.com/v2/actor-runs/${runId}?token=${apiToken}`;
    const runResponse = await fetch(runUrl);

    if (!runResponse.ok) {
      return NextResponse.json({ error: `Failed to get run: ${runResponse.status}` }, { status: runResponse.status });
    }

    const runData = await runResponse.json();
    
    const logUrl = `https://api.apify.com/v2/logs/${runId}?token=${apiToken}`;
    const logResponse = await fetch(logUrl);
    let logs = '';
    if (logResponse.ok) {
      logs = await logResponse.text();
    }

    return NextResponse.json({
      run: runData.data,
      logs: logs.substring(Math.max(0, logs.length - 5000)),
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Check failed', 
      message: error.message 
    }, { status: 500 });
  }
}

