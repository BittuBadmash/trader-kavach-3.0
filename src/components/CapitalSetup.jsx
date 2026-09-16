import { useEffect, useMemo, useState } from 'react';

const KEY = 'trader_kavach_mission';
const PROFILE_KEY = 'trader_kavach_currency_profile';
const DEFAULT_USD_INR = 95.93;

const inr = v => Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const usd = v => Number(v || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

export default function CapitalSetup({ onDone }) {
  const [amount, setAmount] = useState('10000');
  const [currency, setCurrency] = useState('INR');
  const [rate, setRate] = useState(String(DEFAULT_USD_INR));
  const [target, setTarget] = useState('100000');
  const [days, setDays] = useState('90');
  const [risk, setRisk] = useState('1');
  const [dailyLoss, setDailyLoss] = useState('1000');
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
      const mission = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (saved) {
        setAmount(String(saved.originalAmount ?? mission?.startingCapital ?? 10000));
        setCurrency(saved.currency || 'INR');
        setRate(String(saved.usdInr || DEFAULT_USD_INR));
      } else if (mission) {
        setAmount(String(mission.startingCapital ?? 10000));
      }
      if (mission) {
        setTarget(String(mission.targetCapital ?? 100000));
        setDays(String(mission.days ?? 90));
        setRisk(String(mission.riskPerTrade ?? 1));
        setDailyLoss(String(mission.dailyLossLimit ?? 1000));
      }
    } catch {}
  }, []);

  const usdValue = useMemo(() => currency === 'USD' ? Number(amount || 0) : Number(amount || 0) / Number(rate || DEFAULT_USD_INR), [amount, currency, rate]);
  const inrValue = useMemo(() => currency === 'USD' ? Number(amount || 0) * Number(rate || DEFAULT_USD_INR) : Number(amount || 0), [amount, currency, rate]);

  function save() {
    const a = Number(amount), r = Number(rate), t = Number(target), d = Number(days), rp = Number(risk), dl = Number(dailyLoss);
    if (!a || a <= 0) return setError('Starting capital enter karo.');
    if (!r || r <= 0) return setError('Valid USD/INR conversion rate enter karo.');
    if (!t || t <= 0) return setError('Target capital enter karo.');
    if (rp <= 0 || rp > 10) return setError('Risk per trade 0%–10% ke beech rakho.');
    const mission = {
      startingCapital: Math.round(inrValue * 100) / 100,
      targetCapital: currency === 'USD' ? Math.round(t * r * 100) / 100 : t,
      days: d || 90,
      dailyTarget: 0,
      dailyLossLimit: currency === 'USD' ? Math.round(dl * r * 100) / 100 : dl,
      riskPerTrade: rp,
      startDate: new Date().toISOString().slice(0, 10),
    };
    localStorage.setItem(KEY, JSON.stringify(mission));
    localStorage.setItem(PROFILE_KEY, JSON.stringify({
      currency,
      originalAmount: a,
      usdValue: Math.round(usdValue * 100) / 100,
      usdInr: r,
      updatedAt: new Date().toISOString(),
    }));
    onDone?.();
  }

  return <div className="capital-setup-backdrop">
    <div className="capital-setup-card">
      <div className="capital-setup-brand"><div className="capital-setup-logo">TK</div><div><b>TRADER <span>KAVACH</span></b><small>CAPITAL SETUP</small></div></div>
      <div className="capital-setup-title">Set your trading capital</div>
      <p className="capital-setup-sub">Pehle apna actual starting capital set karo. Trader Kavach usko USD planning value me convert karke risk aur capital journey calculate karega.</p>
      <div className="capital-setup-grid">
        <label>Starting Capital
          <div className="capital-input-row"><select value={currency} onChange={e=>setCurrency(e.target.value)}><option value="INR">₹ INR</option><option value="USD">$ USD</option></select><input type="number" min="0" value={amount} onChange={e=>setAmount(e.target.value)} /></div>
        </label>
        <label>USD / INR Rate
          <input type="number" step="0.01" value={rate} onChange={e=>setRate(e.target.value)} />
          <small>Reference rate; broker/bank rate can differ.</small>
        </label>
        <label>Target Capital ({currency})
          <input type="number" min="0" value={target} onChange={e=>setTarget(e.target.value)} />
        </label>
        <label>Mission Days
          <input type="number" min="1" value={days} onChange={e=>setDays(e.target.value)} />
        </label>
        <label>Risk / Trade (% of capital)
          <input type="number" min="0.1" max="10" step="0.1" value={risk} onChange={e=>setRisk(e.target.value)} />
        </label>
        <label>Daily Loss Limit ({currency})
          <input type="number" min="0" value={dailyLoss} onChange={e=>setDailyLoss(e.target.value)} />
        </label>
      </div>
      <div className="capital-preview"><div><small>YOUR CAPITAL IN USD</small><strong>{usd(usdValue)}</strong></div><div><small>BASE VALUE</small><b>{currency === 'USD' ? `₹${inr(inrValue)}` : `₹${inr(inrValue)}`}</b></div><div><small>USD/INR</small><b>1 USD = ₹{Number(rate || 0).toFixed(2)}</b></div></div>
      {error && <div className="capital-error">{error}</div>}
      <button className="capital-save" onClick={save}>SAVE CAPITAL & CONTINUE →</button>
      <div className="capital-note">You can edit this later from Capital Mission.</div>
    </div>
    <style>{`.capital-setup-backdrop{position:fixed;inset:0;z-index:9999;background:rgba(2,6,12,.82);backdrop-filter:blur(10px);display:grid;place-items:center;padding:20px;font-family:Inter,system-ui,sans-serif}.capital-setup-card{width:min(720px,100%);background:linear-gradient(145deg,#111923,#090F17);border:1px solid #263244;border-radius:18px;box-shadow:0 30px 100px rgba(0,0,0,.55);padding:24px;color:#F8FAFC}.capital-setup-brand{display:flex;gap:10px;align-items:center;margin-bottom:20px}.capital-setup-logo{width:42px;height:42px;border:1px solid #F5B942;border-radius:11px;display:grid;place-items:center;color:#F5B942;font-weight:900}.capital-setup-brand b{font-size:15px}.capital-setup-brand b span{color:#F5B942}.capital-setup-brand small{display:block;color:#64748B;font-size:8px;letter-spacing:1px;margin-top:3px}.capital-setup-title{font-size:25px;font-weight:850}.capital-setup-sub{color:#94A3B8;font-size:12px;line-height:1.6;margin:7px 0 18px}.capital-setup-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.capital-setup-grid label{font-size:9px;color:#94A3B8}.capital-setup-grid input,.capital-setup-grid select{width:100%;margin-top:5px;background:#0B121B;border:1px solid #263244;color:#F8FAFC;border-radius:7px;padding:10px;font-size:11px;outline:none}.capital-input-row{display:grid;grid-template-columns:95px 1fr;gap:5px}.capital-setup-grid small{display:block;color:#64748B;font-size:7px;margin-top:4px}.capital-preview{display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:8px;margin-top:15px;padding:13px;border:1px solid rgba(245,185,66,.25);background:rgba(245,185,66,.055);border-radius:9px}.capital-preview small{display:block;color:#94A3B8;font-size:7px;letter-spacing:.6px}.capital-preview strong{display:block;color:#F5B942;font-size:20px;margin-top:4px}.capital-preview b{display:block;font-size:11px;margin-top:6px}.capital-error{margin-top:10px;padding:9px;border-radius:7px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);color:#F87171;font-size:9px}.capital-save{width:100%;margin-top:13px;border:0;border-radius:8px;background:#F5B942;color:#090E16;padding:11px;font-size:10px;font-weight:900;cursor:pointer}.capital-note{text-align:center;color:#64748B;font-size:8px;margin-top:8px}@media(max-width:620px){.capital-setup-grid,.capital-preview{grid-template-columns:1fr}.capital-setup-card{padding:18px}.capital-setup-title{font-size:21px}}`}</style>
  </div>;
}
