import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const apiToken = process.env.APIFY_API_TOKEN;
    if (!apiToken) {
      return NextResponse.json({ error: 'APIFY_API_TOKEN not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const datasetId = searchParams.get('datasetId');
    const runId = searchParams.get('runId');

    if (!datasetId && !runId) {
      return NextResponse.json({ error: 'datasetId or runId required' }, { status: 400 });
    }

    let targetDatasetId = datasetId;
    
    if (runId && !datasetId) {
      const statusUrl = `https://api.apify.com/v2/actor-runs/${runId}?token=${apiToken}`;
      const statusResponse = await fetch(statusUrl);
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        targetDatasetId = statusData.data?.defaultDatasetId;
      }
    }

    if (!targetDatasetId) {
      return NextResponse.json({ error: 'Could not determine dataset ID' }, { status: 400 });
    }

    const datasetUrl = `https://api.apify.com/v2/datasets/${targetDatasetId}/items?token=${apiToken}`;
    const response = await fetch(datasetUrl);

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ 
        error: `Failed to fetch dataset: ${response.status}`,
        details: errorText 
      }, { status: response.status });
    }

    const items = await response.json();

    return NextResponse.json({
      datasetId: targetDatasetId,
      itemCount: Array.isArray(items) ? items.length : 0,
      sampleItems: Array.isArray(items) ? items.slice(0, 3) : items,
      allItems: items,
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Debug failed', 
      message: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}

