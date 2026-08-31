import { useMemo, useState } from 'react';
import { openCashfreeCheckout, PREMIUM_PRICE_INR } from '../utils/payment';

const initialTicker = [
  { symbol: 'XAUUSD', price: '—', change: 'Live feed not configured' },
  { symbol: 'EURUSD', price: '—', change: 'Live feed not configured' },
  { symbol: 'BTCUSD', price: '—', change: 'Live feed not configured' },
];

function calculateLots(balance, riskPercent, stopLossPips) {
  const b = Number(balance);
  const r = Number(riskPercent);
  const sl = Number(stopLossPips);

  if (!b || !r || !sl || b <= 0 || r <= 0 || sl <= 0) return 0.01;

  const riskMoney = b * (r / 100);
  const lots = riskMoney / (sl * 10);
  return Math.min(100, Math.max(0.01, lots));
}

function compoundingRows(startBalance, premium) {
  const start = Number(startBalance) || 0;
  return Array.from({ length: 30 }, (_, index) => {
    const day = index + 1;
    const balance = start * Math.pow(1.02, day);
    const previous = start * Math.pow(1.02, day - 1);
    return {
      day,
      starting: previous,
      profit: balance - previous,
      ending: balance,
      locked: !premium && day > 7,
    };
  });
}

export default function Dashboard({ user, isPremium, onPremiumActivated }) {
  const [balance, setBalance] = useState(10000);
  const [risk, setRisk] = useState(2);
  const [sl, setSl] = useState(30);
  const [ticker] = useState(initialTicker);
  const [paying, setPaying] = useState(false);
  const [notice, setNotice] = useState('');
  const [phone, setPhone] = useState(user?.phoneNumber || '');

  const lots = useMemo(() => calculateLots(balance, risk, sl), [balance, risk, sl]);
  const rows = useMemo(() => compoundingRows(balance, isPremium), [balance, isPremium]);

  async function upgrade() {
    setNotice('');
    setPaying(true);
    await openCashfreeCheckout({
      user,
      phone,
      onSuccess: () => {
        setNotice('Cashfree checkout opened. After payment, you will be returned here and your payment will be verified automatically.');
        onPremiumActivated?.();
      },
      onError: (error) => setNotice(error.message),
    });
    setPaying(false);
  }

  return (
    <main className="dashboard">
      <section className="ticker-wrap">
        <div className="ticker-track">
          {[...ticker, ...ticker].map((item, index) => (
            <div className="ticker-item" key={`${item.symbol}-${index}`}>
              <strong>{item.symbol}</strong>
              <span>{item.price}</span>
              <small>{item.change}</small>
            </div>
          ))}
        </div>
      </section>

      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">TRADER CONTROL CENTER</span>
          <h1>Good trading starts before the trade.</h1>
        </div>
        <div className={`premium-pill ${isPremium ? 'premium' : ''}`}>
          {isPremium ? '● PREMIUM ACTIVE' : '○ FREE PLAN'}
        </div>
      </div>

      {notice && <div className="alert alert-info">{notice}</div>}

      <section className="stats-grid">
        <Stat label="Balance" value={`$${Number(balance).toLocaleString()}`} />
        <Stat label="Today's Target" value="$300" accent />
        <Stat label="Max Drawdown" value="$500" />
        <Stat label="Current Drawdown" value="$0" />
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">TOOL 01</span>
              <h2>Position Size Calculator</h2>
            </div>
            <span className="tool-tag">RISK ENGINE</span>
          </div>

          <div className="calculator-form">
            <Field label="Account Balance ($)" value={balance} onChange={setBalance} />
            <Field label="Risk per Trade (%)" value={risk} onChange={setRisk} step="0.1" />
            <Field label="Stop Loss (pips)" value={sl} onChange={setSl} />
          </div>

          <div className="result-box">
            <span>Recommended Position Size</span>
            <strong>{lots.toFixed(2)} LOTS</strong>
            <small>Formula: balance × risk ÷ (SL pips × $10/pip)</small>
          </div>
          <div className="warning-note">
            ⚠️ Generic FX pip-value assumption. Verify the contract specification with your broker, especially for XAUUSD.
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">TOOL 02</span>
              <h2>30-Day Capital Compounding</h2>
            </div>
            <span className="tool-tag">2% DAILY MODEL</span>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Day</th><th>Starting</th><th>+2%</th><th>Ending</th></tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.day} className={row.locked ? 'locked-row' : ''}>
                    <td>{row.day}</td>
                    <td>${row.starting.toFixed(2)}</td>
                    <td>+${row.profit.toFixed(2)}</td>
                    <td>${row.ending.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!isPremium && (
              <div className="lock-overlay">
                <div className="lock-card">
                  <span className="lock-icon">🔒</span>
                  <h3>Days 8–30 are premium</h3>
                  <p>Unlock the complete 30-day projection and planning workflow for ₹99.</p>
                  <label className="payment-phone-label">Mobile number
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength="10"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit mobile number"
                    />
                  </label>
                  <button className="btn btn-primary" onClick={upgrade} disabled={paying}>
                    {paying ? 'Opening Cashfree…' : `Pay ₹${PREMIUM_PRICE_INR.toLocaleString()} with Cashfree`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}

function Stat({ label, value, accent = false }) {
  return (
    <div className={`stat-card ${accent ? 'accent' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Field({ label, value, onChange, step = '1' }) {
  return (
    <label>
      {label}
      <input
        type="number"
        min="0"
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
