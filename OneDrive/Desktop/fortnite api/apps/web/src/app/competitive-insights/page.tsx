'use client';

import { useEffect, useState, useRef } from 'react';

type ViewMode = 'tweets' | 'rundown';

interface Tweet {
  id: string;
  text: string;
  username: string;
  name?: string;
  created_at: string;
  isLive?: boolean;
  author?: {
    userName: string;
    name: string;
  };
}

interface Tournament {
  id: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  prizePool?: string;
  format?: string;
  url?: string;
  source: string;
  createdAt: string;
  tags?: string[];
}

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

type RundownItem = 
  | { type: 'tweet'; data: Tweet }
  | { type: 'tournament'; data: Tournament }
  | { type: 'forum'; data: ForumPost };

export default function CompetitiveInsightsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('tweets');
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);
  const [rundownItems, setRundownItems] = useState<RundownItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadData();
    startAutoRefresh();

    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
      }
    };
  }, [viewMode, currentFilter]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (viewMode === 'tweets') {
        await loadTweets();
      } else {
        await Promise.all([
          loadTweets(),
          loadTournaments(),
          loadForums(),
        ]);
        combineRundown();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadTweets = async () => {
    try {
      const response = await fetch('/api/tweets');
      if (!response.ok) throw new Error('Failed to fetch tweets');
      
      const data = await response.json();
      const tweetList = data.tweets || [];
      
      // Transform to unified format
      const transformedTweets: Tweet[] = tweetList.map((t: any) => ({
        id: t.id || t.tweet_id,
        text: t.text || t.full_text || '',
        username: t.author?.userName || t.username || 'unknown',
        name: t.author?.name || t.name,
        created_at: t.createdAt || t.created_at || new Date().toISOString(),
        isLive: t.isLive || false,
      }));
      
      setTweets(transformedTweets);
    } catch (err: any) {
      console.error('Error loading tweets:', err);
      setTweets([]);
    }
  };

  const loadTournaments = async () => {
    try {
      const response = await fetch('/api/competitive-insights/tournaments');
      if (!response.ok) throw new Error('Failed to fetch tournaments');
      
      const data = await response.json();
      setTournaments(data.tournaments || []);
    } catch (err: any) {
      console.error('Error loading tournaments:', err);
      setTournaments([]);
    }
  };

  const loadForums = async () => {
    try {
      const response = await fetch('/api/competitive-insights/forums');
      if (!response.ok) throw new Error('Failed to fetch forums');
      
      const data = await response.json();
      setForumPosts(data.posts || []);
    } catch (err: any) {
      console.error('Error loading forums:', err);
      setForumPosts([]);
    }
  };

  const combineRundown = () => {
    const items: RundownItem[] = [];
    
    // Add tweets
    tweets.forEach(tweet => {
      items.push({ type: 'tweet', data: tweet });
    });
    
    // Add tournaments
    tournaments.forEach(tournament => {
      items.push({ type: 'tournament', data: tournament });
    });
    
    // Add forum posts
    forumPosts.forEach(post => {
      items.push({ type: 'forum', data: post });
    });
    
    // Sort by date (most recent first)
    items.sort((a, b) => {
      const dateA = new Date(
        a.type === 'tweet' ? a.data.created_at :
        a.type === 'tournament' ? (a.data.startDate || a.data.createdAt) :
        a.data.createdAt
      ).getTime();
      
      const dateB = new Date(
        b.type === 'tweet' ? b.data.created_at :
        b.type === 'tournament' ? (b.data.startDate || b.data.createdAt) :
        b.data.createdAt
      ).getTime();
      
      return dateB - dateA;
    });
    
    setRundownItems(items);
  };

  const startAutoRefresh = () => {
    if (autoRefreshRef.current) {
      clearInterval(autoRefreshRef.current);
    }
    autoRefreshRef.current = setInterval(() => {
      loadData();
    }, 60000); // Refresh every minute
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getLogoForUsername = (username: string) => {
    const logoMap: Record<string, string> = {
      'osirion_gg': '/osirion.jpg',
      'KinchAnalytics': '/kinch%20logo.jpg',
      'FNcompReport': '/fncr.jpg'
    };
    return logoMap[username] || null;
  };

  return (
    <div style={{ minHeight: '100vh', paddingTop: '120px', paddingBottom: '100px', background: '#0A0A0A' }}>
      {/* Hero Section */}
      <section className="hero" style={{ minHeight: 'auto', padding: '80px 48px' }}>
        <div className="hero-glow"></div>
        <div className="hero-content" style={{ textAlign: 'center' }}>
          <h1 className="hero-title">Competitive Insights</h1>
          <p className="hero-subtitle">
            Stay ahead with real-time updates from tournaments, forums, and top Fortnite analysts.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 48px' }}>
        {/* View Toggle */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '32px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '8px',
          width: 'fit-content'
        }}>
          <button
            onClick={() => setViewMode('tweets')}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              background: viewMode === 'tweets' ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
              color: viewMode === 'tweets' ? '#FFFFFF' : '#A0A0A0',
              fontWeight: viewMode === 'tweets' ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            📱 Tweets
          </button>
          <button
            onClick={() => setViewMode('rundown')}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              background: viewMode === 'rundown' ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
              color: viewMode === 'rundown' ? '#FFFFFF' : '#A0A0A0',
              fontWeight: viewMode === 'rundown' ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            📊 Full Rundown
          </button>
        </div>

        {/* Stats Bar */}
        <div style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '8px 16px',
            fontSize: '0.875rem'
          }}>
            📱 {tweets.length} tweets
          </div>
          {viewMode === 'rundown' && (
            <>
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '8px 16px',
                fontSize: '0.875rem'
              }}>
                🏆 {tournaments.length} tournaments
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '8px 16px',
                fontSize: '0.875rem'
              }}>
                💬 {forumPosts.length} forum posts
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '8px 16px',
                fontSize: '0.875rem'
              }}>
                📊 {rundownItems.length} total items
              </div>
            </>
          )}
          <button 
            onClick={loadData} 
            style={{
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '12px',
              padding: '8px 16px',
              color: '#FFFFFF',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            🔄 Refresh
          </button>
        </div>

        {/* Content */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#A0A0A0' }}>
            Loading {viewMode === 'tweets' ? 'tweets' : 'competitive insights'}...
          </div>
        )}

        {!loading && error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '20px',
            padding: '40px',
            textAlign: 'center',
            color: '#EF4444'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '12px', color: '#FFFFFF' }}>
              Error Loading Data
            </div>
            <div style={{ fontSize: '0.95rem', marginBottom: '20px', color: '#A0A0A0' }}>
              {error}
            </div>
            <button
              onClick={loadData}
              className="btn-primary"
              style={{ marginTop: '20px', display: 'inline-flex' }}
            >
              🔄 Retry
            </button>
          </div>
        )}

        {!loading && !error && viewMode === 'tweets' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {tweets.length === 0 ? (
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '20px',
                padding: '60px',
                textAlign: 'center',
                color: '#A0A0A0'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📭</div>
                <div style={{ fontSize: '1.25rem', marginBottom: '8px', color: '#FFFFFF' }}>No tweets found</div>
              </div>
            ) : (
              tweets.map((tweet) => {
                const logoUrl = getLogoForUsername(tweet.username);
                const initial = tweet.username[0].toUpperCase();
                
                return (
                  <div
                    key={tweet.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: tweet.isLive ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '16px',
                      padding: '24px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'start', gap: '12px', marginBottom: '12px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: logoUrl ? 'transparent' : 'linear-gradient(135deg, #8B5CF6, #3B82F6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        overflow: 'hidden',
                        fontWeight: 600,
                        color: '#FFFFFF'
                      }}>
                        {logoUrl ? (
                          <img src={logoUrl} alt={tweet.name || tweet.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          initial
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <div style={{ fontWeight: 600, color: '#FFFFFF' }}>
                            {tweet.name || tweet.username}
                          </div>
                          {tweet.isLive && (
                            <span style={{
                              background: '#EF4444',
                              color: '#FFFFFF',
                              fontSize: '0.75rem',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontWeight: 600
                            }}>🔴 LIVE</span>
                          )}
                        </div>
                        <div style={{ color: '#A0A0A0', fontSize: '0.875rem' }}>
                          @{tweet.username}
                        </div>
                      </div>
                    </div>
                    <div style={{ color: '#D1D5DB', lineHeight: '1.6', marginBottom: '12px', fontSize: '0.95rem' }}>
                      {tweet.text}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', color: '#A0A0A0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🕐</span>
                        <span>{getTimeAgo(tweet.created_at)}</span>
                      </div>
                      <div>{new Date(tweet.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {!loading && !error && viewMode === 'rundown' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {rundownItems.length === 0 ? (
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '20px',
                padding: '60px',
                textAlign: 'center',
                color: '#A0A0A0'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📭</div>
                <div style={{ fontSize: '1.25rem', marginBottom: '8px', color: '#FFFFFF' }}>No insights found</div>
              </div>
            ) : (
              rundownItems.map((item, index) => {
                if (item.type === 'tweet') {
                  const tweet = item.data;
                  const logoUrl = getLogoForUsername(tweet.username);
                  const initial = tweet.username[0].toUpperCase();
                  
                  return (
                    <div
                      key={`tweet-${tweet.id}-${index}`}
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '16px',
                        padding: '24px',
                        borderLeft: '4px solid #3B82F6'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <span style={{ fontSize: '1.5rem' }}>📱</span>
                        <span style={{ fontSize: '0.75rem', color: '#3B82F6', fontWeight: 600, textTransform: 'uppercase' }}>Tweet</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'start', gap: '12px', marginBottom: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: logoUrl ? 'transparent' : 'linear-gradient(135deg, #8B5CF6, #3B82F6)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          overflow: 'hidden',
                          fontWeight: 600,
                          color: '#FFFFFF'
                        }}>
                          {logoUrl ? (
                            <img src={logoUrl} alt={tweet.name || tweet.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            initial
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: '#FFFFFF', marginBottom: '4px' }}>
                            {tweet.name || tweet.username}
                          </div>
                          <div style={{ color: '#A0A0A0', fontSize: '0.875rem' }}>
                            @{tweet.username}
                          </div>
                        </div>
                      </div>
                      <div style={{ color: '#D1D5DB', lineHeight: '1.6', marginBottom: '12px', fontSize: '0.95rem' }}>
                        {tweet.text}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#A0A0A0' }}>
                        🕐 {getTimeAgo(tweet.created_at)}
                      </div>
                    </div>
                  );
                } else if (item.type === 'tournament') {
                  const tournament = item.data;
                  
                  return (
                    <div
                      key={`tournament-${tournament.id}-${index}`}
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(234, 179, 8, 0.3)',
                        borderRadius: '16px',
                        padding: '24px',
                        borderLeft: '4px solid #EAB308'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <span style={{ fontSize: '1.5rem' }}>🏆</span>
                        <span style={{ fontSize: '0.75rem', color: '#EAB308', fontWeight: 600, textTransform: 'uppercase' }}>Tournament</span>
                      </div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#FFFFFF', marginBottom: '8px' }}>
                        {tournament.title}
                      </h3>
                      {tournament.description && (
                        <div style={{ color: '#D1D5DB', lineHeight: '1.6', marginBottom: '12px', fontSize: '0.95rem' }}>
                          {tournament.description}
                        </div>
                      )}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '12px', fontSize: '0.875rem', color: '#A0A0A0' }}>
                        {tournament.startDate && (
                          <div>📅 Starts: {new Date(tournament.startDate).toLocaleDateString()}</div>
                        )}
                        {tournament.prizePool && (
                          <div>💰 Prize Pool: {tournament.prizePool}</div>
                        )}
                        {tournament.format && (
                          <div>🎮 Format: {tournament.format}</div>
                        )}
                      </div>
                      {tournament.url && (
                        <a 
                          href={tournament.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: '#8B5CF6', textDecoration: 'none', fontSize: '0.875rem' }}
                        >
                          Learn more →
                        </a>
                      )}
                    </div>
                  );
                } else if (item.type === 'forum') {
                  const post = item.data;
                  
                  return (
                    <div
                      key={`forum-${post.id}-${index}`}
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '16px',
                        padding: '24px',
                        borderLeft: '4px solid #10B981'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <span style={{ fontSize: '1.5rem' }}>💬</span>
                        <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600, textTransform: 'uppercase' }}>Forum</span>
                        {post.subreddit && (
                          <span style={{ fontSize: '0.75rem', color: '#A0A0A0' }}>r/{post.subreddit}</span>
                        )}
                      </div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#FFFFFF', marginBottom: '8px' }}>
                        {post.title}
                      </h3>
                      <div style={{ color: '#D1D5DB', lineHeight: '1.6', marginBottom: '12px', fontSize: '0.95rem' }}>
                        {post.content.length > 300 ? post.content.substring(0, 300) + '...' : post.content}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', color: '#A0A0A0' }}>
                        <div style={{ display: 'flex', gap: '16px' }}>
                          <div>👤 {post.author}</div>
                          {post.score !== undefined && <div>⬆️ {post.score}</div>}
                          {post.numComments !== undefined && <div>💬 {post.numComments}</div>}
                        </div>
                        <div>🕐 {getTimeAgo(post.createdAt)}</div>
                      </div>
                      <a 
                        href={post.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: '#8B5CF6', textDecoration: 'none', fontSize: '0.875rem', marginTop: '8px', display: 'inline-block' }}
                      >
                        Read more →
                      </a>
                    </div>
                  );
                }
                return null;
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

