import { useEffect, useMemo, useState } from 'react';
import { openCashfreeCheckout, PREMIUM_PRICE_INR } from '../utils/payment';

const MISSION_KEY = 'trader_kavach_mission';
const JOURNAL_KEY = 'trader_kavach_journal';

const navItems = [
  ['overview', '▦', 'Dashboard'],
  ['market', '◌', 'Market Watch'],
  ['calculator', '⌁', 'Calculator'],
  ['journal', '▤', 'Trade Journal'],
  ['mission', '◆', 'Trading Mission'],
  ['analytics', '⌁', 'Performance'],
  ['risk', '♢', 'Risk Management'],
  ['chart', '◫', 'TradingView'],
  ['premium', '♛', 'Premium'],
  ['settings', '⚙', 'Settings'],
];

const ticker = [
  { symbol: 'XAUUSD', price: 'Live', change: 'TradingView', tone: 'gold' },
  { symbol: 'EURUSD', price: 'Live', change: 'TradingView', tone: 'blue' },
  { symbol: 'BTCUSD', price: 'Live', change: 'TradingView', tone: 'green' },
];

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function money(value) {
  return '₹' + Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function signedMoney(value) {
  const n = Number(value || 0);
  return (n >= 0 ? '+' : '-') + money(Math.abs(n));
}

function getMissionDay(startDate, totalDays) {
  if (!startDate || !totalDays) return 0;
  const start = new Date(startDate + 'T00:00:00');
  const today = new Date(getToday() + 'T00:00:00');
  const difference = Math.floor((today.getTime() - start.getTime()) / 86400000) + 1;
  return Math.max(0, Math.min(difference, Number(totalDays)));
}

function calculateLots(balance, riskPercent, stopLossPips) {
  const b = Number(balance);
  const r = Number(riskPercent);
  const sl = Number(stopLossPips);
  if (!b || !r || !sl || b <= 0 || r <= 0 || sl <= 0) return 0.01;
  const riskMoney = b * (r / 100);
  return Math.min(100, Math.max(0.01, riskMoney / (sl * 10)));
}

function createJournalEntry() {
  return { id: Date.now(), date: getToday(), symbol: 'XAUUSD', direction: 'BUY', result: 'PROFIT', amount: '', note: '' };
}

function Panel({ children, className = '', style = {} }) {
  return <div className={`tk-panel ${className}`} style={style}>{children}</div>;
}

function IconBox({ children, tone = 'gold' }) {
  return <div className={`tk-icon ${tone}`}>{children}</div>;
}

function StatCard({ label, value, sub, tone = '' }) {
  return (
    <div className={`tk-stat ${tone}`}>
      <div className="tk-stat-label">{label}</div>
      <div className="tk-stat-value">{value}</div>
      {sub && <div className="tk-stat-sub">{sub}</div>}
    </div>
  );
}

function Button({ children, onClick, variant = 'primary', disabled = false, className = '' }) {
  return <button className={`tk-btn tk-btn-${variant} ${className}`} onClick={onClick} disabled={disabled}>{children}</button>;
}

function Field({ label, value, onChange, type = 'number', step = '1', placeholder = '' }) {
  return (
    <label className="tk-field">
      <span>{label}</span>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} step={step} placeholder={placeholder} />
    </label>
  );
}

