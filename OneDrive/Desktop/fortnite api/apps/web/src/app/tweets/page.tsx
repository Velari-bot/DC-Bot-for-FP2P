'use client';

import { useEffect, useState, useRef } from 'react';

export default function TweetsPage() {
  const [tweets, setTweets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    live: 0,
    osirion: 0,
    kinch: 0,
    fncomp: 0,
  });
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [error, setError] = useState<string | null>(null);
  const [apiConnected, setApiConnected] = useState(false);
  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  useEffect(() => {
    loadTweets();
    loadStats();
    startAutoRefresh();

    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
      }
    };
  }, [currentFilter]);

  useEffect(() => {
    if (apiConnected) {
      startAutoRefresh();
    }
  }, [apiConnected]);

  const loadTweets = async () => {
    try {
      const url = currentFilter === 'all' 
        ? `${API_BASE}/api/tweets?limit=50`
        : `${API_BASE}/api/tweets/${currentFilter}?limit=50`;
      
      // Create abort controller for timeout compatibility
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(url, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setTweets(data.data || []);
      
      // Update connection status - show Connected if API responded successfully
      // streamConnected might not be set, so default to Connected if we got a response
      setConnectionStatus(data.streamConnected !== false ? 'Connected' : 'Disconnected');
      
      setStats(prev => ({ ...prev, total: data.total || 0 }));
      setError(null);
      setApiConnected(true);
    } catch (error: any) {
      console.error('Error loading tweets:', error);
      
      if (error.name === 'AbortError' || error.message.includes('fetch') || error.message.includes('refused')) {
        setConnectionStatus('Disconnected');
        setError('API server is not running. Please start the API service at http://localhost:4000');
      } else {
        setConnectionStatus('Error');
        setError(error.message || 'Failed to load tweets');
      }
      setApiConnected(false);
      setTweets([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!apiConnected) return;
    
    try {
      // Create abort controller for timeout compatibility
      const controller1 = new AbortController();
      const timeoutId1 = setTimeout(() => controller1.abort(), 5000);
      
      const response = await fetch(`${API_BASE}/api/tweet-stats`, {
        signal: controller1.signal
      });
      
      clearTimeout(timeoutId1);
      if (!response.ok) return;
      
      const data = await response.json();
      
      // Create abort controller for timeout compatibility
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), 5000);
      
      const tweetsResponse = await fetch(`${API_BASE}/api/tweets?limit=100`, {
        signal: controller2.signal
      });
      
      clearTimeout(timeoutId2);
      if (!tweetsResponse.ok) return;
      
      const tweetsData = await tweetsResponse.json();
      const liveTweets = tweetsData.data?.filter((t: any) => t.isLive).length || 0;
      
      setStats({
        total: data.total || 0,
        live: liveTweets,
        osirion: data.byUser?.osirion_gg || 0,
        kinch: data.byUser?.KinchAnalytics || 0,
        fncomp: data.byUser?.FNcompReport || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      // Don't show error for stats, it's not critical
    }
  };

  const startAutoRefresh = () => {
    if (autoRefreshRef.current) {
      clearInterval(autoRefreshRef.current);
    }
    autoRefreshRef.current = setInterval(() => {
      if (apiConnected) {
        loadTweets();
        loadStats();
      }
    }, 30000);
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
          <h1 className="hero-title">Real-Time Competitive Updates</h1>
          <p className="hero-subtitle">
            Stay ahead of the competition with live tweets and updates from top Fortnite analysts.
            Track Osirion, Kinch Analytics, and FN Comp Report in real-time.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 48px' }}>
        {/* Status Bar */}
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
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.875rem'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: connectionStatus === 'Connected' ? '#10B981' : 
                          connectionStatus === 'Disconnected' ? '#F59E0B' : '#EF4444',
              display: 'block'
            }}></span>
            <span>{connectionStatus}</span>
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '8px 16px',
            fontSize: '0.875rem'
          }}>
            📊 {stats.total} tweets
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '8px 16px',
            fontSize: '0.875rem'
          }}>
            🔄 Poll: 5min | Refresh: 30s
          </div>
        </div>

        {/* Controls */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '32px',
          flexWrap: 'wrap'
        }}>
          {[
            { id: 'all', label: '📱 All Tweets' },
            { id: 'osirion_gg', label: '👤 Osirion' },
            { id: 'KinchAnalytics', label: '📊 Kinch Analytics' },
            { id: 'FNcompReport', label: '📰 FN Comp Report' },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => {
                setCurrentFilter(filter.id);
                setLoading(true);
              }}
              className="btn-secondary"
              style={{
                border: currentFilter === filter.id ? '1px solid #8B5CF6' : '1px solid #2a2a2a',
                background: currentFilter === filter.id ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                color: currentFilter === filter.id ? '#FFFFFF' : '#A0A0A0',
              }}
            >
              {filter.label}
            </button>
          ))}
          <button onClick={() => { loadTweets(); loadStats(); }} className="btn-secondary">
            🔄 Refresh
          </button>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          {[
            { label: 'Total Tweets', value: stats.total },
            { label: 'Live Tweets', value: stats.live },
            { label: 'Osirion', value: stats.osirion },
            { label: 'Kinch Analytics', value: stats.kinch },
            { label: 'FN Comp Report', value: stats.fncomp },
          ].map((stat, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '20px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '0.875rem', color: '#A0A0A0', marginBottom: '8px' }}>
                {stat.label}
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#8B5CF6' }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Tweets Container */}
        <div>
          {loading && (
            <div style={{ textAlign: 'center', padding: '60px', color: '#A0A0A0' }}>
              Loading tweets...
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
                API Connection Error
              </div>
              <div style={{ fontSize: '0.95rem', marginBottom: '20px', color: '#A0A0A0' }}>
                {error}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#A0A0A0', marginTop: '20px', padding: '20px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '12px' }}>
                <p style={{ marginBottom: '8px' }}>To fix this:</p>
                <ol style={{ textAlign: 'left', maxWidth: '500px', margin: '0 auto', lineHeight: '1.8' }}>
                  <li>Start the Fastify API service: <code style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '2px 6px', borderRadius: '4px' }}>npm run dev:api</code></li>
                  <li>Or use Docker: <code style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '2px 6px', borderRadius: '4px' }}>docker-compose up fastify-api</code></li>
                  <li>Make sure the API is running on <code style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '2px 6px', borderRadius: '4px' }}>http://localhost:4000</code></li>
                </ol>
              </div>
              <button
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  loadTweets();
                  loadStats();
                }}
                className="btn-primary"
                style={{ marginTop: '20px', display: 'inline-flex' }}
              >
                🔄 Retry Connection
              </button>
            </div>
          )}

          {!loading && !error && tweets.length === 0 && (
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
              <div style={{ fontSize: '0.95rem' }}>
                Waiting for {currentFilter === 'all' ? 'tracked accounts' : '@' + currentFilter} to tweet...
              </div>
            </div>
          )}

          {!loading && tweets.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {tweets.map((tweet, i) => {
                const logoUrl = getLogoForUsername(tweet.username);
                const initial = tweet.username[0].toUpperCase();
                
                return (
                  <div
                    key={i}
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
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
