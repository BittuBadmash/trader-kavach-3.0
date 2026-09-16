import { useEffect, useMemo, useState } from 'react';

const KEY = 'trader_kavach_mission';
const PROFILE_KEY = 'trader_kavach_currency_profile';
const num = value => Number(value || 0);
const usd = value => `$${num(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function CapitalSetup({ onDone }) {
  const [startingCapital, setStartingCapital] = useState('0');
  const [targetCapital, setTargetCapital] = useState('0');
  const [days, setDays] = useState('0');
  const [risk, setRisk] = useState('0');
  const [dailyLossLimit, setDailyLossLimit] = useState('0');
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const mission = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!mission) return;
      setStartingCapital(String(mission.startingCapital ?? 0));
      setTargetCapital(String(mission.targetCapital ?? 0));
      setDays(String(mission.days ?? 0));
      setRisk(String(mission.riskPerTrade ?? 0));
      setDailyLossLimit(String(mission.dailyLossLimit ?? 0));
    } catch {}
  }, []);

  const start = num(startingCapital);
  const target = num(targetCapital);
  const missionDays = num(days);
  const riskPct = num(risk);
  const dailyLoss = num(dailyLossLimit);
  const dailyTarget = useMemo(() => missionDays > 0 && target > start ? (target - start) / missionDays : 0, [start, target, missionDays]);

  function save() {
    setError('');
    if (start <= 0) return setError('Starting capital 0 se bada hona chahiye.');
    if (target <= start) return setError('Target capital starting capital se bada hona chahiye.');
    if (missionDays <= 0) return setError('Mission days enter karo.');
    if (riskPct <= 0 || riskPct > 10) return setError('Risk per trade 0% se zyada aur 10% ya usse kam rakho.');
    if (dailyLoss <= 0) return setError('Daily loss limit enter karo.');

    const mission = {
      startingCapital: start,
      targetCapital: target,
      days: missionDays,
      dailyTarget: Math.round(dailyTarget * 100) / 100,
      dailyLossLimit: dailyLoss,
      riskPerTrade: riskPct,
      startDate: new Date().toISOString().slice(0, 10),
    };
    localStorage.setItem(KEY, JSON.stringify(mission));
    localStorage.setItem(PROFILE_KEY, JSON.stringify({ currency: 'USD', updatedAt: new Date().toISOString() }));
    onDone?.();
  }

  return <div className="capital-setup-backdrop">
    <div className="capital-setup-card">
      <div className="capital-setup-brand"><div className="capital-setup-logo">TK</div><div><b>TRADER <span>KAVACH</span></b><small>CAPITAL SETUP • USD MODE</small></div></div>
      <div className="capital-setup-title">Set your trading capital</div>
      <p className="capital-setup-sub">Trader Kavach ab completely USD based hai. Apna real starting capital enter karo; baaki dashboard automatically calculate aur update hoga.</p>
      <div className="capital-setup-grid">
        <label>Starting Capital ($)<input type="number" min="0" step="0.01" value={startingCapital} onChange={e=>setStartingCapital(e.target.value)} placeholder="0.00" autoFocus /></label>
        <label>Target Capital ($)<input type="number" min="0" step="0.01" value={targetCapital} onChange={e=>setTargetCapital(e.target.value)} placeholder="0.00" /></label>
        <label>Mission Days<input type="number" min="0" step="1" value={days} onChange={e=>setDays(e.target.value)} placeholder="0" /></label>
        <label>Risk / Trade (%)<input type="number" min="0" max="10" step="0.1" value={risk} onChange={e=>setRisk(e.target.value)} placeholder="0.0" /></label>
        <label>Daily Loss Limit ($)<input type="number" min="0" step="0.01" value={dailyLossLimit} onChange={e=>setDailyLossLimit(e.target.value)} placeholder="0.00" /></label>
      </div>
      <div className="capital-preview"><div><small>STARTING CAPITAL</small><strong>{usd(start)}</strong></div><div><small>TARGET</small><b>{usd(target)}</b></div><div><small>AUTO DAILY TARGET</small><b>{usd(dailyTarget)}</b></div><div><small>RISK / TRADE</small><b>{riskPct.toFixed(1)}%</b></div></div>
      {error && <div className="capital-error">{error}</div>}
      <button className="capital-save" onClick={save}>SAVE CAPITAL & CONTINUE →</button>
      <div className="capital-note">All dashboard values, risk, targets and capital journey are shown in USD.</div>
    </div>
    <style>{`.capital-setup-backdrop{position:fixed;inset:0;z-index:9999;background:rgba(2,6,12,.86);backdrop-filter:blur(12px);display:grid;place-items:center;padding:18px;font-family:Inter,system-ui,sans-serif}.capital-setup-card{width:min(680px,100%);background:linear-gradient(145deg,#111923,#090F17);border:1px solid #263244;border-radius:18px;box-shadow:0 30px 100px rgba(0,0,0,.58);padding:24px;color:#F8FAFC}.capital-setup-brand{display:flex;gap:10px;align-items:center;margin-bottom:20px}.capital-setup-logo{width:42px;height:42px;border:1px solid #F5B942;border-radius:11px;display:grid;place-items:center;color:#F5B942;font-weight:900}.capital-setup-brand b{font-size:15px;letter-spacing:.3px}.capital-setup-brand b span{color:#F5B942}.capital-setup-brand small{display:block;color:#64748B;font-size:8px;letter-spacing:1px;margin-top:3px}.capital-setup-title{font-size:26px;font-weight:850;letter-spacing:-.4px}.capital-setup-sub{color:#94A3B8;font-size:12px;line-height:1.6;margin:7px 0 18px}.capital-setup-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.capital-setup-grid label{font-size:10px;color:#AAB5C5;font-weight:650}.capital-setup-grid input{width:100%;margin-top:6px;background:#0B121B;border:1px solid #263244;color:#F8FAFC;border-radius:8px;padding:11px 12px;font-size:13px;outline:none}.capital-setup-grid input:focus{border-color:#F5B942;box-shadow:0 0 0 3px rgba(245,185,66,.08)}.capital-preview{display:grid;grid-template-columns:1.2fr 1fr 1fr 1fr;gap:8px;margin-top:16px;padding:13px;border:1px solid rgba(245,185,66,.25);background:rgba(245,185,66,.055);border-radius:10px}.capital-preview small{display:block;color:#94A3B8;font-size:7px;letter-spacing:.7px}.capital-preview strong{display:block;color:#F5B942;font-size:19px;margin-top:5px}.capital-preview b{display:block;font-size:11px;margin-top:7px}.capital-error{margin-top:10px;padding:9px;border-radius:7px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);color:#F87171;font-size:9px}.capital-save{width:100%;margin-top:13px;border:0;border-radius:8px;background:#F5B942;color:#090E16;padding:12px;font-size:10px;font-weight:900;cursor:pointer}.capital-save:hover{filter:brightness(1.06)}.capital-note{text-align:center;color:#64748B;font-size:8px;margin-top:9px}@media(max-width:620px){.capital-setup-grid,.capital-preview{grid-template-columns:1fr}.capital-setup-card{padding:18px}.capital-setup-title{font-size:22px}}`}</style>
  </div>;
}
