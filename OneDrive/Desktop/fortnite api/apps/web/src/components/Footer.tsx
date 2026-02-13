import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{
      background: '#0A0A0A',
      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '48px 24px',
      marginTop: '80px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '48px',
        marginBottom: '32px'
      }}>
        {/* Company Info */}
        <div>
          <h3 style={{
            color: '#FFFFFF',
            fontSize: '16px',
            fontWeight: 600,
            marginBottom: '16px'
          }}>
            PathGen
          </h3>
          <p style={{
            color: '#A0A0A0',
            fontSize: '14px',
            lineHeight: '1.6',
            marginBottom: '16px'
          }}>
            Founded by Fortnite competitive player <strong style={{ color: '#FFFFFF' }}>Aiden Bender</strong>.
            Your personal AI coach for improving at Fortnite.
          </p>
          <div style={{
            display: 'flex',
            gap: '12px',
            marginTop: '20px'
          }}>
            {/* Social links - add your actual social media URLs */}
            <a 
              href="https://twitter.com/pathgen" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                color: '#A0A0A0',
                fontSize: '14px',
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#A0A0A0'}
            >
              Twitter
            </a>
            <a 
              href="https://discord.gg/fncoach" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                color: '#A0A0A0',
                fontSize: '14px',
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#A0A0A0'}
            >
              Discord
            </a>
          </div>
        </div>

        {/* Product */}
        <div>
          <h3 style={{
            color: '#FFFFFF',
            fontSize: '16px',
            fontWeight: 600,
            marginBottom: '16px'
          }}>
            Product
          </h3>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0
          }}>
            <li style={{ marginBottom: '12px' }}>
              <Link href="/how-it-works" style={{
                color: '#A0A0A0',
                fontSize: '14px',
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}>
                How It Works
              </Link>
            </li>
            <li style={{ marginBottom: '12px' }}>
              <Link href="/pricing" style={{
                color: '#A0A0A0',
                fontSize: '14px',
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}>
                Pricing
              </Link>
            </li>
            <li style={{ marginBottom: '12px' }}>
              <Link href="/faq" style={{
                color: '#A0A0A0',
                fontSize: '14px',
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}>
                FAQ
              </Link>
            </li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h3 style={{
            color: '#FFFFFF',
            fontSize: '16px',
            fontWeight: 600,
            marginBottom: '16px'
          }}>
            Legal
          </h3>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0
          }}>
            <li style={{ marginBottom: '12px' }}>
              <Link href="/terms.html" style={{
                color: '#A0A0A0',
                fontSize: '14px',
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}>
                Terms of Service
              </Link>
            </li>
            <li style={{ marginBottom: '12px' }}>
              <Link href="/privacy.html" style={{
                color: '#A0A0A0',
                fontSize: '14px',
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}>
                Privacy Policy
              </Link>
            </li>
            <li style={{ marginBottom: '12px' }}>
              <Link href="/refund" style={{
                color: '#A0A0A0',
                fontSize: '14px',
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}>
                Refund Policy
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 style={{
            color: '#FFFFFF',
            fontSize: '16px',
            fontWeight: 600,
            marginBottom: '16px'
          }}>
            Contact
          </h3>
          <p style={{
            color: '#A0A0A0',
            fontSize: '14px',
            lineHeight: '1.6',
            marginBottom: '12px'
          }}>
            <a 
              href="mailto:support@pathgen.dev" 
              style={{
                color: '#A0A0A0',
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#A0A0A0'}
            >
              support@pathgen.dev
            </a>
          </p>
          <p style={{
            color: '#A0A0A0',
            fontSize: '12px',
            marginTop: '24px'
          }}>
            © {new Date().getFullYear()} PathGen. All rights reserved.
          </p>
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        paddingTop: '24px',
        marginTop: '32px',
        textAlign: 'center'
      }}>
        <p style={{
          color: '#666',
          fontSize: '12px'
        }}>
          PathGen analyzes your gameplay, compares it to competitive pro data, and gives you real-time coaching through voice, stats, and tactical recommendations.
        </p>
      </div>
    </footer>
  );
}

