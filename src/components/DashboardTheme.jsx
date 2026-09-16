import { useEffect, useState } from 'react';
import DashboardPro from './DashboardPro';

const THEME_KEY = 'trader_kavach_theme';

export default function DashboardTheme(props) {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    return 'dark';
  });

  useEffect(() => {
    try { localStorage.setItem(THEME_KEY, theme); } catch {}
  }, [theme]);

  const light = theme === 'light';

  return (
    <div className={`tkp-theme-shell ${light ? 'tkp-theme-light' : 'tkp-theme-dark'}`}>
      <style>{themeStyles}</style>
      <DashboardPro {...props} />
      <button
        type="button"
        className="tkp-theme-toggle"
        onClick={() => setTheme(current => current === 'dark' ? 'light' : 'dark')}
        title={light ? 'Switch to dark mode' : 'Switch to light mode'}
        aria-label={light ? 'Switch to dark mode' : 'Switch to light mode'}
      >
        <span>{light ? '☀' : '☾'}</span>
        <b>{light ? 'LIGHT' : 'DARK'}</b>
      </button>
    </div>
  );
}

const themeStyles = `
.tkp-theme-shell{position:relative;min-height:calc(100vh - 60px)}
.tkp-theme-toggle{position:fixed;right:18px;top:74px;z-index:1300;display:flex;align-items:center;gap:7px;border:1px solid rgba(34,197,94,.35);background:#0b1219;color:#f8fafc;border-radius:999px;padding:8px 11px;font-size:9px;font-weight:900;letter-spacing:.5px;cursor:pointer;box-shadow:0 8px 25px rgba(0,0,0,.22);transition:.18s ease}
.tkp-theme-toggle:hover{transform:translateY(-1px);border-color:rgba(34,197,94,.7)}
.tkp-theme-toggle span{font-size:13px;line-height:1;color:#4ade80}
.tkp-theme-light .tkp-theme-toggle{background:#ffffff;color:#102018;border-color:#b7d9c2;box-shadow:0 8px 25px rgba(15,23,42,.12)}
.tkp-theme-light .tkp-theme-toggle span{color:#16a34a}

.tkp-theme-light .tkp-root{--bg:#f4f7f5;--panel:#ffffff;--panel2:#f8faf9;--border:#dce7e0;--text:#0f172a;--muted:#64748b;--gold:#16a34a;--green:#16a34a;--red:#dc2626;background:radial-gradient(1000px 500px at 45% -15%,rgba(34,197,94,.10),transparent 60%),var(--bg);color:var(--text)}
.tkp-theme-light .tkp-side{background:#ffffff;border-color:var(--border)}
.tkp-theme-light .tkp-main{background:transparent}
.tkp-theme-light .tkp-top{background:rgba(255,255,255,.94);border-color:var(--border);color:#0f172a}
.tkp-theme-light .tkp-top select{background:#ffffff;color:#0f172a;border-color:#cbd9d0}
.tkp-theme-light .tkp-panel{background:linear-gradient(145deg,#ffffff,#f8fbf9);border-color:var(--border)}
.tkp-theme-light .tkp-card{background:transparent}
.tkp-theme-light .tkp-row b,.tkp-theme-light .tkp-head b{color:#1e293b}
.tkp-theme-light .tkp-mini div{border-color:#e5eee8}
.tkp-theme-light .tkp-bar{background:#e5eee8}
.tkp-theme-light .tkp-side nav button{color:#64748b}
.tkp-theme-light .tkp-side nav button:hover,.tkp-theme-light .tkp-side nav button.active{color:#15803d;background:rgba(22,163,74,.08);border-color:rgba(22,163,74,.18)}
.tkp-theme-light .tkp-brand span,.tkp-theme-light .tkp-locked-brand span{color:#16a34a}
.tkp-theme-light .tkp-logo{border-color:#16a34a;color:#16a34a}
.tkp-theme-light .tkp-avatar{background:#f0fdf4;border-color:#bbd8c4;color:#15803d}
.tkp-theme-light .tkp-quote{background:#f7faf8;border-color:var(--border)}
.tkp-theme-light .tkp-quote p,.tkp-theme-light .tkp-guidance p{color:#475569}
.tkp-theme-light .tkp-time button{background:#f1f5f3;color:#64748b}
.tkp-theme-light .tkp-time button.active{color:#15803d;background:rgba(22,163,74,.09);outline-color:rgba(22,163,74,.22)}
.tkp-theme-light .tkp-chart{background:#070b12}
.tkp-theme-light .tkp-market button{color:#0f172a;border-color:#e5eee8}
.tkp-theme-light .tkp-market small,.tkp-theme-light .tkp-alert small{color:#64748b}
.tkp-theme-light .tkp-alert{border-color:#e5eee8}
.tkp-theme-light .tkp-motivation{background:linear-gradient(145deg,rgba(22,163,74,.08),#ffffff);border-color:rgba(22,163,74,.22)}
.tkp-theme-light .tkp-fields input,.tkp-theme-light .tkp-form input,.tkp-theme-light .tkp-form select{background:#ffffff;color:#0f172a;border-color:#cbd9d0}
.tkp-theme-light .tkp-result{background:#f8faf9;border-color:#dce7e0}
.tkp-theme-light .tkp-guidance>div,.tkp-theme-light .tkp-check label{background:#f8faf9;border-color:#dce7e0}
.tkp-theme-light .tkp-guidance b{color:#15803d}
.tkp-theme-light th{color:#64748b;border-color:#e5eee8}
.tkp-theme-light td{border-color:#e5eee8;color:#334155}
.tkp-theme-light .tkp-notice{background:rgba(22,163,74,.06);border-color:rgba(22,163,74,.2);color:#166534}
.tkp-theme-light .tkp-locked-root{background:radial-gradient(1000px 500px at 45% -15%,rgba(34,197,94,.10),transparent 60%),#f4f7f5}
.tkp-theme-light .tkp-lock-hero{background:linear-gradient(145deg,#ffffff,#f7faf8);border-color:#dce7e0;box-shadow:0 25px 70px rgba(15,23,42,.08)}
.tkp-theme-light .tkp-lock-card{background:#ffffff;border-color:#dce7e0}
.tkp-theme-light .tkp-payment{background:linear-gradient(145deg,rgba(22,163,74,.08),#ffffff);border-color:rgba(22,163,74,.25)}
.tkp-theme-light .tkp-paybox input{background:#ffffff;color:#0f172a;border-color:#cbd9d0}
.tkp-theme-light .tkp-lock-note{color:#64748b}
.tkp-theme-light .tkp-primary,.tkp-theme-light .tkp-paybox button{background:#16a34a;color:#ffffff}

@media(max-width:560px){.tkp-theme-toggle{right:10px;top:68px;padding:7px 9px}.tkp-theme-toggle b{display:none}}
`;
