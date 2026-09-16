import { useEffect, useMemo, useRef, useState } from 'react';
import { openCashfreeCheckout, PREMIUM_PRICE_INR } from '../utils/payment';

const MISSION_KEY = 'trader_kavach_mission';
const JOURNAL_KEY = 'trader_kavach_journal';
const ROUTINE_KEY = 'trader_kavach_daily_routine';
const SYMBOLS = [
  { value: 'OANDA:XAUUSD', label: 'XAUUSD', name: 'Gold / US Dollar' },
  { value: 'FX:EURUSD', label: 'EURUSD', name: 'Euro / US Dollar' },
  { value: 'COINBASE:BTCUSD', label: 'BTCUSD', name: 'Bitcoin / US Dollar' },
];
const nav = [['dashboard','⌂','Overview'],['chart','◫','Live Chart'],['risk','◈','Risk Control'],['journal','▤','Journal'],['mission','◎','Capital Mission'],['alerts','⚠','Alerts'],['guidance','✦','Guidance']];
const today = () => new Date().toISOString().slice(0, 10);
const n = value => Number(value || 0);
const usd = value => `$${n(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const signed = value => `${n(value) >= 0 ? '+' : '-'}${usd(Math.abs(n(value)))}`;
const blankTrade = () => ({ id: Date.now(), date: today(), symbol: 'XAUUSD', setup: '', entry: '0', result: 'PROFIT', amount: '0', emotion: 'CALM', note: '' });

function Panel({ title, icon = '•', action, children, className = '' }) {
  return <section className={`tkp-panel ${className}`}><div className="tkp-head"><b><i>{icon}</i>{title}</b>{action}</div>{children}</section>;
}
function Bar({ value, tone = 'gold' }) {
  return <div className="tkp-bar"><span className={tone} style={{ width: `${Math.max(0, Math.min(100, value || 0))}%` }} /></div>;
}
function TVChart({ symbol, interval }) {
  const ref = useRef(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    root.innerHTML = '';
    const box = document.createElement('div'); box.className = 'tradingview-widget-container'; box.style = 'height:100%;width:100%';
    const mount = document.createElement('div'); mount.className = 'tradingview-widget-container__widget'; mount.style = 'height:100%;width:100%'; box.appendChild(mount);
    const script = document.createElement('script'); script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'; script.async = true;
    script.innerHTML = JSON.stringify({ autosize: true, symbol, interval, timezone: 'Asia/Kolkata', theme: 'dark', backgroundColor: 'rgba(7,11,18,1)', gridColor: 'rgba(148,163,184,.06)', style: '1', locale: 'en', hide_top_toolbar: false, hide_side_toolbar: false, allow_symbol_change: false, save_image: false, withdateranges: true, calendar: false, support_host: 'https://www.tradingview.com' });
    box.appendChild(script); root.appendChild(box);
    return () => { root.innerHTML = ''; };
  }, [symbol, interval]);
  return <div className="tkp-tv" ref={ref} />;
}

export default function DashboardPro({ user, isPremium, onPremiumActivated }) {
  const [capital, setCapital] = useState(0);
  const [risk, setRisk] = useState(0);
  const [sl, setSl] = useState(0);
  const [tp, setTp] = useState(0);
  const [symbol, setSymbol] = useState('OANDA:XAUUSD');
  const [interval, setIntervalValue] = useState('5');
  const [mission, setMission] = useState(null);
  const [journal, setJournal] = useState([]);
  const [trade, setTrade] = useState(blankTrade());
  const [routine, setRoutine] = useState({ analysis: false, plan: false, risk: false, journal: false, review: false });
  const [notice, setNotice] = useState('');
  const [active, setActive] = useState('dashboard');
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    try {
      const m = JSON.parse(localStorage.getItem(MISSION_KEY) || 'null');
      const j = JSON.parse(localStorage.getItem(JOURNAL_KEY) || '[]');
      const r = JSON.parse(localStorage.getItem(ROUTINE_KEY) || 'null');
      if (m) { setMission(m); setCapital(n(m.startingCapital)); setRisk(n(m.riskPerTrade)); }
      if (Array.isArray(j)) setJournal(j);
      if (r?.date === today()) setRoutine(r.items || {});
    } catch (e) { console.error(e); }
  }, []);
  useEffect(() => setPhone(user?.phoneNumber || ''), [user?.phoneNumber]);

  const entries = journal.filter(t => t.date === today());
  const total = journal.reduce((sum, t) => sum + (t.result === 'PROFIT' ? 1 : -1) * n(t.amount), 0);
  const day = entries.reduce((sum, t) => sum + (t.result === 'PROFIT' ? 1 : -1) * n(t.amount), 0);
  const wins = journal.filter(t => t.result === 'PROFIT').length;
  const losses = journal.filter(t => t.result === 'LOSS').length;
  const winRate = journal.length ? wins / journal.length * 100 : 0;
  const gp = journal.filter(t => t.result === 'PROFIT').reduce((s, t) => s + n(t.amount), 0);
  const gl = journal.filter(t => t.result === 'LOSS').reduce((s, t) => s + n(t.amount), 0);
  const pf = gl ? gp / gl : gp ? Infinity : 0;
  const current = capital + total;
  const riskAmount = current * risk / 100;
  const rr = sl > 0 ? tp / sl : 0;
  const target = n(mission?.targetCapital);
  const start = n(mission?.startingCapital);
  const missionPct = target > start ? ((current - start) / (target - start)) * 100 : 0;
  const lossUsed = Math.max(0, -day);
  const routineDone = Object.values(routine).filter(Boolean).length;
  const meta = SYMBOLS.find(x => x.value === symbol) || SYMBOLS[0];
  const name = user?.displayName || user?.email?.split('@')[0] || 'Trader';
  const warnings = [
    ...(mission?.dailyLossLimit > 0 && lossUsed >= mission.dailyLossLimit * .8 ? [['danger', '!', 'Daily loss limit approaching', `${usd(lossUsed)} / ${usd(mission.dailyLossLimit)} used`]] : []),
    ...(entries.length >= 3 ? [['warning', '↗', 'Overtrading warning', `${entries.length} trades logged today`]] : []),
    ...(day < 0 ? [['warning', '↯', 'Revenge-trade check', 'Keep the next trade at predefined risk.']] : []),
    ...(risk > 2 ? [['danger', '⚠', 'Risk above 2%', 'Review position size before entering.']] : []),
  ];

  const go = id => { setActive(id); document.getElementById(`tkp-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const toggleRoutine = key => {
    const next = { ...routine, [key]: !routine[key] };
    setRoutine(next);
    localStorage.setItem(ROUTINE_KEY, JSON.stringify({ date: today(), items: next }));
  };
  const saveTrade = () => {
    const amount = n(trade.amount);
    if (amount <= 0) return setNotice('P/L amount 0 hai. Actual trade result enter karo.');
    const next = [{ ...trade, id: Date.now(), date: today(), amount }, ...journal];
    setJournal(next); localStorage.setItem(JOURNAL_KEY, JSON.stringify(next)); setTrade(blankTrade()); setNotice('Trade saved. Dashboard updated.');
  };
  const deleteTrade = id => { const next = journal.filter(t => t.id !== id); setJournal(next); localStorage.setItem(JOURNAL_KEY, JSON.stringify(next)); };
  const calculate = () => setNotice(`Risk ${usd(riskAmount)} | R:R ${rr > 0 ? `1:${rr.toFixed(2)}` : 'not set'}`);
  async function upgrade() {
    if (phone.replace(/\D/g, '').length !== 10) return setNotice('Cashfree ke liye valid 10-digit mobile number enter karo.');
    try {
      setPaying(true);
      await openCashfreeCheckout({ user, phone: phone.replace(/\D/g, ''), onSuccess: () => { setNotice('Payment complete. Premium verification started.'); onPremiumActivated?.(); }, onError: e => setNotice(e?.message || 'Payment process failed.') });
    } catch (e) { setNotice(e?.message || 'Payment process failed.'); } finally { setPaying(false); }
  }

  const motivation = day < 0 ? 'Loss ko recover karne ke liye lot size mat badhao.' : mission?.dailyTarget > 0 && day >= mission.dailyTarget ? 'Daily target reached. Ab unnecessary trades avoid karo.' : day > 0 ? 'Profit protect karo. Next trade sirf valid setup par.' : 'Capital protect karo. Next trade compulsory nahi hai.';

  if (!isPremium) {
    return <div className="tkp-root tkp-locked-root"><style>{styles}</style><div className="tkp-locked-wrap">
      <div className="tkp-locked-brand"><div className="tkp-logo">TK</div><div><b>TRADER <span>KAVACH</span></b><small>TRADING CONTROL CENTER</small></div></div>
      <div className="tkp-lock-hero"><div className="tkp-lock-icon">🔒</div><div><div className="tkp-eyebrow">PREMIUM ACCESS</div><h1>Your Trading Control Center is locked</h1><p>Capital setup save ho sakta hai, lekin chart, risk control, journal, alerts, mission aur guidance payment ke baad unlock honge.</p></div></div>
      <div className="tkp-lock-grid">
        <div className="tkp-lock-card"><span>STARTING CAPITAL</span><strong>{start ? usd(start) : '$0.00'}</strong></div>
        <div className="tkp-lock-card"><span>TARGET CAPITAL</span><strong>{target ? usd(target) : '$0.00'}</strong></div>
        <div className="tkp-lock-card"><span>RISK / TRADE</span><strong>{risk ? `${risk.toFixed(1)}%` : '0.0%'}</strong></div>
        <div className="tkp-lock-card"><span>STATUS</span><strong className="gold">LOCKED</strong></div>
      </div>
      {notice && <div className="tkp-notice">{notice}</div>}
      <div className="tkp-payment"><div><div className="tkp-eyebrow">TRADER KAVACH PRO</div><h2>Unlock the complete dashboard</h2><p>Live chart • Risk control • Trade journal • Capital mission • Alerts • Guidance • Analytics</p></div><div className="tkp-paybox"><div className="tkp-price">₹{PREMIUM_PRICE_INR}<small>/month</small></div><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Mobile number" inputMode="numeric" /><button onClick={upgrade} disabled={paying}>{paying ? 'Opening…' : 'UNLOCK PREMIUM →'}</button></div></div>
      <div className="tkp-lock-note">Subscription payment is processed through the existing Cashfree setup. Dashboard trading values remain USD.</div>
    </div></div>;
  }

  return <div className="tkp-root"><style>{styles}</style><div className="tkp-layout">
    <aside className="tkp-side"><div className="tkp-brand"><div className="tkp-logo">TK</div><div><b>TRADER <span>KAVACH</span></b><small>TRADE SAFE • TRADE SMART</small></div></div><div className="tkp-user"><div className="tkp-avatar">{name.slice(0,2).toUpperCase()}</div><div><b>{name}</b><small className="green">● Premium</small></div></div><nav>{nav.map(([id, icon, label]) => <button key={id} className={active === id ? 'active' : ''} onClick={() => go(id)}><span>{icon}</span>{label}</button>)}</nav><div className="tkp-quote"><b>TRADING PRINCIPLE</b><p>Capital protection comes before profit extraction.</p></div></aside>
    <main className="tkp-main"><header className="tkp-top"><div><b>TRADING CONTROL CENTER</b><span className="tkp-live">● MARKET LIVE</span></div><select value={symbol} onChange={e => setSymbol(e.target.value)}>{SYMBOLS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></header>
      <div className="tkp-content">{notice && <div className="tkp-notice">{notice}</div>}
        <section id="tkp-dashboard" className="tkp-overview">
          <div className="tkp-panel"><div className="tkp-card"><span>CAPITAL</span><strong className="tkp-big">{usd(current)}</strong><div className="tkp-row"><span>Start</span><b>{usd(start)}</b></div><div className="tkp-row"><span>Target</span><b>{usd(target)}</b></div><Bar value={missionPct} /><div className="tkp-mini"><div><small>P/L</small><b className={total >= 0 ? 'green' : 'red'}>{signed(total)}</b></div><div><small>To Target</small><b>{target ? usd(Math.max(0, target - current)) : '$0.00'}</b></div></div></div></div>
          <div className="tkp-panel"><div className="tkp-card"><span>RISK CONTROL</span><strong className="tkp-big">{usd(riskAmount)}</strong><div className="tkp-row"><span>Risk / trade</span><b>{risk.toFixed(1)}%</b></div><Bar value={Math.min(100, risk * 50)} tone={risk > 2 ? 'red' : 'gold'} /><div className="tkp-mini"><div><small>Daily Loss</small><b className={lossUsed ? 'red' : 'green'}>{usd(lossUsed)}</b></div><div><small>R:R</small><b>1:{rr.toFixed(2)}</b></div></div></div></div>
          <div className="tkp-panel"><div className="tkp-card"><span>MISSION</span><strong className="tkp-big">{routineDone}/5</strong><Bar value={routineDone * 20} tone="green" /><div className="tkp-row"><span>Today</span><b>{day >= 0 ? '+' : '-'}{usd(Math.abs(day))}</b></div><div className="tkp-mini"><div><small>Trades</small><b>{entries.length}</b></div><div><small>Win Rate</small><b>{winRate.toFixed(1)}%</b></div></div></div></div>
          <div className="tkp-panel"><div className="tkp-card"><span>PERFORMANCE</span><strong className="tkp-big">{winRate.toFixed(1)}%</strong><div className="tkp-mini"><div><small>Wins</small><b className="green">{wins}</b></div><div><small>Losses</small><b className="red">{losses}</b></div><div><small>Profit Factor</small><b>{pf === Infinity ? '∞' : pf.toFixed(2)}</b></div><div><small>Trades</small><b>{journal.length}</b></div></div></div></div>
        </section>

        <div className="tkp-grid"><Panel title={`${meta.label} • ${meta.name}`} icon="◉" action={<span className="tkp-live">● LIVE</span>}><div id="tkp-chart"><div className="tkp-charthead"><b>{meta.label}</b><div className="tkp-time">{[['1','M1'],['5','M5'],['15','M15'],['60','H1'],['240','H4'],['D','D1']].map(([v,l]) => <button key={v} className={interval === v ? 'active' : ''} onClick={() => setIntervalValue(v)}>{l}</button>)}</div></div><div className="tkp-chart"><TVChart symbol={symbol} interval={interval} /></div></div></Panel>
          <div className="tkp-stack"><Panel title="Market Watch" icon="◌"><div className="tkp-market">{SYMBOLS.map(s => <button key={s.value} onClick={() => setSymbol(s.value)}><div><b>{s.label}</b><small>{s.name}</small></div><span className="green">LIVE</span></button>)}</div></Panel><Panel title="Alerts" icon="⚠"><div>{warnings.length ? warnings.slice(0, 4).map((w, i) => <div className={`tkp-alert ${w[0]}`} key={i}><i>{w[1]}</i><div><b>{w[2]}</b><small>{w[3]}</small></div></div>) : <div className="tkp-empty">No active warnings.</div>}</div></Panel><div className="tkp-motivation"><b>{motivation}</b><small>Context updated from your current trading data.</small></div></div>
        </div>

        <div id="tkp-risk" className="tkp-lower"><Panel title="Risk Control" icon="◈"><div className="tkp-body"><div className="tkp-fields"><label>Account Capital<input type="number" min="0" step="0.01" value={capital} onChange={e => setCapital(n(e.target.value))} /></label><label>Risk %<input type="number" min="0" max="10" step="0.1" value={risk} onChange={e => setRisk(n(e.target.value))} /></label><label>Stop Loss<input type="number" min="0" step="0.01" value={sl} onChange={e => setSl(n(e.target.value))} /></label><label>Target<input type="number" min="0" step="0.01" value={tp} onChange={e => setTp(n(e.target.value))} /></label></div><div className="tkp-result"><div><span>Risk Amount</span><b>{usd(riskAmount)}</b></div><div><span>R:R</span><b>1:{rr.toFixed(2)}</b></div></div><button className="tkp-primary tkp-full" onClick={calculate}>UPDATE RISK →</button></div></Panel>
          <Panel title="Trade Journal" icon="▤" action={<small>{entries.length} today</small>}><div id="tkp-journal" className="tkp-form"><div className="tkp-formgrid"><label>Symbol<select value={trade.symbol} onChange={e => setTrade({ ...trade, symbol: e.target.value })}><option>XAUUSD</option><option>EURUSD</option><option>BTCUSD</option></select></label><label>Setup<input value={trade.setup} onChange={e => setTrade({ ...trade, setup: e.target.value })} placeholder="Enter setup" /></label><label>Entry<input type="number" value={trade.entry} onChange={e => setTrade({ ...trade, entry: e.target.value })} /></label><label>P/L ($)<input type="number" min="0" step="0.01" value={trade.amount} onChange={e => setTrade({ ...trade, amount: e.target.value })} /></label><label>Result<select value={trade.result} onChange={e => setTrade({ ...trade, result: e.target.value })}><option value="PROFIT">PROFIT</option><option value="LOSS">LOSS</option></select></label><label>Emotion<select value={trade.emotion} onChange={e => setTrade({ ...trade, emotion: e.target.value })}><option>CALM</option><option>FEAR</option><option>GREED</option><option>REVENGE</option><option>FOMO</option></select></label><button className="tkp-primary" onClick={saveTrade}>SAVE TRADE</button></div></div><div className="tkp-tablewrap"><table><thead><tr><th>Symbol</th><th>Setup</th><th>Entry</th><th>Result</th><th>P/L</th><th>Emotion</th><th /></tr></thead><tbody>{journal.length ? journal.slice(0, 8).map(t => <tr key={t.id}><td>{t.symbol}</td><td>{t.setup || '—'}</td><td>{t.entry || '0'}</td><td className={t.result === 'PROFIT' ? 'green' : 'red'}>{t.result}</td><td className={t.result === 'PROFIT' ? 'green' : 'red'}>{t.result === 'PROFIT' ? '+' : '-'}{usd(t.amount)}</td><td>{t.emotion}</td><td><button className="delete" onClick={() => deleteTrade(t.id)}>×</button></td></tr>) : <tr><td colSpan="7" className="tkp-empty">No trades yet.</td></tr>}</tbody></table></div></Panel>
          <div className="tkp-stack"><Panel title="Discipline" icon="◎"><div className="tkp-card"><strong className="tkp-score">{routineDone * 20}%</strong><Bar value={routineDone * 20} tone="green" /><div className="tkp-row"><span>Risk</span><b>{risk <= 2 ? 'Controlled' : 'Review'}</b></div><div className="tkp-row"><span>Overtrading</span><b>{entries.length < 3 ? 'Clear' : 'Flagged'}</b></div></div></Panel><Panel title="Daily Routine" icon="✓"><div className="tkp-check">{[['analysis','Market analysis'],['plan','Trading plan'],['risk','Risk calculated'],['journal','Journal updated'],['review','End-of-day review']].map(([key, label]) => <label key={key}><input type="checkbox" checked={!!routine[key]} onChange={() => toggleRoutine(key)} />{label}</label>)}</div></Panel></div>
        </div>

        <div id="tkp-mission" className="tkp-bottom"><Panel title="Capital Mission" icon="◎"><div className="tkp-card"><strong className="tkp-big">{missionPct.toFixed(1)}%</strong><Bar value={missionPct} /><div className="tkp-row"><span>Current</span><b>{usd(current)}</b></div><div className="tkp-row"><span>Target</span><b>{usd(target)}</b></div><div className="tkp-row"><span>Remaining</span><b>{usd(Math.max(0, target - current))}</b></div><div className="tkp-row"><span>Auto daily target</span><b>{usd(n(mission?.dailyTarget))}</b></div></div></Panel><Panel title="Alerts & Warnings" icon="⚠"><div>{warnings.length ? warnings.map((w, i) => <div className={`tkp-alert ${w[0]}`} key={i}><i>{w[1]}</i><div><b>{w[2]}</b><small>{w[3]}</small></div></div>) : <div className="tkp-empty">Everything is within the current rules.</div>}</div></Panel></div>
        <div id="tkp-guidance" className="tkp-bottom"><Panel title="Context Guidance" icon="✦"><div className="tkp-guidance"><div><b>BEFORE ENTRY</b><p>Bias → setup → entry → SL → risk. If risk is not calculated, trade is not ready.</p></div><div><b>AFTER WIN</b><p>Do not increase size just because the previous trade won.</p></div><div><b>AFTER LOSS</b><p>Do not revenge trade or increase size to recover.</p></div></div></Panel><Panel title="Account Status" icon="●"><div className="tkp-card"><span>PREMIUM</span><strong className="green">ACTIVE</strong><p className="muted">All Trader Kavach modules are unlocked.</p></div></Panel></div>
      </div>
    </main>
  </div></div>;
}

