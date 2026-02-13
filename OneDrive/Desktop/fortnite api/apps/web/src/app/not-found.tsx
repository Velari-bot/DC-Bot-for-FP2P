'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0A0A0A',
      paddingTop: '120px',
      paddingBottom: '100px'
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '600px',
        padding: '0 48px'
      }}>
        <div style={{
          fontSize: '8rem',
          fontWeight: 800,
          background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '24px',
          lineHeight: '1'
        }}>
          404
        </div>
        
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#FFFFFF',
          marginBottom: '16px',
          letterSpacing: '-0.03em'
        }}>
          Page Not Found
        </h1>
        
        <p style={{
          fontSize: '1.125rem',
          color: '#A0A0A0',
          lineHeight: '1.7',
          marginBottom: '40px'
        }}>
          The page you're looking for doesn't exist or has been moved.
          <br />
          Let's get you back on track.
        </p>

        <div style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <Link href="/" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
            Go Home
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '18px', height: '18px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
            </svg>
          </Link>
          
          <Link href="/analyze" className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
            Replay Parser
          </Link>
          
          <Link href="/masterclass" className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
            Masterclass
          </Link>
        </div>

        <div style={{
          marginTop: '60px',
          paddingTop: '40px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <p style={{ color: '#A0A0A0', fontSize: '0.875rem', marginBottom: '16px' }}>
            Popular Pages
          </p>
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            {[
              { href: '/', label: 'Home' },
              { href: '/analyze', label: 'Replay Parser' },
              { href: '/masterclass', label: 'Masterclass' },
              { href: '/tweets', label: 'Live Tweets' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  color: '#8B5CF6',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
