import { NextRequest, NextResponse } from 'next/server';

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: string;
  subreddit?: string;
  url: string;
  score?: number;
  numComments?: number;
  createdAt: string;
  source: string;
  tags?: string[];
}

/**
 * Fetch forum posts from Reddit
 */
export async function GET(request: NextRequest) {
  try {
    const posts: ForumPost[] = [];

    // Try to fetch from Reddit API (if credentials available)
    const REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID;
    const REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET;

    if (REDDIT_CLIENT_ID && REDDIT_CLIENT_SECRET) {
      try {
        // Get OAuth token
        const tokenResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'fortnite-insights/1.0',
          },
          body: 'grant_type=client_credentials',
        });

        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
          const accessToken = tokenData.access_token;

          // Fetch from competitive subreddits
          const subreddits = ['FortniteCompetitive', 'FortniteBR'];
          
          for (const subreddit of subreddits) {
            try {
              const redditResponse = await fetch(
                `https://oauth.reddit.com/r/${subreddit}/hot.json?limit=20`,
                {
                  headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'User-Agent': 'fortnite-insights/1.0',
                  },
                  next: { revalidate: 1800 }, // Cache for 30 minutes
                }
              );

              if (redditResponse.ok) {
                const redditData = await redditResponse.json();
                if (redditData.data?.children) {
                  redditData.data.children.forEach((child: any) => {
                    const post = child.data;
                    if (!post.stickied) {
                      posts.push({
                        id: `reddit-${post.id}`,
                        title: post.title,
                        content: post.selftext || post.title,
                        author: post.author,
                        subreddit: post.subreddit,
                        url: `https://reddit.com${post.permalink}`,
                        score: post.score,
                        numComments: post.num_comments,
                        createdAt: new Date(post.created_utc * 1000).toISOString(),
                        source: 'reddit',
                        tags: extractTags(post.title, post.subreddit, post.link_flair_text),
                      });
                    }
                  });
                }
              }
            } catch (subError) {
              console.error(`Error fetching r/${subreddit}:`, subError);
            }
          }
        }
      } catch (redditError) {
        console.error('Error fetching Reddit data:', redditError);
      }
    }

    // Sort by score and date (highest engagement first)
    posts.sort((a, b) => {
      const scoreA = (a.score || 0) + (a.numComments || 0) * 2;
      const scoreB = (b.score || 0) + (b.numComments || 0) * 2;
      if (scoreB !== scoreA) return scoreB - scoreA;
      
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({
      success: true,
      posts,
      count: posts.length,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=900',
      },
    });
  } catch (error: any) {
    console.error('Error fetching forum posts:', error);
    return NextResponse.json({
      success: false,
      posts: [],
      count: 0,
      error: 'Failed to fetch forum posts',
      message: error.message,
    }, {
      status: 200, // Return 200 to prevent frontend crash
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      },
    });
  }
}

function extractTags(title: string, subreddit?: string, flair?: string | null): string[] {
  const tags: string[] = [];
  const lowerTitle = title.toLowerCase();
  
  // Competitive tags
  if (lowerTitle.includes('tournament') || lowerTitle.includes('cup') || lowerTitle.includes('championship')) {
    tags.push('tournament');
  }
  if (lowerTitle.includes('meta') || lowerTitle.includes('loadout') || lowerTitle.includes('weapon')) {
    tags.push('meta');
  }
  if (lowerTitle.includes('strategy') || lowerTitle.includes('tip') || lowerTitle.includes('guide')) {
    tags.push('strategy');
  }
  if (lowerTitle.includes('bug') || lowerTitle.includes('glitch') || lowerTitle.includes('issue')) {
    tags.push('bug');
  }
  if (lowerTitle.includes('update') || lowerTitle.includes('patch') || lowerTitle.includes('nerf') || lowerTitle.includes('buff')) {
    tags.push('update');
  }
  
  // Subreddit tags
  if (subreddit) {
    tags.push(subreddit.toLowerCase());
  }
  
  // Flair tags
  if (flair) {
    tags.push(flair.toLowerCase().replace(/\s+/g, '-'));
  }
  
  return tags;
}