const styles = `
.tkp-root{--bg:#070B12;--panel:#0E151F;--panel2:#111923;--border:#202C3C;--text:#F8FAFC;--muted:#8D9AAF;--gold:#F5B942;--green:#22C55E;--red:#EF4444;min-height:calc(100vh - 60px);background:radial-gradient(1000px 500px at 45% -15%,rgba(245,185,66,.08),transparent 60%),var(--bg);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:13px}.tkp-root *{box-sizing:border-box}.tkp-layout{display:flex;min-height:calc(100vh - 60px)}.tkp-side{width:216px;flex:0 0 216px;background:#090E16;border-right:1px solid var(--border);padding:15px 11px;position:sticky;top:0;height:calc(100vh - 60px);overflow:auto}.tkp-brand{display:flex;align-items:center;gap:10px;padding:4px 6px 15px;border-bottom:1px solid var(--border)}.tkp-logo{width:38px;height:38px;border:1px solid var(--gold);border-radius:10px;display:grid;place-items:center;color:var(--gold);font-weight:900;letter-spacing:-1px}.tkp-brand b{font-size:13px;letter-spacing:.5px}.tkp-brand span{color:var(--gold)}.tkp-brand small{display:block;color:#657287;font-size:8px;margin-top:4px;letter-spacing:.7px}.tkp-user{display:flex;gap:9px;align-items:center;padding:13px 6px}.tkp-avatar{width:34px;height:34px;border-radius:50%;border:1px solid #334155;background:#111923;display:grid;place-items:center;color:var(--gold);font-weight:800;font-size:10px}.tkp-user b{display:block;font-size:10px}.tkp-user small{display:block;font-size:8px;margin-top:3px}.tkp-side nav{display:grid;gap:3px}.tkp-side nav button{border:1px solid transparent;background:transparent;color:#8591A4;border-radius:7px;padding:9px 8px;text-align:left;font-size:10px;cursor:pointer}.tkp-side nav button:hover,.tkp-side nav button.active{color:var(--gold);background:rgba(245,185,66,.08);border-color:rgba(245,185,66,.16)}.tkp-side nav button span{display:inline-block;width:23px}.tkp-quote{margin:15px 3px;padding:12px;border:1px solid var(--border);border-radius:9px;background:#0B121B}.tkp-quote b{color:var(--gold);font-size:8px;letter-spacing:.6px}.tkp-quote p{font-size:9px;line-height:1.55;color:#B9C3D1;margin:7px 0}.tkp-main{flex:1;min-width:0}.tkp-top{height:57px;position:sticky;top:0;z-index:20;display:flex;justify-content:space-between;align-items:center;padding:0 18px;background:rgba(7,11,18,.96);border-bottom:1px solid var(--border);backdrop-filter:blur(12px)}.tkp-top b{font-size:12px;letter-spacing:.7px}.tkp-top select{background:#0E151F;color:var(--text);border:1px solid #2A3749;border-radius:7px;padding:8px 10px;font-size:10px}.tkp-live{display:inline-block;margin-left:9px;padding:5px 8px;border-radius:999px;color:#86EFAC;background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.2);font-size:8px}.tkp-content{max-width:1540px;margin:auto;padding:14px}.tkp-panel{background:linear-gradient(145deg,#111923,#0C121A);border:1px solid var(--border);border-radius:9px;overflow:hidden;scroll-margin-top:72px}.tkp-head{min-height:42px;padding:0 11px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}.tkp-head b{font-size:10px;display:flex;gap:7px;align-items:center}.tkp-head i{font-style:normal;color:var(--gold);background:rgba(245,185,66,.09);padding:4px 6px;border-radius:5px}.tkp-card{padding:12px}.tkp-card>span,.tkp-lock-card span{display:block;color:var(--muted);font-size:8px;letter-spacing:.7px;text-transform:uppercase}.tkp-big{display:block;font-size:23px;font-weight:850;letter-spacing:-.6px;margin-top:5px}.tkp-row{display:flex;justify-content:space-between;gap:10px;margin-top:8px;color:var(--muted);font-size:9px}.tkp-row b{color:#DDE5EE}.tkp-mini{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:9px}.tkp-mini div{border-top:1px solid #1B2635;padding-top:7px}.tkp-mini small{display:block;color:var(--muted);font-size:8px}.tkp-mini b{display:block;font-size:10px;margin-top:3px}.tkp-overview{display:grid;grid-template-columns:1.2fr 1.2fr .9fr .9fr;gap:8px;margin-bottom:8px}.tkp-bar{height:5px;background:#182331;border-radius:99px;overflow:hidden;margin-top:9px}.tkp-bar span{display:block;height:100%;background:var(--gold);border-radius:99px}.tkp-bar span.green{background:var(--green)}.tkp-bar span.red{background:var(--red)}.green{color:#4ADE80!important}.red{color:#F87171!important}.gold{color:var(--gold)!important}.muted{color:var(--muted)!important}.tkp-grid{display:grid;grid-template-columns:minmax(0,1.8fr) minmax(270px,.72fr);gap:8px}.tkp-charthead{display:flex;align-items:center;justify-content:space-between;padding:9px 11px;border-bottom:1px solid var(--border);font-size:11px}.tkp-time{display:flex;gap:3px;flex-wrap:wrap}.tkp-time button{border:0;background:#111923;color:#7F8CA0;border-radius:5px;padding:5px 7px;font-size:8px;cursor:pointer}.tkp-time button.active{color:var(--gold);background:rgba(245,185,66,.09);outline:1px solid rgba(245,185,66,.2)}.tkp-chart{height:455px;background:#070B12}.tkp-tv{height:100%;width:100%}.tkp-stack{display:grid;gap:8px}.tkp-market button{width:100%;display:grid;grid-template-columns:1fr auto;gap:8px;text-align:left;border:0;border-bottom:1px solid #172231;background:transparent;color:var(--text);padding:10px 11px;cursor:pointer}.tkp-market button:last-child{border-bottom:0}.tkp-market b{font-size:9px}.tkp-market small{display:block;color:var(--muted);font-size:7.5px;margin-top:3px}.tkp-market span{font-size:7px;align-self:center}.tkp-alert{display:flex;gap:8px;padding:9px 11px;border-bottom:1px solid #172231}.tkp-alert:last-child{border-bottom:0}.tkp-alert i{width:22px;height:22px;border-radius:5px;display:grid;place-items:center;font-style:normal;font-size:9px}.tkp-alert b{font-size:8.5px}.tkp-alert small{display:block;color:var(--muted);font-size:7.5px;margin-top:3px}.danger i{background:rgba(239,68,68,.1);color:#F87171}.warning i{background:rgba(245,185,66,.1);color:#FBBF24}.tkp-motivation{padding:13px;border:1px solid rgba(245,185,66,.2);border-radius:9px;background:linear-gradient(145deg,rgba(245,185,66,.09),#0E151F)}.tkp-motivation b{font-size:10px;line-height:1.5}.tkp-motivation small{display:block;color:var(--muted);font-size:8px;margin-top:7px}.tkp-lower{display:grid;grid-template-columns:.78fr 1.45fr .77fr;gap:8px;margin-top:8px}.tkp-body{padding:11px}.tkp-fields{display:grid;grid-template-columns:1fr 1fr;gap:8px}.tkp-fields label,.tkp-form label{display:block;color:var(--muted);font-size:8px}.tkp-fields input,.tkp-form input,.tkp-form select{width:100%;margin-top:5px;background:#0A111A;color:var(--text);border:1px solid #263447;border-radius:6px;padding:8px;font-size:10px;outline:none}.tkp-fields input:focus,.tkp-form input:focus,.tkp-form select:focus{border-color:rgba(245,185,66,.65);box-shadow:0 0 0 3px rgba(245,185,66,.06)}.tkp-result{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px;padding:9px;background:#0A111A;border:1px solid #1E2B3B;border-radius:7px}.tkp-result span{display:block;color:var(--muted);font-size:8px}.tkp-result b{display:block;margin-top:4px;font-size:12px}.tkp-primary{border:0;border-radius:6px;background:var(--gold);color:#080D14;padding:9px 11px;font-size:9px;font-weight:900;cursor:pointer}.tkp-primary:hover{filter:brightness(1.05)}.tkp-full{width:100%;margin-top:9px}.tkp-form{padding:9px;border-bottom:1px solid var(--border)}.tkp-formgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;align-items:end}.tkp-formgrid button{height:33px}.tkp-tablewrap{overflow:auto}table{width:100%;border-collapse:collapse;min-width:650px}th{font-size:7px;color:#657287;text-align:left;padding:7px;border-bottom:1px solid #1B2635}td{font-size:8px;padding:8px;border-bottom:1px solid #172231;white-space:nowrap}.delete{border:0;background:rgba(239,68,68,.08);color:#F87171;border-radius:5px;width:24px;height:22px;cursor:pointer}.tkp-check{display:grid;gap:6px;padding:10px}.tkp-check label{display:flex;gap:7px;align-items:center;padding:8px;border:1px solid #1A2634;background:#0A111A;border-radius:6px;color:#B8C2D0;font-size:8.5px}.tkp-check input{accent-color:var(--gold)}.tkp-score{font-size:26px;color:var(--gold);font-weight:900}.tkp-bottom{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}.tkp-guidance{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;padding:10px}.tkp-guidance>div{padding:10px;border:1px solid #1E2B3B;background:#0A111A;border-radius:7px}.tkp-guidance b{font-size:8px;color:var(--gold)}.tkp-guidance p{margin:5px 0 0;color:#AAB5C5;font-size:8px;line-height:1.5}.tkp-empty{text-align:center;padding:16px;color:#657287;font-size:9px}.tkp-notice{padding:9px 11px;border:1px solid rgba(245,185,66,.25);background:rgba(245,185,66,.06);color:#FDE68A;border-radius:7px;font-size:9px;margin-bottom:9px}
.tkp-locked-root{min-height:calc(100vh - 60px);display:grid;place-items:center;padding:30px 16px}.tkp-locked-wrap{width:min(980px,100%)}.tkp-locked-brand{display:flex;align-items:center;gap:10px;margin-bottom:25px}.tkp-locked-brand b{font-size:15px}.tkp-locked-brand span{color:var(--gold)}.tkp-locked-brand small{display:block;color:#657287;font-size:8px;letter-spacing:1px;margin-top:4px}.tkp-lock-hero{display:flex;gap:18px;align-items:flex-start;padding:25px;border:1px solid var(--border);border-radius:14px;background:linear-gradient(145deg,#111923,#0A1018);box-shadow:0 25px 70px rgba(0,0,0,.25)}.tkp-lock-icon{width:50px;height:50px;border-radius:12px;display:grid;place-items:center;background:rgba(245,185,66,.08);border:1px solid rgba(245,185,66,.2);font-size:20px}.tkp-eyebrow{font-size:8px;letter-spacing:1px;color:var(--gold);font-weight:800}.tkp-lock-hero h1{font-size:27px;letter-spacing:-.5px;margin:5px 0 7px}.tkp-lock-hero p{color:var(--muted);font-size:11px;line-height:1.6;margin:0;max-width:700px}.tkp-lock-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:10px 0}.tkp-lock-card{padding:14px;border:1px solid var(--border);border-radius:9px;background:#0D141D}.tkp-lock-card strong{display:block;margin-top:6px;font-size:17px}.tkp-payment{display:flex;justify-content:space-between;gap:20px;align-items:center;margin-top:10px;padding:20px;border:1px solid rgba(245,185,66,.28);border-radius:12px;background:linear-gradient(145deg,rgba(245,185,66,.08),#0D141D)}.tkp-payment h2{font-size:18px;margin:5px 0}.tkp-payment p{color:var(--muted);font-size:10px;line-height:1.6;margin:0}.tkp-paybox{min-width:230px}.tkp-price{font-size:25px;font-weight:900;color:var(--gold);margin-bottom:8px}.tkp-price small{font-size:9px;color:var(--muted);font-weight:600}.tkp-paybox input{width:100%;background:#0A111A;color:var(--text);border:1px solid #263447;border-radius:7px;padding:10px;font-size:10px;margin-bottom:7px}.tkp-paybox button{width:100%;border:0;background:var(--gold);color:#080D14;border-radius:7px;padding:10px;font-size:9px;font-weight:900;cursor:pointer}.tkp-paybox button:disabled{opacity:.65;cursor:wait}.tkp-lock-note{text-align:center;color:#657287;font-size:8px;margin-top:10px}
@media(max-width:1180px){.tkp-overview{grid-template-columns:1fr 1fr}.tkp-grid{grid-template-columns:1fr}.tkp-stack{grid-template-columns:repeat(3,1fr)}.tkp-lower{grid-template-columns:1fr 1fr}.tkp-bottom{grid-template-columns:1fr}.tkp-formgrid{grid-template-columns:1fr 1fr}}
@media(max-width:820px){.tkp-side{width:180px;flex-basis:180px}.tkp-chart{height:390px}.tkp-stack{grid-template-columns:1fr}.tkp-guidance{grid-template-columns:1fr}.tkp-payment{flex-direction:column;align-items:stretch}.tkp-paybox{min-width:0}.tkp-lock-grid{grid-template-columns:1fr 1fr}}
@media(max-width:560px){.tkp-overview{grid-template-columns:1fr}.tkp-top{padding:0 10px}.tkp-top b{font-size:10px}.tkp-live{display:none}.tkp-content{padding:7px}.tkp-chart{height:340px}.tkp-lower{grid-template-columns:1fr}.tkp-formgrid{grid-template-columns:1fr}.tkp-lock-hero{padding:18px}.tkp-lock-hero h1{font-size:21px}.tkp-lock-grid{grid-template-columns:1fr 1fr}.tkp-lock-card strong{font-size:14px}}
`;
