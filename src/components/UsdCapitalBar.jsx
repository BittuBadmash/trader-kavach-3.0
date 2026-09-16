import { useEffect, useState } from 'react';

const MISSION_KEY = 'trader_kavach_mission';
const JOURNAL_KEY = 'trader_kavach_journal';
const PROFILE_KEY = 'trader_kavach_currency_profile';

const usd = v => Number(v || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
const today = () => new Date().toISOString().slice(0, 10);

export default function UsdCapitalBar() {
  const [data, setData] = useState(null);
  useEffect(() => {
    const load = () => {
      try {
        const m = JSON.parse(localStorage.getItem(MISSION_KEY) || 'null');
        const j = JSON.parse(localStorage.getItem(JOURNAL_KEY) || '[]');
        const p = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
        if (!m || !p?.usdInr) return setData(null);
        const total = (Array.isArray(j) ? j : []).reduce((s,t)=>s+(t.result==='PROFIT'?1:-1)*Number(t.amount||0),0);
        const day = (Array.isArray(j) ? j : []).filter(t=>t.date===today()).reduce((s,t)=>s+(t.result==='PROFIT'?1:-1)*Number(t.amount||0),0);
        const rate = Number(p.usdInr);
        setData({
          start:Number(m.startingCapital||0)/rate,
          current:(Number(m.startingCapital||0)+total)/rate,
          target:Number(m.targetCapital||0)/rate,
          risk:(Number(m.startingCapital||0)+total)*Number(m.riskPerTrade||1)/100/rate,
          day:day/rate,
          rate,
        });
      } catch { setData(null); }
    };
    load();
    const id = setInterval(load, 1200);
    return () => clearInterval(id);
  }, []);

  if (!data) return null;
  return <div className="tk-usdbar">
    <div><small>USD PLANNING VIEW</small><b>{usd(data.current)}</b></div>
    <div><span>START</span><strong>{usd(data.start)}</strong></div>
    <div><span>TARGET</span><strong>{usd(data.target)}</strong></div>
    <div><span>RISK / TRADE</span><strong>{usd(data.risk)}</strong></div>
    <div><span>TODAY P/L</span><strong className={data.day>=0?'up':'down'}>{data.day>=0?'+':''}{usd(data.day)}</strong></div>
    <div className="tk-usdrate"><span>RATE</span><strong>1 USD = ₹{data.rate.toFixed(2)}</strong></div>
    <style>{`.tk-usdbar{margin:0 15px 8px;padding:9px 12px;border:1px solid rgba(245,185,66,.22);background:linear-gradient(90deg,rgba(245,185,66,.08),rgba(13,19,29,.96));border-radius:9px;display:flex;align-items:center;gap:22px;color:#F8FAFC;font-family:Inter,system-ui,sans-serif}.tk-usdbar>div{display:flex;flex-direction:column;gap:3px;min-width:95px}.tk-usdbar small,.tk-usdbar span{font-size:7px;color:#94A3B8;letter-spacing:.7px}.tk-usdbar>b{font-size:15px;color:#F5B942}.tk-usdbar strong{font-size:9px}.tk-usdbar .up{color:#4ADE80}.tk-usdbar .down{color:#F87171}.tk-usdrate{margin-left:auto}@media(max-width:820px){.tk-usdbar{overflow:auto;gap:16px}.tk-usdbar>div{min-width:90px}.tk-usdrate{margin-left:0}}`}</style>
  </div>;
}
