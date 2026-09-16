import { useEffect, useState } from 'react';
import DashboardCore, { dashboardStyles } from './DashboardCore';

const THEME_KEY = 'trader_kavach_theme';

export default function DashboardTheme(props) {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      return saved === 'light' || saved === 'dark' ? saved : 'dark';
    } catch { return 'dark'; }
  });

  useEffect(() => {
    try { localStorage.setItem(THEME_KEY, theme); } catch {}
    document.documentElement.dataset.tkTheme = theme;
  }, [theme]);

  const light = theme === 'light';
  return (
    <div className={`tkx-theme-shell ${light ? 'tkx-theme-light' : 'tkx-theme-dark'}`}>
      <style>{dashboardStyles}{themeStyles}</style>
      <DashboardCore {...props} theme={theme} />
      <button className="tkx-theme-toggle" type="button" onClick={() => setTheme(v => v === 'dark' ? 'light' : 'dark')} aria-label={light ? 'Switch to dark mode' : 'Switch to light mode'} title={light ? 'Switch to dark mode' : 'Switch to light mode'}>
        <span>{light ? '☀' : '☾'}</span><b>{light ? 'LIGHT' : 'DARK'}</b>
      </button>
    </div>
  );
}

const themeStyles=`
.tkx-theme-shell{min-height:calc(100vh - 60px);position:relative}
.tkx-theme-shell .tkx-root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;letter-spacing:.01em}
.tkx-theme-dark .tkx-root{background:#030907;color:#eef8f1}
.tkx-theme-dark .tkx-side{background:linear-gradient(180deg,#07120c 0%,#040b07 100%);border-right:1px solid rgba(74,222,128,.12);box-shadow:18px 0 60px rgba(0,0,0,.22)}
.tkx-theme-dark .tkx-main{background:radial-gradient(900px 500px at 65% 0%,rgba(34,197,94,.075),transparent 65%),#030907}
.tkx-theme-dark .tkx-top{background:rgba(3,9,7,.88);border-bottom-color:rgba(74,222,128,.12)}
.tkx-theme-dark .tkx-panel{background:linear-gradient(145deg,rgba(12,27,19,.98),rgba(5,15,10,.98));border-color:rgba(74,222,128,.11);box-shadow:0 14px 45px rgba(0,0,0,.18)}
.tkx-theme-dark .tkx-panel:hover{border-color:rgba(74,222,128,.23);box-shadow:0 18px 55px rgba(0,0,0,.28)}
.tkx-theme-dark .tkx-head{border-bottom:1px solid rgba(148,163,184,.08);padding-bottom:10px;margin-bottom:12px}
.tkx-theme-dark .tkx-big{font-size:30px;letter-spacing:-1px}
.tkx-theme-dark .tkx-preview-banner{background:linear-gradient(105deg,#0b2a19,#07140c 55%,#0d2116);border-color:rgba(74,222,128,.24);box-shadow:0 15px 45px rgba(0,0,0,.2)}
.tkx-theme-dark .tkx-chart{border:1px solid rgba(74,222,128,.12);box-shadow:inset 0 0 0 1px rgba(0,0,0,.18)}
.tkx-theme-dark .tkx-market button{background:rgba(255,255,255,.018);border-color:rgba(148,163,184,.08)}
.tkx-theme-dark .tkx-market button:hover{background:rgba(34,197,94,.07);border-color:rgba(74,222,128,.25);transform:translateX(2px)}
.tkx-theme-dark .tkx-side nav button{transition:.18s ease}
.tkx-theme-dark .tkx-side nav button.active{box-shadow:inset 3px 0 #22c55e,0 8px 25px rgba(34,197,94,.06)}
.tkx-theme-toggle{position:fixed;right:18px;top:72px;z-index:1500;display:flex;align-items:center;gap:7px;border:1px solid rgba(34,197,94,.28);background:#08140d;color:#eaffef;border-radius:999px;padding:8px 11px;font-size:8px;font-weight:900;letter-spacing:.6px;cursor:pointer;box-shadow:0 10px 30px rgba(0,0,0,.28);transition:.18s ease}
.tkx-theme-toggle:hover{transform:translateY(-1px);border-color:#22c55e}
.tkx-theme-toggle span{font-size:13px;color:#4ade80}
.tkx-theme-light .tkx-root{--bg:#f3f8f4;--panel:#fff;--border:#dbe8df;--text:#102018;--muted:#66776d;background:radial-gradient(900px 450px at 50% -10%,rgba(34,197,94,.10),transparent 65%),#f3f8f4;color:#102018}
.tkx-theme-light .tkx-side{background:#fff;border-color:#dbe8df;box-shadow:12px 0 40px rgba(15,23,42,.04)}
.tkx-theme-light .tkx-top{background:rgba(255,255,255,.90);border-color:#dbe8df}
.tkx-theme-light .tkx-panel{background:linear-gradient(145deg,#fff,#f8fbf9);border-color:#dbe8df;box-shadow:0 10px 35px rgba(15,23,42,.045)}
.tkx-theme-light .tkx-panel:hover{border-color:#b9d9c3}
.tkx-theme-light .tkx-market button,.tkx-theme-light .tkx-mini div,.tkx-theme-light .tkx-plan-grid>div,.tkx-theme-light .tkx-result,.tkx-theme-light .tkx-alert{background:#f7faf8;border-color:#e0ebe4;color:#102018}
.tkx-theme-light .tkx-market button:hover{background:#edf8f0}
.tkx-theme-light .tkx-preview-banner{background:linear-gradient(105deg,#ecfdf3,#fff);border-color:#bfe3ca;color:#102018}
.tkx-theme-light .tkx-preview-banner span,.tkx-theme-light .tkx-ai-note{color:#66776d}
.tkx-theme-light .tkx-theme-toggle{background:#fff;color:#102018;border-color:#c8ddd0}
.tkx-theme-light .tkx-theme-toggle span{color:#16a34a}
@media(max-width:700px){.tkx-theme-toggle{right:10px;top:67px;padding:7px 9px}.tkx-theme-toggle b{display:none}}
`;
