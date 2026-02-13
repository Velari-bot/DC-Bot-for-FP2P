'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { uploadReplay, checkJobStatus } from '@/lib/api';

// Route: /analyze

export default function AnalyzePage() {
  const [file, setFile] = useState<File | null>(null);
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [matchId, setMatchId] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setStatus(null);
    setTrackingId(null);
    setResult(null);
    setMatchId(null);
    
    try {
      const response = await uploadReplay(file);
      setTrackingId(response.trackingId);
      setStatus('STATUS_PENDING');
      
      // Poll for status
      pollJobStatus(response.trackingId);
    } catch (error: any) {
      console.error('Upload failed:', error);
      setLoading(false);
      setStatus('STATUS_FAILED');
      
      const errorMessage = error.message || 'Unknown error';
      alert(`Upload failed: ${errorMessage}\n\nPlease check your internet connection and try again.`);
    }
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      // Cleanup will be handled by the interval cleanup in pollJobStatus
    };
  }, []);

  const pollJobStatus = async (id: string) => {
    let pollCount = 0;
    const maxPolls = 300; // 10 minutes max (300 * 2000ms) - Osirion parsing can take time
    
    const interval = setInterval(async () => {
      pollCount++;
      
      try {
        const response = await checkJobStatus(id);
        setStatus(response.status);
        
        if (response.status === 'STATUS_COMPLETE') {
          setMatchId(response.matchId || null);
          // Combine comprehensive data with fight breakdown
          const combinedData = {
            ...(response.comprehensiveData || {}),
            fightBreakdown: response.fightBreakdown || null,
            matchId: response.matchId,
            status: 'complete'
          };
          setResult(combinedData);
          setLoading(false);
          clearInterval(interval);
        } else if (response.status === 'STATUS_FAILED') {
          setStatus('STATUS_FAILED');
          setLoading(false);
          alert('Analysis failed. Please try uploading again or contact support.');
          clearInterval(interval);
        }
        // Continue polling if status is 'STATUS_PENDING' or 'STATUS_PROCESSING'
      } catch (error: any) {
        console.error('Status check failed:', error);
        
        // Check if this is a network error
        if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
          setStatus('STATUS_FAILED');
          setLoading(false);
          alert('Cannot connect to Osirion API. Please check your internet connection and try again.');
          clearInterval(interval);
          return;
        }
        
        // If we get a 404 or "not found", it might mean the tracking ID doesn't exist yet
        if (error.message?.includes('404') || error.message?.includes('not found')) {
          setStatus('STATUS_PENDING');
          // Continue polling - might still be processing
          console.warn('Status not found yet - continuing to poll.');
        } else {
          // Other errors - stop polling and show error
          setStatus('STATUS_FAILED');
          setLoading(false);
          alert(`Error checking status: ${error.message || 'Unknown error'}\n\nPlease try again later.`);
          clearInterval(interval);
        }
      }
      
      // Stop polling after max attempts
      if (pollCount >= maxPolls) {
        setStatus('STATUS_PENDING');
        setLoading(false);
        alert('Analysis is taking longer than expected. The replay may still be processing. Please check back later using the tracking ID.');
        clearInterval(interval);
      }
    }, 2000);

    // Store interval ID so we can clear it on unmount
    return () => clearInterval(interval);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A' }}>
      {/* Hero Section */}
      <section className="hero" style={{ minHeight: 'auto', padding: '140px 48px 80px' }}>
        {/* Purple-Blue Gradient Glow */}
        <div className="hero-glow"></div>

        {/* Hero Content */}
        <div className="hero-content" style={{ textAlign: 'center', maxWidth: '1200px', margin: '0 auto' }}>
          <h1 className="hero-title">Replay Analyzer</h1>
          <p className="hero-subtitle">
            Upload your Fortnite replay files to get comprehensive match analysis powered by Osirion's advanced parsing technology.
            Gain insights into your gameplay, identify weaknesses, and improve faster.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '0 48px 100px' }}>
        {/* What You Get Section */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.02)', 
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          padding: '48px',
          marginBottom: '40px'
        }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '32px', letterSpacing: '-0.02em' }}>
            What You Get
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '16px',
              padding: '24px'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📊</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>Match Statistics</h3>
              <p style={{ fontSize: '0.95rem', color: '#A0A0A0', lineHeight: '1.6' }}>
                Complete match data including eliminations, assists, damage dealt/taken, placement, and zone-specific performance metrics.
              </p>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '16px',
              padding: '24px'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🎯</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>Shot Events</h3>
              <p style={{ fontSize: '0.95rem', color: '#A0A0A0', lineHeight: '1.6' }}>
                Detailed shot-by-shot analysis with weapon data, hit locations, damage values, and critical hit detection for every engagement.
              </p>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '16px',
              padding: '24px'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🏗️</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>Building Stats</h3>
              <p style={{ fontSize: '0.95rem', color: '#A0A0A0', lineHeight: '1.6' }}>
                Track your building performance including materials farmed/collected, builds placed, player building hits, and weakpoints.
              </p>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '16px',
              padding: '24px'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⚡</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>Zone Performance</h3>
              <p style={{ fontSize: '0.95rem', color: '#A0A0A0', lineHeight: '1.6' }}>
                Per-zone statistics showing how you perform in different storm phases, including damage, eliminations, and survival time.
              </p>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '16px',
              padding: '24px'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>👥</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>Player Data</h3>
              <p style={{ fontSize: '0.95rem', color: '#A0A0A0', lineHeight: '1.6' }}>
                Comprehensive player information including Epic IDs, usernames, team compositions, and player-specific match statistics.
              </p>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '16px',
              padding: '24px'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🔫</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>Weapon Analytics</h3>
              <p style={{ fontSize: '0.95rem', color: '#A0A0A0', lineHeight: '1.6' }}>
                Weapon usage data, damage output per weapon, accuracy metrics, and weapon-specific performance analysis.
              </p>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.02)', 
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          padding: '48px',
          marginBottom: '40px'
        }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '32px', letterSpacing: '-0.02em' }}>
            How It Works
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '32px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 700,
                margin: '0 auto 16px',
                boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)'
              }}>
                1
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '8px' }}>Upload Replay</h3>
              <p style={{ fontSize: '0.95rem', color: '#A0A0A0', lineHeight: '1.6' }}>
                Select your .replay file from Fortnite. The file is securely uploaded to Osirion's cloud infrastructure.
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 700,
                margin: '0 auto 16px',
                boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)'
              }}>
                2
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '8px' }}>Automatic Parsing</h3>
              <p style={{ fontSize: '0.95rem', color: '#A0A0A0', lineHeight: '1.6' }}>
                Osirion's advanced parser extracts all match data, events, and statistics from your replay file automatically.
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 700,
                margin: '0 auto 16px',
                boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)'
              }}>
                3
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '8px' }}>Get Insights</h3>
              <p style={{ fontSize: '0.95rem', color: '#A0A0A0', lineHeight: '1.6' }}>
                View comprehensive match data including stats, events, player info, and zone-by-zone performance breakdowns.
              </p>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.02)', 
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          padding: '48px',
          marginBottom: '40px'
        }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px', letterSpacing: '-0.02em' }}>
            Upload Replay
          </h2>
          <p style={{ fontSize: '1rem', color: '#A0A0A0', marginBottom: '32px' }}>
            Select your Fortnite replay file (.replay) to begin analysis. Files are processed securely via Osirion's API.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '12px', fontSize: '1rem', fontWeight: 500, color: '#FFFFFF' }}>
                Select Replay File (.replay)
              </label>
              <input
                type="file"
                accept=".replay"
                onChange={handleFileChange}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: '#FFFFFF',
                  fontSize: '0.95rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              />
              {file && (
                <div style={{ marginTop: '12px', fontSize: '0.875rem', color: '#10B981' }}>
                  ✓ Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="btn-primary"
              style={{ 
                alignSelf: 'flex-start', 
                cursor: (!file || loading) ? 'not-allowed' : 'pointer', 
                opacity: (!file || loading) ? 0.5 : 1,
                fontSize: '1rem',
                padding: '14px 32px'
              }}
            >
              {loading ? 'Uploading & Analyzing...' : 'Analyze Replay'}
              <svg className="arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '18px', height: '18px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
              </svg>
            </button>
          </div>
        </div>

          {trackingId && (
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.02)', 
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '40px',
              marginBottom: '40px'
            }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '24px', letterSpacing: '-0.02em' }}>Analysis Status</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}>
                  <div style={{ fontSize: '1.5rem' }}>🆔</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', color: '#A0A0A0', marginBottom: '4px' }}>Tracking ID</div>
                    <div style={{ fontFamily: 'monospace', color: '#FFFFFF', fontSize: '0.95rem', wordBreak: 'break-all' }}>{trackingId}</div>
                  </div>
                </div>
                
                {matchId && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}>
                    <div style={{ fontSize: '1.5rem' }}>🎮</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.875rem', color: '#A0A0A0', marginBottom: '4px' }}>Match ID</div>
                      <div style={{ fontFamily: 'monospace', color: '#FFFFFF', fontSize: '0.95rem', wordBreak: 'break-all' }}>{matchId}</div>
                    </div>
                  </div>
                )}
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  background: status === 'STATUS_COMPLETE' ? 'rgba(16, 185, 129, 0.1)' :
                             status === 'STATUS_FAILED' ? 'rgba(239, 68, 68, 0.1)' :
                             'rgba(245, 158, 11, 0.1)',
                  borderRadius: '12px',
                  border: `1px solid ${status === 'STATUS_COMPLETE' ? 'rgba(16, 185, 129, 0.3)' :
                                      status === 'STATUS_FAILED' ? 'rgba(239, 68, 68, 0.3)' :
                                      'rgba(245, 158, 11, 0.3)'}`
                }}>
                  <div style={{ fontSize: '1.5rem' }}>
                    {status === 'STATUS_COMPLETE' ? '✅' :
                     status === 'STATUS_FAILED' ? '❌' :
                     status === 'STATUS_PROCESSING' ? '⚙️' : '⏳'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', color: '#A0A0A0', marginBottom: '4px' }}>Status</div>
                    <div style={{
                      fontWeight: 600,
                      fontSize: '1rem',
                      color: status === 'STATUS_COMPLETE' ? '#10B981' :
                             status === 'STATUS_FAILED' ? '#EF4444' :
                             '#F59E0B'
                    }}>
                      {status === 'STATUS_PENDING' ? 'PENDING (Uploading...)' :
                       status === 'STATUS_PROCESSING' ? 'PROCESSING (Parsing replay...)' :
                       status === 'STATUS_COMPLETE' ? 'COMPLETE' :
                       status === 'STATUS_FAILED' ? 'FAILED' :
                       status?.replace('STATUS_', '') || 'PENDING'}
                    </div>
                  </div>
                </div>
                
                {(status === 'STATUS_PENDING' || status === 'STATUS_PROCESSING') && (
                  <div style={{
                    marginTop: '8px',
                    padding: '16px',
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    borderRadius: '12px',
                    fontSize: '0.95rem',
                    color: '#E9D5FF',
                    lineHeight: '1.6'
                  }}>
                    ⏳ <strong>Processing...</strong> Osirion is parsing your replay file. This typically takes 1-3 minutes. We'll automatically update when complete.
                  </div>
                )}
              </div>
            </div>
          )}

          {result && (
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.02)', 
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '40px',
              marginBottom: '40px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Analysis Results</h2>
                {matchId && (
                  <Link 
                    href={`https://osirion.gg/match/${matchId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                    style={{ fontSize: '0.875rem', padding: '8px 16px' }}
                  >
                    View on Osirion
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '14px', height: '14px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                    </svg>
                  </Link>
                )}
              </div>
              
              <div style={{
                background: '#000000',
                padding: '24px',
                borderRadius: '12px',
                overflow: 'auto',
                fontSize: '0.875rem',
                lineHeight: '1.6',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                maxHeight: '600px',
                fontFamily: 'monospace'
              }}>
                <pre style={{ margin: 0, color: '#E5E7EB', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
              
              {result && (
                <div style={{
                  marginTop: '24px',
                  padding: '20px',
                  background: 'rgba(139, 92, 246, 0.05)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  color: '#E9D5FF',
                  lineHeight: '1.6'
                }}>
                  <div style={{ fontWeight: 600, marginBottom: '12px' }}>📊 Comprehensive Match Data Available:</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px', marginTop: '12px' }}>
                    {result.matchInfo && (
                      <div style={{ padding: '8px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                        ✅ Match Info
                      </div>
                    )}
                    {result.players && (
                      <div style={{ padding: '8px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                        ✅ Players ({result.players.players?.length || 0})
                      </div>
                    )}
                    {result.weapons && (
                      <div style={{ padding: '8px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                        ✅ Weapons ({result.weapons.weapons?.length || 0})
                      </div>
                    )}
                    {result.buildingStats && (
                      <div style={{ padding: '8px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                        ✅ Building Stats
                      </div>
                    )}
                    {result.teamPlayers && (
                      <div style={{ padding: '8px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                        ✅ Team Players
                      </div>
                    )}
                    {result.events && (
                      <div style={{ padding: '8px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                        ✅ Events ({result.events.events?.length || 0})
                      </div>
                    )}
                    {result.movementEvents && (
                      <div style={{ padding: '8px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                        ✅ Movement Events ({result.movementEvents.movementEvents?.length || 0})
                      </div>
                    )}
                    {result.shotEvents && (
                      <div style={{ padding: '8px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                        ✅ Shot Events ({result.shotEvents.hitscanEvents?.length || 0})
                      </div>
                    )}
                    {result.playerPerZoneStats && (
                      <div style={{ padding: '8px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                        ✅ Zone Stats ({result.playerPerZoneStats.playerPerZoneStats?.length || 0} zones)
                      </div>
                    )}
                  </div>
                  <div style={{ marginTop: '12px', fontSize: '0.875rem', opacity: 0.8 }}>
                    All data includes: match info, player stats, weapons, building stats, events, movement, shot events, zone-by-zone performance, and fight breakdowns.
                  </div>
                </div>
              )}

              {/* Fight Breakdown Section */}
              {result.fightBreakdown && result.fightBreakdown.fights && result.fightBreakdown.fights.length > 0 && (
                <div style={{
                  marginTop: '24px',
                  padding: '24px',
                  background: 'rgba(16, 185, 129, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '12px'
                }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px', color: '#10B981' }}>
                    🥊 Fight Breakdown Engine
                  </div>
                  
                  {/* Summary Stats */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '12px',
                    marginBottom: '24px'
                  }}>
                    <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.875rem', color: '#A0A0A0', marginBottom: '4px' }}>Total Fights</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#FFFFFF' }}>
                        {result.fightBreakdown.summary.totalFights}
                      </div>
                    </div>
                    <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.875rem', color: '#A0A0A0', marginBottom: '4px' }}>Fights Won</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10B981' }}>
                        {result.fightBreakdown.summary.fightsWon}
                      </div>
                    </div>
                    <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.875rem', color: '#A0A0A0', marginBottom: '4px' }}>Fights Lost</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#EF4444' }}>
                        {result.fightBreakdown.summary.fightsLost}
                      </div>
                    </div>
                    <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.875rem', color: '#A0A0A0', marginBottom: '4px' }}>First Shot %</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#FFFFFF' }}>
                        {result.fightBreakdown.summary.firstShotAccuracy.toFixed(1)}%
                      </div>
                    </div>
                    <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.875rem', color: '#A0A0A0', marginBottom: '4px' }}>Avg Duration</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#FFFFFF' }}>
                        {(result.fightBreakdown.summary.averageFightDuration / 1000000).toFixed(1)}s
                      </div>
                    </div>
                  </div>

                  {/* Individual Fights */}
                  <div style={{ marginTop: '24px' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', color: '#FFFFFF' }}>
                      Individual Fight Breakdowns
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
                      {result.fightBreakdown.fights.slice(0, 10).map((fight: any, index: number) => (
                        <div 
                          key={fight.fightId || index}
                          style={{
                            padding: '16px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            borderRadius: '12px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#FFFFFF' }}>
                              Fight #{index + 1}
                            </div>
                            <div style={{
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              background: fight.outcome?.playerWon ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                              color: fight.outcome?.playerWon ? '#10B981' : '#EF4444'
                            }}>
                              {fight.outcome?.playerWon ? 'WON' : fight.outcome?.playerEliminated ? 'LOST' : 'ONGOING'}
                            </div>
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px', fontSize: '0.875rem' }}>
                            {fight.whoShotFirst && (
                              <div>
                                <span style={{ color: '#A0A0A0' }}>First Shot: </span>
                                <span style={{ color: '#FFFFFF', fontWeight: 600 }}>
                                  {fight.whoShotFirst.epicId.substring(0, 8)}...
                                </span>
                              </div>
                            )}
                            {fight.openingWeapon && (
                              <div>
                                <span style={{ color: '#A0A0A0' }}>Weapon: </span>
                                <span style={{ color: '#FFFFFF', fontWeight: 600 }}>
                                  {fight.openingWeapon.weaponId.split('_').pop() || 'Unknown'}
                                </span>
                              </div>
                            )}
                            {fight.startDistance && (
                              <div>
                                <span style={{ color: '#A0A0A0' }}>Distance: </span>
                                <span style={{ color: '#FFFFFF', fontWeight: 600 }}>
                                  {(fight.startDistance / 1000).toFixed(0)}m
                                </span>
                              </div>
                            )}
                            {fight.timeToFinish > 0 && (
                              <div>
                                <span style={{ color: '#A0A0A0' }}>Duration: </span>
                                <span style={{ color: '#FFFFFF', fontWeight: 600 }}>
                                  {(fight.timeToFinish / 1000000).toFixed(1)}s
                                </span>
                              </div>
                            )}
                            {fight.eliminations && fight.eliminations.length > 0 && (
                              <div>
                                <span style={{ color: '#A0A0A0' }}>Cause: </span>
                                <span style={{ color: '#FFFFFF', fontWeight: 600 }}>
                                  {fight.eliminations[0].cause.replace('_', ' ').toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>

                          {fight.earlyDamage && fight.earlyDamage.length > 0 && (
                            <div style={{ marginTop: '12px', padding: '8px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px' }}>
                              <div style={{ fontSize: '0.75rem', color: '#A0A0A0', marginBottom: '4px' }}>Early Damage (first 2s):</div>
                              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                {fight.earlyDamage.map((ed: any, idx: number) => (
                                  <div key={idx} style={{ fontSize: '0.875rem' }}>
                                    <span style={{ color: '#FFFFFF' }}>{ed.epicId.substring(0, 8)}...</span>
                                    <span style={{ color: '#10B981', marginLeft: '4px' }}>{ed.totalDamage.toFixed(0)} dmg</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {result.fightBreakdown.fights.length > 10 && (
                      <div style={{ marginTop: '12px', fontSize: '0.875rem', color: '#A0A0A0', textAlign: 'center' }}>
                        Showing first 10 of {result.fightBreakdown.fights.length} fights. Check JSON for full data.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        {/* Data Details Section */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.02)', 
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          padding: '48px'
        }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '32px', letterSpacing: '-0.02em' }}>
            What Data Does the Analyzer Extract?
          </h2>
          
          <div style={{ display: 'grid', gap: '24px' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '16px',
              padding: '24px'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '12px', color: '#FFFFFF' }}>
                📈 Match Statistics
              </h3>
              <p style={{ fontSize: '0.95rem', color: '#A0A0A0', marginBottom: '12px', lineHeight: '1.6' }}>
                Comprehensive match-level data including:
              </p>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#D1D5DB', fontSize: '0.95rem', lineHeight: '1.8' }}>
                <li><strong>Eliminations:</strong> Human elims, AI elims, assists, deaths</li>
                <li><strong>Damage Metrics:</strong> Damage done/taken, damage to players/AI/team/self, gameplaycue damage</li>
                <li><strong>Survival Data:</strong> Health/shield/overshield taken/healed, storm damage, fall damage, surge hit count</li>
                <li><strong>Performance:</strong> Headshots, shots/hits ratio, time alive, distance traveled</li>
                <li><strong>Revives/Reboots:</strong> Times revived/rebooted, players revived/rebooted</li>
              </ul>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '16px',
              padding: '24px'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '12px', color: '#FFFFFF' }}>
                🎯 Shot Events & Weapon Data
              </h3>
              <p style={{ fontSize: '0.95rem', color: '#A0A0A0', marginBottom: '12px', lineHeight: '1.6' }}>
                Detailed shot-by-shot analysis:
              </p>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#D1D5DB', fontSize: '0.95rem', lineHeight: '1.8' }}>
                <li><strong>Hit Scan Events:</strong> Every shot with timestamp, weapon ID, damage value, hit result</li>
                <li><strong>Hit Detection:</strong> Whether hits were on players, buildings, critical hits, fatal hits, shield hits</li>
                <li><strong>Location Data:</strong> 3D coordinates (x, y, z) for each shot event</li>
                <li><strong>Weapon Performance:</strong> Weapon usage statistics, damage per weapon, accuracy metrics</li>
                <li><strong>Gameplay Cues:</strong> Special ability hits and damage (grappler, shockwaves, etc.)</li>
              </ul>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '16px',
              padding: '24px'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '12px', color: '#FFFFFF' }}>
                🏗️ Building Statistics
              </h3>
              <p style={{ fontSize: '0.95rem', color: '#A0A0A0', marginBottom: '12px', lineHeight: '1.6' }}>
                Complete building performance metrics:
              </p>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#D1D5DB', fontSize: '0.95rem', lineHeight: '1.8' }}>
                <li><strong>Materials:</strong> Wood/stone/metal farmed and collected</li>
                <li><strong>Builds Placed:</strong> Count of wood/stone/metal builds placed</li>
                <li><strong>Building Hits:</strong> Hits on buildings, weakpoints, initial hits, player building hits</li>
                <li><strong>Defense:</strong> Hits to player builds, building weakpoints, building hits initial</li>
              </ul>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '16px',
              padding: '24px'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '12px', color: '#FFFFFF' }}>
                ⚡ Zone-by-Zone Performance
              </h3>
              <p style={{ fontSize: '0.95rem', color: '#A0A0A0', marginBottom: '12px', lineHeight: '1.6' }}>
                Per-zone breakdown showing how you perform in each storm phase:
              </p>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#D1D5DB', fontSize: '0.95rem', lineHeight: '1.8' }}>
                <li><strong>Zone-Specific Stats:</strong> All metrics (damage, elims, building) broken down by zone index</li>
                <li><strong>Zone Transitions:</strong> Track performance improvements or declines as the match progresses</li>
                <li><strong>Storm Management:</strong> Time in storm, storm damage taken per zone</li>
                <li><strong>Zone Survival:</strong> Time alive per zone, distance traveled per zone</li>
              </ul>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '16px',
              padding: '24px'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '12px', color: '#FFFFFF' }}>
                👥 Player & Team Information
              </h3>
              <p style={{ fontSize: '0.95rem', color: '#A0A0A0', marginBottom: '12px', lineHeight: '1.6' }}>
                Complete player data for all participants:
              </p>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#D1D5DB', fontSize: '0.95rem', lineHeight: '1.8' }}>
                <li><strong>Player IDs:</strong> Epic account IDs for all players in the match</li>
                <li><strong>Team Data:</strong> Team compositions, team-based statistics</li>
                <li><strong>Player Match Info:</strong> Individual player statistics and performance</li>
                <li><strong>Match Metadata:</strong> Server ID, match ID, sync partition time, timestamps</li>
              </ul>
            </div>
          </div>

          <div style={{
            marginTop: '32px',
            padding: '24px',
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '16px'
          }}>
            <div style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '12px', color: '#E9D5FF' }}>
              💡 Powered by Osirion API
            </div>
            <p style={{ fontSize: '0.95rem', color: '#D1D5DB', lineHeight: '1.7', margin: 0 }}>
              Our replay analyzer uses Osirion's industry-leading Fortnite replay parsing technology. 
              Once your replay is processed, you can access all this data through Osirion's API endpoints, 
              including zone-specific stats, shot events, player statistics, and more. The data is securely 
              stored and accessible via your tracking ID or match ID.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}