function MiniChart({ values = [2, 5, 3, 8, 6, 10, 8, 12, 10, 15] }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const points = values.map((v, i) => {
    const x = 8 + (i * 184) / Math.max(1, values.length - 1);
    const y = 88 - ((v - min) / Math.max(1, max - min)) * 68;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg className="tk-chart" viewBox="0 0 200 100" preserveAspectRatio="none" aria-label="Performance chart">
      <defs>
        <linearGradient id="tkArea" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity=".28" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M ${points.split(' ').join(' L ')} L 192,96 L 8,96 Z`} fill="url(#tkArea)" />
      <polyline points={points} fill="none" stroke="#F59E0B" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Dashboard({ user, isPremium, onPremiumActivated }) {
  const [balance, setBalance] = useState(10000);
  const [risk, setRisk] = useState(2);
  const [sl, setSl] = useState(30);
  const [mission, setMission] = useState(null);
  const [journal, setJournal] = useState([]);
  const [journalForm, setJournalForm] = useState(createJournalEntry());
  const [paying, setPaying] = useState(false);
  const [notice, setNotice] = useState('');
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [activeSection, setActiveSection] = useState('overview');
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    try {
      const savedMission = JSON.parse(localStorage.getItem(MISSION_KEY) || 'null');
      const savedJournal = JSON.parse(localStorage.getItem(JOURNAL_KEY) || '[]');
      if (savedMission) {
        setMission(savedMission);
        setBalance(Number(savedMission.startingCapital) || 10000);
      }
      if (Array.isArray(savedJournal)) setJournal(savedJournal);
    } catch (error) {
      console.error('Trader Kavach local data load failed:', error);
    }
  }, []);

  useEffect(() => {
    setPhone(user?.phoneNumber || '');
  }, [user?.phoneNumber]);

  useEffect(() => {
    const handleStorage = () => {
      try {
        const savedMission = JSON.parse(localStorage.getItem(MISSION_KEY) || 'null');
        const savedJournal = JSON.parse(localStorage.getItem(JOURNAL_KEY) || '[]');
        setMission(savedMission);
        if (Array.isArray(savedJournal)) setJournal(savedJournal);
      } catch (error) {
        console.error('Storage update failed:', error);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const lots = useMemo(() => calculateLots(balance, risk, sl), [balance, risk, sl]);
  const missionDay = mission ? getMissionDay(mission.startDate, mission.days) : 0;
  const totalDays = Number(mission?.days || 0);
  const dailyTarget = Number(mission?.dailyTarget || 0);
  const dailyLossLimit = Number(mission?.dailyLossLimit || 0);
  const profitRequired = Number(mission?.profitRequired || 0);

  const todayEntries = journal.filter(entry => entry.date === getToday());
  const todayProfit = todayEntries.reduce((total, entry) => {
    const amount = Number(entry.amount) || 0;
    return entry.result === 'PROFIT' ? total + amount : total - amount;
  }, 0);
  const totalProfit = journal.reduce((total, entry) => {
    const amount = Number(entry.amount) || 0;
    return entry.result === 'PROFIT' ? total + amount : total - amount;
  }, 0);
  const wins = journal.filter(t => t.result === 'PROFIT').length;
  const losses = journal.filter(t => t.result === 'LOSS').length;
  const winRate = journal.length ? (wins / journal.length) * 100 : 0;
  const grossProfit = journal.filter(t => t.result === 'PROFIT').reduce((a, t) => a + Number(t.amount || 0), 0);
  const grossLoss = journal.filter(t => t.result === 'LOSS').reduce((a, t) => a + Number(t.amount || 0), 0);
  const profitFactor = grossLoss ? grossProfit / grossLoss : grossProfit ? Infinity : 0;
  const remainingTarget = Math.max(0, dailyTarget - todayProfit);
  const dailyLossUsed = Math.max(0, -todayProfit);
  const progressPercent = dailyTarget > 0 ? Math.min(100, Math.max(0, (todayProfit / dailyTarget) * 100)) : 0;
  const currentBalance = Number(balance || 0) + totalProfit;
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Trader';

  let motivation = 'Follow the plan. Do not trade every candle.';
  if (todayProfit > 0) motivation = dailyTarget > 0 && todayProfit >= dailyTarget ? 'Daily target achieved. Stop unnecessary trading and protect your capital.' : 'You are in profit. Control greed and wait for the next quality setup.';
  if (todayProfit < 0) motivation = 'You are in loss. Do not revenge trade. Respect your daily risk limit.';

  function selectSection(section) {
    setActiveSection(section);
    setMobileNav(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function saveJournalEntry() {
    const amount = Number(journalForm.amount);
    if (!amount || amount <= 0) {
      setNotice('Enter a valid trade amount.');
      return;
    }
    const entry = { ...journalForm, id: Date.now(), amount, date: getToday() };
    const updated = [entry, ...journal];
    setJournal(updated);
    localStorage.setItem(JOURNAL_KEY, JSON.stringify(updated));
    setJournalForm(createJournalEntry());
    setNotice('Trade saved to journal.');
  }

  function deleteJournalEntry(id) {
    const updated = journal.filter(entry => entry.id !== id);
    setJournal(updated);
    localStorage.setItem(JOURNAL_KEY, JSON.stringify(updated));
  }

  async function upgrade() {
    if (!phone || phone.replace(/\D/g, '').length !== 10) {
      setNotice('Enter a valid 10-digit mobile number for Cashfree checkout.');
      return;
    }
    try {
      setNotice('');
      setPaying(true);
      await openCashfreeCheckout({
        user,
        phone: phone.replace(/\D/g, ''),
        onSuccess: () => {
          setNotice('Cashfree checkout complete. Premium verification started.');
          if (onPremiumActivated) onPremiumActivated();
        },
        onError: error => setNotice(error?.message || 'Payment process failed.'),
      });
    } catch (error) {
      setNotice(error?.message || 'Payment process failed.');
    } finally {
      setPaying(false);
    }
  }

  const pageTitle = navItems.find(n => n[0] === activeSection)?.[2] || 'Dashboard';

  return (
    <div className="tk-root">
      <style>{`
        .tk-root{--bg:#0F172A;--surface:#141E33;--surface2:#182242;--border:#253352;--text:#ECEFF6;--mid:#9BA6BF;--low:#67718C;--gold:#F59E0B;--green:#22C55E;--red:#EF4444;min-height:calc(100vh - 60px);background:radial-gradient(900px 500px at 20% 0%,rgba(245,158,11,.06),transparent 60%),#0F172A;color:var(--text);font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif}
        .tk-root *{box-sizing:border-box}.tk-root button,.tk-root input,.tk-root select,.tk-root textarea{font:inherit}.tk-root button{cursor:pointer}
        .tk-layout{display:flex;min-height:calc(100vh - 60px)}
        .tk-sidebar{width:245px;flex:0 0 245px;border-right:1px solid #1E2A47;background:#0D1527;padding:18px 12px;position:sticky;top:0;height:calc(100vh - 60px);overflow:auto;z-index:20}
        .tk-brand{display:flex;align-items:center;gap:10px;padding:5px 8px 20px;border-bottom:1px solid #1E2A47;margin-bottom:14px}.tk-logo{width:38px;height:38px;border:1px solid #F59E0B;border-radius:11px;display:grid;place-items:center;background:#141E33;color:#F59E0B;font-weight:800;box-shadow:0 8px 24px rgba(245,158,11,.12)}.tk-brand-name{font-family:'Space Grotesk',Inter,sans-serif;font-size:15px;font-weight:700}.tk-brand-name span{color:#F59E0B}.tk-brand-sub{font-size:10px;color:#67718C;margin-top:3px}
        .tk-user{display:flex;align-items:center;gap:10px;padding:10px 8px 14px}.tk-avatar{width:36px;height:36px;border-radius:50%;background:#182242;border:1px solid #334466;display:grid;place-items:center;color:#F59E0B;font-weight:700}.tk-user-name{font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tk-user-plan{font-size:10.5px;color:${isPremium ? '#22C55E' : '#9BA6BF'};margin-top:2px}
        .tk-nav{display:flex;flex-direction:column;gap:4px}.tk-nav-btn{width:100%;border:1px solid transparent;background:transparent;color:#9BA6BF;padding:10px 11px;border-radius:7px;text-align:left;display:flex;align-items:center;gap:11px;font-size:12.5px;font-weight:500}.tk-nav-btn:hover{background:#171F38;color:#ECEFF6}.tk-nav-btn.active{background:rgba(245,158,11,.10);border-color:rgba(245,158,11,.18);color:#FBBF24}.tk-nav-icon{width:18px;text-align:center;font-size:15px}.tk-premium-nav{margin-top:10px;border-top:1px solid #1E2A47;padding-top:10px}
        .tk-main{flex:1;min-width:0}.tk-topbar{height:58px;border-bottom:1px solid #1E2A47;display:flex;align-items:center;justify-content:space-between;padding:0 22px;background:rgba(15,23,42,.94);position:sticky;top:0;z-index:15}.tk-top-left{display:flex;align-items:center;gap:12px}.tk-menu{display:none;border:0;background:transparent;color:#ECEFF6;font-size:20px}.tk-page-title{font-size:14px;font-weight:600}.tk-top-right{display:flex;align-items:center;gap:10px}.tk-rule{font-size:11.5px;color:#9BA6BF;border:0;background:transparent}.tk-rule:hover{color:#ECEFF6}.tk-risk-pill{font-size:11px;padding:6px 9px;border-radius:999px;border:1px solid #2B3A5C;color:#9BA6BF}.tk-risk-pill.good{border-color:rgba(34,197,94,.28);color:#86EFAC;background:rgba(34,197,94,.07)}.tk-risk-pill.warn{border-color:rgba(245,158,11,.3);color:#FCD34D;background:rgba(245,158,11,.07)}.tk-content{padding:22px;max-width:1500px;margin:0 auto}.tk-notice{margin-bottom:14px;padding:10px 12px;border:1px solid #334466;background:#141E33;border-radius:7px;color:#C7CEDE;font-size:12.5px}
        .tk-heading{display:flex;justify-content:space-between;align-items:flex-end;gap:18px;margin-bottom:18px}.tk-eyebrow{font-size:10.5px;letter-spacing:1.2px;color:#F59E0B;font-weight:700}.tk-heading h1{font-family:'Space Grotesk',Inter,sans-serif;font-size:25px;line-height:1.15;margin:5px 0 5px}.tk-heading p{margin:0;color:#8590AA;font-size:12.5px}.tk-heading-actions{display:flex;gap:8px}
        .tk-btn{border-radius:6px;border:1px solid #334466;padding:9px 13px;font-size:12px;font-weight:600;transition:.15s}.tk-btn:hover{filter:brightness(1.08);transform:translateY(-1px)}.tk-btn:disabled{opacity:.55;cursor:not-allowed;transform:none}.tk-btn-primary{background:#F59E0B;border-color:#F59E0B;color:#111827}.tk-btn-secondary{background:#182242;color:#ECEFF6}.tk-btn-danger{background:rgba(239,68,68,.08);border-color:rgba(239,68,68,.3);color:#FCA5A5}
        .tk-grid{display:grid;gap:14px}.tk-stats{grid-template-columns:repeat(4,1fr);margin-bottom:14px}.tk-stat{background:#141E33;border:1px solid #253352;border-radius:8px;padding:14px;min-height:98px}.tk-stat-label{font-size:10.5px;color:#67718C}.tk-stat-value{font-family:'IBM Plex Mono',monospace;font-size:20px;font-weight:600;margin-top:9px}.tk-stat-sub{font-size:10.5px;color:#22C55E;margin-top:6px}.tk-stat.red .tk-stat-sub{color:#EF4444}.tk-stat.gold .tk-stat-value{color:#FBBF24}
        .tk-panel{background:#141E33;border:1px solid #253352;border-radius:8px;padding:16px}.tk-panel-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}.tk-panel-title{font-size:14px;font-weight:600}.tk-panel-sub{font-size:11px;color:#67718C;margin-top:4px}.tk-badge{font-size:10px;padding:5px 8px;border-radius:999px;background:#182242;border:1px solid #2B3A5C;color:#9BA6BF;white-space:nowrap}
        .tk-market-strip{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px}.tk-market{background:#101A2E;border:1px solid #253352;border-radius:7px;padding:12px;display:flex;justify-content:space-between;align-items:center}.tk-market-name{font-size:11px;color:#9BA6BF}.tk-market-price{font-family:'IBM Plex Mono',monospace;font-size:13px;margin-top:4px}.tk-market-change{font-size:10px;color:#22C55E}.tk-market-change.live{color:#F59E0B}.tk-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:#22C55E;margin-right:5px}
        .tk-two{grid-template-columns:1.35fr .85fr}.tk-chart-wrap{height:250px}.tk-chart{width:100%;height:100%;display:block}.tk-chart-labels{display:flex;justify-content:space-between;color:#67718C;font-size:9px;margin-top:4px}.tk-trades{display:flex;flex-direction:column}.tk-trade-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 0;border-bottom:1px solid #1E2A47}.tk-trade-row:last-child{border-bottom:0}.tk-trade-symbol{font-size:11.5px;font-weight:600}.tk-trade-meta{font-size:9.5px;color:#67718C;margin-top:3px}.tk-profit{font-family:'IBM Plex Mono',monospace;font-size:11px;color:#22C55E}.tk-loss{font-family:'IBM Plex Mono',monospace;font-size:11px;color:#EF4444}
        .tk-premium-banner{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-top:14px;background:linear-gradient(100deg,#171F30,#152A2A);border:1px solid #2B4C45;border-radius:8px;padding:15px}.tk-premium-banner h3{margin:3px 0;font-size:13px}.tk-premium-banner p{margin:0;color:#8590AA;font-size:10.5px}.tk-crown{font-size:28px;color:#F59E0B}
        .tk-form-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.tk-field{display:flex;flex-direction:column;gap:6px}.tk-field span{font-size:10.5px;color:#9BA6BF}.tk-field input,.tk-field select,.tk-field textarea{width:100%;background:#0F172A;color:#ECEFF6;border:1px solid #253352;border-radius:6px;padding:10px 11px;outline:none;font-size:12px}.tk-field textarea{min-height:90px;resize:vertical}.tk-field input:focus,.tk-field select:focus,.tk-field textarea:focus{border-color:#F59E0B;box-shadow:0 0 0 3px rgba(245,158,11,.1)}.tk-form-actions{display:flex;gap:8px;margin-top:14px}.tk-result-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px}.tk-result{background:#101A2E;border:1px solid #253352;border-radius:7px;padding:13px}.tk-result span{display:block;color:#67718C;font-size:10px}.tk-result strong{display:block;font-family:'IBM Plex Mono',monospace;font-size:17px;margin-top:7px}.tk-result small{display:block;color:#67718C;font-size:9.5px;margin-top:4px}
        .tk-mission-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.tk-detail{background:#101A2E;border:1px solid #253352;border-radius:7px;padding:12px}.tk-detail span{display:block;color:#67718C;font-size:10px}.tk-detail strong{display:block;font-size:13px;margin-top:6px}.tk-progress{height:7px;background:#0C1425;border-radius:999px;overflow:hidden;margin:15px 0 7px}.tk-progress-fill{height:100%;background:#F59E0B;border-radius:999px}.tk-progress-label{font-size:10px;color:#67718C}.tk-motivation{margin-top:14px;border-left:3px solid #F59E0B;background:#101A2E;padding:12px 14px;border-radius:0 6px 6px 0}.tk-motivation b{display:block;font-size:10px;color:#F59E0B;letter-spacing:.8px}.tk-motivation span{display:block;font-size:12px;margin-top:5px;color:#C7CEDE}
        .tk-table-wrap{overflow:auto}.tk-table{width:100%;border-collapse:collapse;min-width:700px}.tk-table th,.tk-table td{text-align:left;padding:10px;border-bottom:1px solid #1E2A47;font-size:10.5px;white-space:nowrap}.tk-table th{color:#67718C;font-weight:600}.tk-table td{color:#C7CEDE}.tk-side-badge{display:inline-block;padding:4px 7px;border-radius:999px;font-size:9px}.tk-side-badge.buy{background:rgba(34,197,94,.08);color:#86EFAC;border:1px solid rgba(34,197,94,.2)}.tk-side-badge.sell{background:rgba(239,68,68,.08);color:#FCA5A5;border:1px solid rgba(239,68,68,.2)}
        .tk-risk-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.tk-risk-meter{height:10px;background:#0C1425;border-radius:999px;overflow:hidden;margin-top:12px}.tk-risk-meter-fill{height:100%;background:#22C55E}.tk-list{margin:0;padding:0;list-style:none}.tk-list li{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #1E2A47;font-size:11px}.tk-list li:last-child{border-bottom:0}.tk-green{color:#22C55E}.tk-red{color:#EF4444}.tk-gold{color:#F59E0B}
        .tk-chart-frame{height:520px;overflow:hidden;padding:0}.tk-chart-frame iframe{width:100%;height:100%;border:0}.tk-premium-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;max-width:850px}.tk-price{font-family:'IBM Plex Mono',monospace;font-size:32px;font-weight:600;margin:8px 0}.tk-price span{font-family:Inter,sans-serif;font-size:12px;color:#67718C}.tk-feature-list{list-style:none;margin:14px 0;padding:0}.tk-feature-list li{padding:7px 0;color:#C7CEDE;font-size:11.5px;border-bottom:1px solid #1E2A47}.tk-feature-list li::before{content:'✓';color:#22C55E;margin-right:8px}.tk-phone{margin:12px 0}.tk-phone input{width:100%;background:#0F172A;color:#ECEFF6;border:1px solid #253352;border-radius:6px;padding:10px}
        .tk-settings{max-width:620px}.tk-setting-row{display:flex;justify-content:space-between;align-items:center;padding:13px 0;border-bottom:1px solid #1E2A47}.tk-setting-row span{font-size:12px}.tk-toggle{width:38px;height:20px;border-radius:999px;background:#2B3A5C;position:relative}.tk-toggle.on{background:#F59E0B}.tk-toggle i{position:absolute;width:16px;height:16px;top:2px;left:2px;border-radius:50%;background:#0F172A;transition:.15s}.tk-toggle.on i{left:20px}.tk-footer{padding:28px 22px 45px;color:#4F5C78;font-size:10px;text-align:center}
        @media(max-width:1050px){.tk-sidebar{width:210px;flex-basis:210px}.tk-stats{grid-template-columns:repeat(2,1fr)}.tk-two{grid-template-columns:1fr}.tk-form-grid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:760px){.tk-sidebar{display:none}.tk-menu{display:block}.tk-content{padding:16px}.tk-topbar{padding:0 14px}.tk-rule{display:none}.tk-market-strip{grid-template-columns:1fr}.tk-stats{grid-template-columns:1fr 1fr}.tk-form-grid,.tk-result-grid,.tk-risk-grid,.tk-premium-grid,.tk-mission-grid{grid-template-columns:1fr}.tk-heading{align-items:flex-start;flex-direction:column}.tk-heading-actions{width:100%}.tk-heading-actions .tk-btn{flex:1}.tk-mobile-nav{display:flex!important}.tk-top-right{gap:5px}.tk-risk-pill{font-size:9px}}
        .tk-mobile-nav{display:none;position:fixed;inset:58px 0 0 0;background:#0F172A;z-index:14;padding:12px;overflow:auto;flex-direction:column;gap:4px}.tk-mobile-nav .tk-nav-btn{padding:12px}.tk-empty{padding:30px;text-align:center;color:#67718C;font-size:12px}
      `}</style>

      <div className="tk-layout">
        <aside className="tk-sidebar">
          <div className="tk-brand"><div className="tk-logo">TK</div><div><div className="tk-brand-name">Trader <span>Kavach</span></div><div className="tk-brand-sub">Calculate. Control. Trade.</div></div></div>
          <div className="tk-user"><div className="tk-avatar">{displayName.slice(0,1).toUpperCase()}</div><div style={{minWidth:0}}><div className="tk-user-name">{displayName}</div><div className="tk-user-plan">{isPremium ? 'Premium Member' : 'Free Plan'}</div></div></div>
          <nav className="tk-nav">
            {navItems.map(([key, icon, label], index) => (
              <button key={key} className={`tk-nav-btn ${activeSection === key ? 'active' : ''} ${index === 8 ? 'tk-premium-nav' : ''}`} onClick={() => selectSection(key)}><span className="tk-nav-icon">{icon}</span>{label}</button>
            ))}
          </nav>
        </aside>

        <div className="tk-main">
          <header className="tk-topbar">
            <div className="tk-top-left"><button className="tk-menu" onClick={() => setMobileNav(v => !v)}>☰</button><span className="tk-page-title">{pageTitle}</span></div>
            <div className="tk-top-right"><button className="tk-rule" onClick={() => setNotice('Before every trade: define risk, position size, stop-loss and maximum daily loss.')}>◈ Read Before You Trade</button><span className={`tk-risk-pill ${dailyLossLimit && dailyLossUsed >= dailyLossLimit ? 'warn' : 'good'}`}>Risk Status: {dailyLossLimit && dailyLossUsed >= dailyLossLimit ? 'STOP' : 'Within Limit'}</span></div>
          </header>

          {mobileNav && <div className="tk-mobile-nav">
            {navItems.map(([key, icon, label]) => <button key={key} className={`tk-nav-btn ${activeSection === key ? 'active' : ''}`} onClick={() => selectSection(key)}><span className="tk-nav-icon">{icon}</span>{label}</button>)}
          </div>}

          <main className="tk-content">
            {notice && <div className="tk-notice">{notice}</div>}

            {activeSection === 'overview' && (
              <>
                <div className="tk-heading"><div><div className="tk-eyebrow">TRADER CONTROL CENTER</div><h1>Welcome back, {displayName} 👋</h1><p>Discipline today. Freedom tomorrow.</p></div><div className="tk-heading-actions"><Button variant="secondary" onClick={() => selectSection('calculator')}>⌁ Calculate Risk</Button><Button onClick={() => selectSection('journal')}>＋ Add Trade</Button></div></div>
                <div className="tk-grid tk-stats">
                  <StatCard label="Account Balance" value={money(currentBalance)} sub={totalProfit >= 0 ? `${signedMoney(totalProfit)} overall` : `${signedMoney(totalProfit)} overall`} tone={totalProfit < 0 ? 'red' : 'gold'} />
                  <StatCard label="Today's P/L" value={signedMoney(todayProfit)} sub={todayProfit >= 0 ? 'Positive today' : 'Loss today'} tone={todayProfit < 0 ? 'red' : ''} />
                  <StatCard label="Win Rate" value={`${winRate.toFixed(2)}%`} sub={`${wins} wins / ${losses} losses`} />
                  <StatCard label="Total Trades" value={journal.length} sub={`${journal.length ? 'Journal active' : 'No trades yet'}`} />
                </div>
                <div className="tk-market-strip">
                  {ticker.map(item => <div className="tk-market" key={item.symbol}><div><div className="tk-market-name"><span className="tk-dot" />{item.symbol}</div><div className="tk-market-price">{item.price}</div></div><div className="tk-market-change live">{item.change}</div></div>)}
                </div>
                <div className="tk-grid tk-two">
                  <Panel><div className="tk-panel-head"><div><div className="tk-panel-title">Performance Overview</div><div className="tk-panel-sub">Journal-driven equity view</div></div><span className="tk-badge">All time</span></div><div className="tk-chart-wrap"><MiniChart /></div><div className="tk-chart-labels"><span>Start</span><span>Trades</span><span>Now</span></div></Panel>
                  <Panel><div className="tk-panel-head"><div><div className="tk-panel-title">Recent Trades</div><div className="tk-panel-sub">Latest journal activity</div></div><button className="tk-btn tk-btn-secondary" onClick={() => selectSection('journal')}>View All</button></div><div className="tk-trades">{journal.slice(0,5).map(t => <div className="tk-trade-row" key={t.id}><div><div className="tk-trade-symbol">{t.symbol} · {t.direction}</div><div className="tk-trade-meta">{t.date} · {t.note || 'Journal entry'}</div></div><span className={t.result === 'PROFIT' ? 'tk-profit' : 'tk-loss'}>{t.result === 'PROFIT' ? '+' : '-'}{money(t.amount).replace('₹','₹')}</span></div>)}{journal.length === 0 && <div className="tk-empty">No trades recorded yet.</div>}</div></Panel>
                </div>
                {!isPremium && <div className="tk-premium-banner"><div><div className="tk-eyebrow">PREMIUM</div><h3>Unlock your complete Trader Kavach system</h3><p>Advanced risk controls, analytics, planning and premium workflow for ₹99/month.</p></div><div style={{display:'flex',alignItems:'center',gap:14}}><span className="tk-crown">♛</span><Button onClick={() => selectSection('premium')}>Upgrade ₹99</Button></div></div>}
                {mission && <Panel style={{marginTop:14}}><div className="tk-panel-head"><div><div className="tk-panel-title">Trading Mission</div><div className="tk-panel-sub">Day {missionDay}/{totalDays} · {Math.round(progressPercent)}% of today's target</div></div><Button variant="secondary" onClick={() => selectSection('mission')}>Open Mission</Button></div><div className="tk-progress"><div className="tk-progress-fill" style={{width:`${progressPercent}%`}} /></div></Panel>}
              </>
            )}

            {activeSection === 'market' && <MarketView selectSection={selectSection} />}
            {activeSection === 'calculator' && <CalculatorView balance={balance} setBalance={setBalance} risk={risk} setRisk={setRisk} sl={sl} setSl={setSl} lots={lots} />}
            {activeSection === 'journal' && <JournalView journal={journal} journalForm={journalForm} setJournalForm={setJournalForm} saveJournalEntry={saveJournalEntry} deleteJournalEntry={deleteJournalEntry} />}
            {activeSection === 'mission' && <MissionView mission={mission} missionDay={missionDay} totalDays={totalDays} dailyTarget={dailyTarget} dailyLossLimit={dailyLossLimit} profitRequired={profitRequired} todayProfit={todayProfit} remainingTarget={remainingTarget} progressPercent={progressPercent} dailyLossUsed={dailyLossUsed} motivation={motivation} />}
            {activeSection === 'analytics' && <AnalyticsView journal={journal} winRate={winRate} wins={wins} losses={losses} profitFactor={profitFactor} totalProfit={totalProfit} />}
            {activeSection === 'risk' && <RiskView balance={balance} risk={risk} dailyLossLimit={dailyLossLimit} dailyLossUsed={dailyLossUsed} lots={lots} />}
            {activeSection === 'chart' && <ChartView />}
            {activeSection === 'premium' && <PremiumView isPremium={isPremium} phone={phone} setPhone={setPhone} paying={paying} notice={notice} upgrade={upgrade} />}
            {activeSection === 'settings' && <SettingsView user={user} isPremium={isPremium} />}
          </main>
          <div className="tk-footer">Trader Kavach · Risk-management and journaling tool · Educational use only. Trading involves risk of loss.</div>
        </div>
      </div>
    </div>
  );
}

function MarketView({ selectSection }) {
  const [symbol, setSymbol] = useState('XAUUSD');
  const data = [{s:'XAUUSD',p:'Live',c:'TradingView'},{s:'EURUSD',p:'Live',c:'TradingView'},{s:'BTCUSD',p:'Live',c:'TradingView'}];
  return <><div className="tk-heading"><div><div className="tk-eyebrow">MARKET WATCH</div><h1>Market Watch</h1><p>Keep your instruments visible before taking a trade.</p></div><Button variant="secondary" onClick={() => selectSection('chart')}>Open TradingView</Button></div><div className="tk-market-strip">{data.map(x=><div className="tk-market" key={x.s}><div><div className="tk-market-name"><span className="tk-dot" />{x.s}</div><div className="tk-market-price">{x.p}</div></div><div className="tk-market-change live">{x.c}</div></div>)}</div><Panel><div className="tk-panel-head"><div><div className="tk-panel-title">Instrument focus</div><div className="tk-panel-sub">Select a market for chart analysis.</div></div><span className="tk-badge">TradingView</span></div><select className="tk-field" value={symbol} onChange={e=>setSymbol(e.target.value)} style={{maxWidth:280,background:'#0F172A',color:'#ECEFF6',border:'1px solid #253352',padding:10,borderRadius:6}}><option>XAUUSD</option><option>EURUSD</option><option>BTCUSD</option></select><div style={{marginTop:14,color:'#67718C',fontSize:11}}>Current dashboard feed displays TradingView availability rather than inventing live prices.</div></Panel></>;
}

function CalculatorView({ balance, setBalance, risk, setRisk, sl, setSl, lots }) {
  const riskMoney = Number(balance || 0) * Number(risk || 0) / 100;
  return <><div className="tk-heading"><div><div className="tk-eyebrow">RISK ENGINE</div><h1>Position Size Calculator</h1><p>Calculate the position size before entering a trade.</p></div><span className="tk-badge">Generic FX assumption</span></div><Panel><div className="tk-form-grid"><Field label="Account Balance" value={balance} onChange={setBalance}/><Field label="Risk Per Trade (%)" value={risk} onChange={setRisk} step="0.1"/><Field label="Stop Loss (pips)" value={sl} onChange={setSl}/></div><div className="tk-result-grid"><div className="tk-result"><span>Risk Amount</span><strong>{money(riskMoney)}</strong><small>Maximum planned loss</small></div><div className="tk-result"><span>Recommended Lot Size</span><strong>{lots.toFixed(2)} lots</strong><small>Based on current inputs</small></div><div className="tk-result"><span>Risk %</span><strong>{Number(risk || 0).toFixed(2)}%</strong><small>Per trade</small></div></div><div style={{marginTop:14,padding:12,background:'#101A2E',border:'1px solid #253352',borderRadius:6,color:'#67718C',fontSize:10.5}}>⚠ Generic FX pip-value assumption. Verify broker contract specifications, especially for XAUUSD, before execution.</div></Panel></>;
}

function JournalView({ journal, journalForm, setJournalForm, saveJournalEntry, deleteJournalEntry }) {
  return <><div className="tk-heading"><div><div className="tk-eyebrow">TRADE JOURNAL</div><h1>Trade Journal</h1><p>Record the trade, review the result, improve the process.</p></div></div><Panel><div className="tk-form-grid"><Field label="Symbol" type="text" value={journalForm.symbol} onChange={v=>setJournalForm({...journalForm,symbol:v})}/><label className="tk-field"><span>Direction</span><select value={journalForm.direction} onChange={e=>setJournalForm({...journalForm,direction:e.target.value})}><option>BUY</option><option>SELL</option></select></label><label className="tk-field"><span>Result</span><select value={journalForm.result} onChange={e=>setJournalForm({...journalForm,result:e.target.value})}><option>PROFIT</option><option>LOSS</option></select></label><Field label="Amount" value={journalForm.amount} onChange={v=>setJournalForm({...journalForm,amount:v})} step="0.01"/><Field label="Trade Note" type="text" value={journalForm.note} onChange={v=>setJournalForm({...journalForm,note:v})} placeholder="Reason for trade"/></div><div className="tk-form-actions"><Button onClick={saveJournalEntry}>＋ Save Trade</Button><Button variant="secondary" onClick={()=>setJournalForm(createJournalEntry())}>Clear</Button></div></Panel><Panel style={{marginTop:14}}><div className="tk-panel-head"><div><div className="tk-panel-title">Journal History</div><div className="tk-panel-sub">{journal.length} trades recorded</div></div></div><div className="tk-table-wrap"><table className="tk-table"><thead><tr><th>Date</th><th>Symbol</th><th>Direction</th><th>Result</th><th>Amount</th><th>Note</th><th>Action</th></tr></thead><tbody>{journal.map(entry=><tr key={entry.id}><td>{entry.date}</td><td>{entry.symbol}</td><td><span className={`tk-side-badge ${entry.direction === 'SELL' ? 'sell' : 'buy'}`}>{entry.direction}</span></td><td className={entry.result==='PROFIT'?'tk-green':'tk-red'}>{entry.result}</td><td>{money(entry.amount)}</td><td>{entry.note || '—'}</td><td><Button variant="danger" onClick={()=>deleteJournalEntry(entry.id)}>Delete</Button></td></tr>)}{journal.length===0&&<tr><td colSpan="7" className="tk-empty">No trades recorded yet.</td></tr>}</tbody></table></div></Panel></>;
}

function MissionView({ mission, missionDay, totalDays, dailyTarget, dailyLossLimit, profitRequired, todayProfit, remainingTarget, progressPercent, dailyLossUsed, motivation }) {
  if (!mission) return <><div className="tk-heading"><div><div className="tk-eyebrow">TRADING MISSION</div><h1>Your Mission</h1><p>No active mission data was found in local storage.</p></div></div><Panel><div className="tk-empty">Set your Trading Mission from the main mission planner flow to see progress here.</div></Panel></>;
  return <><div className="tk-heading"><div><div className="tk-eyebrow">TRADING MISSION</div><h1>Day {missionDay} of {totalDays}</h1><p>Keep the target mathematical and the execution disciplined.</p></div></div><Panel><div className="tk-mission-grid"><div className="tk-detail"><span>Starting Capital</span><strong>{money(mission.startingCapital)}</strong></div><div className="tk-detail"><span>Target Capital</span><strong>{money(mission.targetCapital)}</strong></div><div className="tk-detail"><span>Total Profit Required</span><strong>{money(profitRequired)}</strong></div><div className="tk-detail"><span>Today's Target</span><strong>{money(dailyTarget)}</strong></div><div className="tk-detail"><span>Remaining Target</span><strong>{money(remainingTarget)}</strong></div><div className="tk-detail"><span>Daily Loss Limit</span><strong>{money(dailyLossLimit)}</strong></div></div><div className="tk-progress"><div className="tk-progress-fill" style={{width:`${progressPercent}%`}} /></div><div className="tk-progress-label">{Math.round(progressPercent)}% of today's target · Today's P/L {signedMoney(todayProfit)} · Loss used {money(dailyLossUsed)}</div><div className="tk-motivation"><b>TRADER MINDSET</b><span>{motivation}</span></div></Panel></>;
}

function AnalyticsView({ journal, winRate, wins, losses, profitFactor, totalProfit }) {
  const avg = journal.length ? totalProfit / journal.length : 0;
  return <><div className="tk-heading"><div><div className="tk-eyebrow">PERFORMANCE ANALYTICS</div><h1>Know Your Numbers</h1><p>Use actual journal data instead of judging performance from one trade.</p></div></div><div className="tk-grid tk-stats"><StatCard label="Total P/L" value={signedMoney(totalProfit)} sub={`${journal.length} trades`} tone={totalProfit<0?'red':'gold'}/><StatCard label="Win Rate" value={`${winRate.toFixed(2)}%`} sub={`${wins} wins / ${losses} losses`}/><StatCard label="Profit Factor" value={profitFactor===Infinity?'∞':profitFactor.toFixed(2)} sub="Gross profit ÷ gross loss"/><StatCard label="Average Trade" value={signedMoney(avg)} sub="Average journal result"/></div><Panel><div className="tk-panel-head"><div><div className="tk-panel-title">Equity Trend</div><div className="tk-panel-sub">Illustrative view of your recorded trade sequence.</div></div></div><div className="tk-chart-wrap"><MiniChart values={journal.length ? journal.slice().reverse().map((t,i)=>i + (t.result==='PROFIT'?2:-1)) : [2,3,2,5,4,7,6,8,9,11]} /></div></Panel></>;
}

function RiskView({ balance, risk, dailyLossLimit, dailyLossUsed, lots }) {
  const riskMoney = Number(balance||0)*Number(risk||0)/100;
  const usedPct = dailyLossLimit ? Math.min(100, dailyLossUsed/dailyLossLimit*100) : 0;
  const stop = dailyLossLimit > 0 && dailyLossUsed >= dailyLossLimit;
  return <><div className="tk-heading"><div><div className="tk-eyebrow">DISCIPLINE SYSTEM</div><h1>Risk Management</h1><p>Define the loss you are willing to accept before you define the trade.</p></div><span className={`tk-risk-pill ${stop?'warn':'good'}`}>{stop?'STOP TRADING':'WITHIN LIMIT'}</span></div><div className="tk-risk-grid"><Panel><div className="tk-panel-title">Current Trade Risk</div><ul className="tk-list"><li><span>Account Balance</span><strong>{money(balance)}</strong></li><li><span>Risk / Trade</span><strong>{Number(risk||0).toFixed(2)}%</strong></li><li><span>Risk Amount</span><strong>{money(riskMoney)}</strong></li><li><span>Suggested Lot</span><strong>{lots.toFixed(2)}</strong></li></ul></Panel><Panel><div className="tk-panel-title">Daily Loss Guard</div><div style={{marginTop:12,fontSize:12,color:'#9BA6BF'}}>Used {money(dailyLossUsed)} of {money(dailyLossLimit)}</div><div className="tk-risk-meter"><div className="tk-risk-meter-fill" style={{width:`${usedPct}%`,background:stop?'#EF4444':'#22C55E'}} /></div><div style={{marginTop:9,fontSize:10,color:'#67718C'}}>{dailyLossLimit ? `${usedPct.toFixed(1)}% of daily limit used` : 'Set a mission to activate a daily loss limit.'}</div></Panel></div></>;
}

function ChartView() {
  const [symbol, setSymbol] = useState('OANDA:XAUUSD');
  return <><div className="tk-heading"><div><div className="tk-eyebrow">TRADINGVIEW WORKSPACE</div><h1>Chart Analysis</h1><p>Chart is an option — calculation is the core.</p></div><select value={symbol} onChange={e=>setSymbol(e.target.value)} style={{background:'#0F172A',color:'#ECEFF6',border:'1px solid #253352',padding:'9px 12px',borderRadius:6}}><option value="OANDA:XAUUSD">XAUUSD</option><option value="OANDA:EURUSD">EURUSD</option><option value="BINANCE:BTCUSDT">BTCUSD</option></select></div><Panel className="tk-chart-frame"><iframe title="TradingView chart" src={`https://www.tradingview.com/widgetembed/?symbol=${symbol}&interval=60&theme=dark&style=1&hide_top_toolbar=0&hide_legend=0`} /></Panel></>;
}

function PremiumView({ isPremium, phone, setPhone, paying, upgrade }) {
  return <><div className="tk-heading"><div><div className="tk-eyebrow">TRADER KAVACH PREMIUM</div><h1>{isPremium ? 'Premium is active' : 'Unlock the complete system'}</h1><p>{isPremium ? 'Your premium access is controlled by verified subscription status.' : 'One workspace for risk, journal, analytics and disciplined execution.'}</p></div></div><div className="tk-premium-grid"><Panel><div className="tk-panel-title">Trader Kavach Premium</div><div className="tk-price">₹{PREMIUM_PRICE_INR}<span> / month</span></div><ul className="tk-feature-list"><li>Advanced risk controls</li><li>Unlimited trade journal</li><li>Performance analytics</li><li>Trading mission & planning</li><li>Market watch & TradingView workspace</li></ul>{isPremium ? <div style={{color:'#22C55E',fontSize:12}}>✓ Premium active</div> : <><div className="tk-phone"><input type="tel" inputMode="numeric" maxLength="10" value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,'').slice(0,10))} placeholder="10-digit mobile number" /></div><Button onClick={upgrade} disabled={paying}>{paying ? 'Opening Cashfree...' : `Pay ₹${PREMIUM_PRICE_INR} with Cashfree`}</Button></>}</Panel><Panel><div className="tk-panel-title">Payment & verification</div><p style={{fontSize:11.5,color:'#8590AA',lineHeight:1.7}}>Cashfree checkout is handled by the existing Trader Kavach payment flow. Premium access is not assumed merely from the checkout redirect; the subscription is verified by the backend.</p><div className="tk-detail" style={{marginTop:12}}><span>Plan</span><strong>Trader Kavach Monthly</strong></div><div className="tk-detail" style={{marginTop:8}}><span>Price</span><strong>₹{PREMIUM_PRICE_INR} / month</strong></div></Panel></div></>;
}

function SettingsView({ user, isPremium }) {
  const [rules, setRules] = useState(true);
  const [reminder, setReminder] = useState(false);
  return <><div className="tk-heading"><div><div className="tk-eyebrow">ACCOUNT SETTINGS</div><h1>Settings</h1><p>Simple controls for your trading workspace.</p></div></div><Panel className="tk-settings"><div className="tk-setting-row"><span>Account email</span><strong style={{fontSize:11,color:'#9BA6BF'}}>{user?.email || '—'}</strong></div><div className="tk-setting-row"><span>Premium status</span><strong style={{fontSize:11,color:isPremium?'#22C55E':'#9BA6BF'}}>{isPremium?'Active':'Free'}</strong></div><div className="tk-setting-row"><span>Pre-trade risk reminder</span><div className={`tk-toggle ${rules?'on':''}`} onClick={()=>setRules(!rules)}><i /></div></div><div className="tk-setting-row"><span>Daily journal reminder</span><div className={`tk-toggle ${reminder?'on':''}`} onClick={()=>setReminder(!reminder)}><i /></div></div></Panel></>;
}

export default Dashboard;
