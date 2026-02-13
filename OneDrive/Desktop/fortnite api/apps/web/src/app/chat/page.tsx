'use client';

export default function ChatPage() {
  return (
    <main className="ai-page" style={{ minHeight: '100vh' }}>
      {/* Ambient background visuals */}
      <div className="ai-bg-orb orb-1" />
      <div className="ai-bg-orb orb-2" />
      <div className="ai-bg-grid" />

      <section className="ai-container">
        <header className="ai-header">
          <h1 className="ai-title">AI Coach</h1>
          <p className="ai-subtitle">
            Your personal Fortnite mentor. Clean UI, dark by default, with neon accents.
          </p>
        </header>

        <div className="ai-panels">
          {/* Left: Promo/Capabilities */}
          <aside className="glass-card capabilities">
            <div className="card-section">
              <div className="card-kicker">Capabilities</div>
              <h2 className="card-title">Smarter help, faster wins</h2>
              <ul className="card-list">
                <li>Fight breakdowns and micro advice</li>
                <li>POI drop reviews and early game routing</li>
                <li>Weapon loadout choices by lobby type</li>
                <li>VOD notes and action items</li>
              </ul>
            </div>

            <div className="card-divider" />

            <div className="card-section">
              <div className="card-kicker">Status</div>
              <div className="status-row">
                <span className="status-dot online" /> Online
              </div>
              <div className="status-note">
                Live chat experience arrives soon. Meanwhile, explore the mock chat on the home page.
              </div>
            </div>
          </aside>

          {/* Right: Coming-soon chat shell */}
          <div className="glass-card chat-soon">
            <div className="chat-soon-header">
              <div className="chat-badge">Preview</div>
              <div className="chat-title">PathGen AI Coach</div>
            </div>

            <div className="chat-soon-body">
              <div className="chat-placeholder">
                <div className="chat-emoji">💬</div>
                <div className="chat-heading">AI Coach Coming Soon</div>
                <p className="chat-text">
                  A sleek, fluid chat experience with typing indicators, smooth animations,
                  and real coaching logic powered by your gameplay data.
                </p>
              </div>
            </div>

            <div className="chat-input disabled">
              <input
                className="chat-input-field"
                placeholder="Ask anything about Fortnite..."
                disabled
              />
              <button className="chat-send" disabled>↑</button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
