'use client';


export default function TournamentsPage() {
  return (
    <div style={{ minHeight: '100vh', paddingTop: '120px', paddingBottom: '100px', background: '#0A0A0A' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h1 style={{ fontSize: '4rem', fontWeight: 800, marginBottom: '20px', letterSpacing: '-0.03em' }}>
            Tournaments
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#A0A0A0', lineHeight: '1.7' }}>
            Track Fortnite competitive tournaments and events
          </p>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          padding: '60px',
          textAlign: 'center',
          color: '#A0A0A0'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🏆</div>
          <div style={{ fontSize: '1.25rem', marginBottom: '8px', color: '#FFFFFF' }}>
            Tournaments Coming Soon
          </div>
          <div style={{ fontSize: '0.95rem' }}>
            Tournament tracking and analytics are currently under development.
            <br />
            Stay tuned for live tournament data, schedules, and results.
          </div>
        </div>
      </div>
    </div>
  );
}
