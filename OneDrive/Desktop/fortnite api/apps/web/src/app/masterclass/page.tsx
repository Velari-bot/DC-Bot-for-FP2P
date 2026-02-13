'use client';

import Link from 'next/link';

// Route: /masterclass
export default function MasterclassPage() {
  return (
    <div style={{ minHeight: '100vh', paddingTop: '120px', paddingBottom: '100px', background: '#0A0A0A' }}>
      {/* Hero Section */}
      <section className="hero" style={{ minHeight: 'auto', padding: '80px 48px' }}>
        <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h1 style={{ 
              fontSize: '4rem', 
              fontWeight: 800, 
              marginBottom: '16px',
              color: '#FFFFFF',
              letterSpacing: '-0.03em',
              lineHeight: '1.2'
            }}>
              Fortnite Masterclass by DestinysJesus
            </h1>
            <p style={{ fontSize: '1.5rem', color: '#A0A0A0', marginBottom: '24px', fontWeight: 500 }}>
              Official PathGen Partner
            </p>
            <p style={{ fontSize: '1.125rem', color: '#A0A0A0', maxWidth: '800px', margin: '0 auto', lineHeight: '1.7' }}>
              Level up faster with the world's best Fortnite Masterclasses.
              <br />
              Trusted by 28+ pros. Over 200+ fighting lessons. Become an elite player faster with PathGen + the Fighting & Solos Masterclasses.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '60px', flexWrap: 'wrap' }}>
            <a
              href="https://www.fortnitemasterclass.com/fighting-masterclass/2l1go"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ textDecoration: 'none' }}
            >
              Start the Fighting Masterclass 2.0
            </a>
            <a
              href="https://www.fortnitemasterclass.com/solos-masterclass/2l1go"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
              style={{ textDecoration: 'none' }}
            >
              Start the Solos Masterclass
            </a>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '20px',
            maxWidth: '900px',
            margin: '0 auto 80px'
          }}>
            {[
              { value: '200+', label: 'exclusive lessons' },
              { value: '28+', label: 'pro fighters teaching' },
              { value: '100%', label: 'by DestinysJesus' },
              { value: 'Elite', label: 'for serious players' },
              { value: 'Pro', label: 'trusted by competitive' },
            ].map((stat, i) => (
              <div key={i} style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#8B5CF6', marginBottom: '8px' }}>
                  {stat.value}
                </p>
                <p style={{ fontSize: '0.875rem', color: '#A0A0A0' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why We Recommend Section */}
      <section style={{ padding: '80px 48px', background: 'rgba(255, 255, 255, 0.02)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '40px', letterSpacing: '-0.03em' }}>
            Why We Recommend This Masterclass
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontSize: '1.125rem', color: '#D1D5DB', lineHeight: '1.8' }}>
            <p>
              PathGen's mission is to help players improve with <span style={{ color: '#8B5CF6', fontWeight: 600 }}>real data</span> and <span style={{ color: '#8B5CF6', fontWeight: 600 }}>real coaching</span>.
            </p>
            <p>
              DestinysJesus's Masterclasses are one of the only Fortnite courses <span style={{ color: '#8B5CF6', fontWeight: 600 }}>actually used by pros</span> — and they perfectly complement our AI coaching tools.
            </p>
            <p style={{ fontSize: '1.5rem', fontWeight: 600, color: '#8B5CF6', marginTop: '16px' }}>
              With PathGen analyzing your gameplay + the Masterclass teaching you mechanics, you improve 10x faster.
            </p>
          </div>
        </div>
      </section>

      {/* Fighting Masterclass Section */}
      <section style={{ padding: '80px 48px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '20px', letterSpacing: '-0.03em' }}>
              Master Fortnite Fighting — 200+ Lessons from 28 Pros
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', marginBottom: '40px' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '32px'
            }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '24px', color: '#8B5CF6' }}>
                What You'll Learn
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px', color: '#D1D5DB' }}>
                {['Exact piece-by-piece fighting concepts', 'How pros think in real fights', 'Advanced mechanics breakdowns', 'Decision-making, timing, awareness'].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
                    <span style={{ color: '#8B5CF6', fontSize: '1.25rem' }}>✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '32px'
            }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '24px', color: '#8B5CF6' }}>
                Advanced Strategies
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px', color: '#D1D5DB' }}>
                {['Anti-playstyle strategies', 'VOD reviews from top pros', 'New 2025 meta coverage', 'Pro-level fight scenarios'].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
                    <span style={{ color: '#8B5CF6', fontSize: '1.25rem' }}>✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Fighting Masterclass Video */}
          <div style={{ marginBottom: '40px' }}>
            <div style={{
              position: 'relative',
              width: '100%',
              maxWidth: '700px',
              margin: '0 auto',
              paddingBottom: '32%', // 16:9 aspect ratio
              borderRadius: '20px',
              overflow: 'hidden',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <iframe
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: '20px'
                }}
                src="https://www.youtube-nocookie.com/embed/-FRZECGYgnA"
                title="Fighting Masterclass 2.0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                sandbox="allow-same-origin allow-scripts allow-presentation allow-popups"
                allowFullScreen
              />
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <a
              href="https://www.fortnitemasterclass.com/fighting-masterclass/2l1go"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ textDecoration: 'none', display: 'inline-flex' }}
            >
              Start Fighting Masterclass 2.0
            </a>
          </div>
        </div>
      </section>

      {/* Solos Masterclass Section */}
      <section style={{ padding: '80px 48px', background: 'rgba(255, 255, 255, 0.02)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '20px', letterSpacing: '-0.03em' }}>
              Dominate Solos with Proven Strategies
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', marginBottom: '40px' }}>
            <div style={{
              background: 'rgba(10, 10, 10, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '32px'
            }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '24px', color: '#8B5CF6' }}>
                Strategic Gameplay
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px', color: '#D1D5DB' }}>
                {['Rotations & positioning', 'Surge planning', 'Endgame layering'].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
                    <span style={{ color: '#8B5CF6', fontSize: '1.25rem' }}>✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{
              background: 'rgba(10, 10, 10, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '32px'
            }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '24px', color: '#8B5CF6' }}>
                Mastery Fundamentals
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px', color: '#D1D5DB' }}>
                {['Solo W-key fundamentals', 'Risk vs reward decision-making', 'Mental game & consistency training'].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
                    <span style={{ color: '#8B5CF6', fontSize: '1.25rem' }}>✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Solos Masterclass Video */}
          <div style={{ marginBottom: '40px' }}>
            <div style={{
              position: 'relative',
              width: '100%',
              maxWidth: '700px',
              margin: '0 auto',
              paddingBottom: '32%', // 16:9 aspect ratio
              borderRadius: '20px',
              overflow: 'hidden',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <iframe
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: '20px'
                }}
                src="https://www.youtube-nocookie.com/embed/hfpaM0CGi4c"
                title="Solos Masterclass $1,000,000 Edition"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                sandbox="allow-same-origin allow-scripts allow-presentation allow-popups"
                allowFullScreen
              />
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <a
              href="https://www.fortnitemasterclass.com/solos-masterclass/2l1go"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ textDecoration: 'none', display: 'inline-flex' }}
            >
              Start Solos Masterclass
            </a>
          </div>
        </div>
      </section>

      {/* How They Work Together Section */}
      <section style={{ padding: '80px 48px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '20px', letterSpacing: '-0.03em' }}>
              How PathGen + the Masterclass Work Together
            </h2>
            <p style={{ fontSize: '1.125rem', color: '#A0A0A0' }}>A complete improvement system</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '32px'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '20px', color: '#8B5CF6' }}>
                With PathGen You Get:
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px', color: '#D1D5DB', fontSize: '0.95rem' }}>
                {['Replay analysis', 'Weakness detection', 'Auto-generated drills', 'Playstyle modeling', 'VOD timestamp insights', 'Heatmaps & stats'].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'start', gap: '8px' }}>
                    <span style={{ color: '#8B5CF6' }}>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '32px'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '20px', color: '#8B5CF6' }}>
                With the Masterclass You Get:
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px', color: '#D1D5DB', fontSize: '0.95rem' }}>
                {['Pro-taught techniques', 'Fighting theory', 'Solo mastery lessons', 'Step-by-step curriculum', '200+ video lessons', 'Direct pro insights'].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'start', gap: '8px' }}>
                    <span style={{ color: '#8B5CF6' }}>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(0, 255, 170, 0.2))',
              border: '2px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '20px',
              padding: '32px'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '20px', color: '#8B5CF6' }}>
                Together?
              </h3>
              <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#8B5CF6', marginBottom: '20px' }}>
                A Full Improvement System
              </p>
              <p style={{ color: '#D1D5DB', lineHeight: '1.8', fontSize: '0.95rem' }}>
                PathGen shows you <span style={{ fontWeight: 600, color: '#8B5CF6' }}>WHAT</span> to fix.
                <br /><br />
                The Masterclass shows you <span style={{ fontWeight: 600, color: '#8B5CF6' }}>HOW</span> to fix it.
                <br /><br />
                <span style={{ fontSize: '1.125rem', fontWeight: 600 }}>Result: 10x faster improvement</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section style={{ padding: '80px 48px', background: 'rgba(255, 255, 255, 0.02)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '20px', letterSpacing: '-0.03em' }}>
              Frequently Asked Questions
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {[
              {
                q: 'Is this run by PathGen?',
                a: "No, this is an affiliate partnership. PathGen recommends the Masterclass because it's genuinely one of the best Fortnite training programs. We only partner with tools we believe will help our users improve."
              },
              {
                q: 'Does PathGen get a commission?',
                a: 'Yes, at no extra cost to you. When you use our affiliate links, PathGen earns a commission which helps us continue building free and valuable tools for the community.'
              },
              {
                q: 'Do I need PathGen to use the Masterclass?',
                a: 'No — the Masterclass works perfectly on its own. However, using both together will improve you MUCH faster. PathGen identifies your weaknesses, and the Masterclass teaches you exactly how to fix them.'
              },
              {
                q: 'Is the Masterclass worth it?',
                a: "If you're serious about improving at Fortnite, absolutely. With 200+ lessons from 28 pros, it's one of the most comprehensive training programs available. Combined with PathGen's data-driven analysis, it's a complete improvement system."
              }
            ].map((faq, i) => (
              <div key={i} style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '32px'
              }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '12px', color: '#8B5CF6' }}>
                  {faq.q}
                </h3>
                <p style={{ color: '#D1D5DB', lineHeight: '1.7' }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section style={{ padding: '100px 48px', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '20px', letterSpacing: '-0.03em' }}>
              Ready to Level Up?
            </h2>
            <p style={{ fontSize: '1.125rem', color: '#A0A0A0' }}>
              Choose the masterclass that fits your goals
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '2px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '20px',
              padding: '48px',
              textAlign: 'center'
            }}>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '16px' }}>Become an Elite Fighter</h3>
              <p style={{ color: '#D1D5DB', marginBottom: '32px', lineHeight: '1.7' }}>
                Master every aspect of Fortnite fighting with 200+ lessons from 28 pro players.
              </p>
              <a
                href="https://www.fortnitemasterclass.com/fighting-masterclass/2l1go"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                style={{ textDecoration: 'none', display: 'inline-flex', width: '100%', justifyContent: 'center' }}
              >
                Start Fighting Masterclass 2.0
              </a>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '2px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '20px',
              padding: '48px',
              textAlign: 'center'
            }}>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '16px' }}>Learn to Dominate Solos</h3>
              <p style={{ color: '#D1D5DB', marginBottom: '32px', lineHeight: '1.7' }}>
                Perfect your solo gameplay with proven strategies for rotations, endgames, and decision-making.
              </p>
              <a
                href="https://www.fortnitemasterclass.com/solos-masterclass/2l1go"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                style={{ textDecoration: 'none', display: 'inline-flex', width: '100%', justifyContent: 'center' }}
              >
                Join the Solos Masterclass
              </a>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <p style={{ color: '#A0A0A0', fontSize: '0.875rem' }}>
              Both masterclasses are available at no extra cost when using our affiliate links.
              <br />
              Questions? <Link href="/" style={{ color: '#8B5CF6', textDecoration: 'underline' }}>Contact PathGen Support</Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}