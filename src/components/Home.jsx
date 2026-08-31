const features = [
  {
    icon: '◈',
    title: 'Smart Position Sizer',
    text: 'Calculate position size from account balance, risk percentage and stop-loss distance.',
  },
  {
    icon: '↗',
    title: 'Capital Compounding',
    text: 'Build a controlled 30-day projection using a fixed 2% daily growth model.',
  },
  {
    icon: '⛨',
    title: 'Daily Drawdown Shield',
    text: 'Keep your daily loss ceiling visible before you place the next trade.',
  },
];

export default function Home({ onLogin }) {
  return (
    <main className="home-page">
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">TRADING RISK MANAGEMENT SYSTEM</div>
          <h1>Trade with a plan.<br /><span>Protect the account.</span></h1>
          <p>
            Trader Kavach is a focused pre-trade risk companion for Forex and
            Gold traders. Size the trade, define the drawdown limit, and follow
            the plan.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-large" onClick={onLogin}>
              Open Trader Dashboard
            </button>
            <span className="risk-note">Built for XAUUSD & Forex</span>
          </div>
        </div>

        <div className="hero-terminal">
          <div className="terminal-top">
            <span>RISK ENGINE</span><span className="status-dot">● ONLINE</span>
          </div>
          <div className="terminal-number">2.00%</div>
          <div className="terminal-label">MAX RISK / TRADE</div>
          <div className="terminal-bars">
            <div><i style={{ width: '82%' }} /></div>
            <div><i style={{ width: '58%' }} /></div>
            <div><i style={{ width: '67%' }} /></div>
            <div><i style={{ width: '41%' }} /></div>
          </div>
          <div className="terminal-footer">
            <span>XAUUSD</span><span>DISCIPLINE MODE</span>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="section-heading">
          <span className="eyebrow">CORE MODULES</span>
          <h2>One dashboard. Three critical decisions.</h2>
        </div>
        <div className="feature-grid">
          {features.map((feature) => (
            <article className="feature-card" key={feature.title}>
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="founder-card">
        <div>
          <span className="eyebrow">FOUNDER</span>
          <h2>Tr. Bhupendra</h2>
          <p>Gold Trader &amp; System Developer</p>
        </div>
        <div className="founder-badge">SYSTEM<br />FIRST</div>
      </section>
    </main>
  );
}
