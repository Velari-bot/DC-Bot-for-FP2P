import { NextRequest, NextResponse } from 'next/server';

// Mark this route as dynamic since it uses request.url and dynamic params
export const dynamic = 'force-dynamic';

async function loadTweetsFromFile(): Promise<any[]> {
  // In Vercel, we can't reliably access local files
  // This would need to be replaced with a database or external storage
  return [];
}

export async function GET(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 50;
    
    const allTweets = await loadTweetsFromFile();
    
    // Filter by username (case-insensitive)
    const filteredTweets = allTweets
      .filter((tweet: any) => tweet.username?.toLowerCase() === username.toLowerCase())
      .sort((a: any, b: any) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
      })
      .slice(0, limit)
      .map((tweet: any) => {
        const now = new Date().getTime();
        const tweetTime = new Date(tweet.created_at).getTime();
        const FIVE_MINUTES = 5 * 60 * 1000;
        const isLive = (now - tweetTime) < FIVE_MINUTES;
        
        return {
          tweet_id: tweet.tweet_id,
          username: tweet.username,
          name: tweet.name,
          text: tweet.text,
          created_at: tweet.created_at,
          isLive,
        };
      });

    return NextResponse.json({
      total: allTweets.filter((tweet: any) => tweet.username?.toLowerCase() === username.toLowerCase()).length,
      data: filteredTweets,
      streamConnected: filteredTweets.length > 0,
      username,
    });
  } catch (error: any) {
    console.error('Get tweets by username error:', error);
    return NextResponse.json(
      { 
        total: 0,
        data: [],
        streamConnected: false,
        error: 'Failed to get tweets',
        details: error.message || String(error)
      },
      { status: 500 }
    );
  }
}

