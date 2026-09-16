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
  }, [theme]);

  const light = theme === 'light';
  return <div className={`tkx-theme-shell ${light ? 'tkx-theme-light' : 'tkx-theme-dark'}`}>
    <style>{dashboardStyles}{themeStyles}</style>
    <DashboardCore {...props} theme={theme} />
    <button className="tkx-theme-toggle" type="button" onClick={() => setTheme(v => v === 'dark' ? 'light' : 'dark')} aria-label={light ? 'Switch to dark mode' : 'Switch to light mode'} title={light ? 'Switch to dark mode' : 'Switch to light mode'}>
      <span>{light ? '☀' : '☾'}</span><b>{light ? 'LIGHT' : 'DARK'}</b>
    </button>
  </div>;
}

const themeStyles=`
.tkx-theme-shell{position:relative;min-height:calc(100vh - 60px)}
.tkx-theme-toggle{position:fixed;right:18px;top:73px;z-index:1300;display:flex;align-items:center;gap:7px;border:1px solid rgba(34,197,94,.35);background:#0b1510;color:#f8fafc;border-radius:999px;padding:8px 11px;font-size:9px;font-weight:900;letter-spacing:.5px;cursor:pointer;box-shadow:0 8px 25px rgba(0,0,0,.22)}
.tkx-theme-toggle:hover{transform:translateY(-1px);border-color:rgba(34,197,94,.7)}.tkx-theme-toggle span{font-size:13px;color:#4ade80}.tkx-theme-light .tkx-theme-toggle{background:#fff;color:#102018;border-color:#b7d9c2}.tkx-theme-light .tkx-theme-toggle span{color:#16a34a}
.tkx-theme-light .tkx-root{--bg:#f4f8f5;--panel:#fff;--border:#dce9e0;--text:#102018;--muted:#64756b;background:radial-gradient(1000px 500px at 45% -15%,rgba(34,197,94,.10),transparent 60%),#f4f8f5;color:#102018}.tkx-theme-light .tkx-side{background:#fff;border-color:#dce9e0}.tkx-theme-light .tkx-top{background:rgba(255,255,255,.95);border-color:#dce9e0;color:#102018}.tkx-theme-light .tkx-top select,.tkx-theme-light .tkx-fields input,.tkx-theme-light .tkx-formgrid input,.tkx-theme-light .tkx-formgrid select,.tkx-theme-light .tkx-ai-row input{background:#fff;color:#102018;border-color:#cbdad0}.tkx-theme-light .tkx-panel{background:linear-gradient(145deg,#fff,#f8fbf9);border-color:#dce9e0}.tkx-theme-light .tkx-row b{color:#1f3026}.tkx-theme-light .tkx-mini div,.tkx-theme-light .tkx-alert,.tkx-theme-light th,.tkx-theme-light td,.tkx-theme-light .tkx-market button{border-color:#e4eee7}.tkx-theme-light .tkx-bar{background:#e5eee8}.tkx-theme-light .tkx-side nav button{color:#64756b}.tkx-theme-light .tkx-side nav button.active,.tkx-theme-light .tkx-side nav button:hover{color:#15803d;background:rgba(22,163,74,.08);border-color:rgba(22,163,74,.18)}.tkx-theme-light .tkx-brand span{color:#16a34a}.tkx-theme-light .tkx-side-note,.tkx-theme-light .tkx-plan-grid>div,.tkx-theme-light .tkx-rules div,.tkx-theme-light .tkx-checks label,.tkx-theme-light .tkx-guidance p,.tkx-theme-light .tkx-result{background:#f8fbf9;border-color:#dce9e0}.tkx-theme-light .tkx-market button{color:#102018}.tkx-theme-light .tkx-market small,.tkx-theme-light .tkx-alert small,.tkx-theme-light .tkx-guidance p,.tkx-theme-light .tkx-ai-note{color:#64756b}.tkx-theme-light .tkx-preview-banner{background:linear-gradient(110deg,rgba(34,197,94,.08),#fff);border-color:rgba(22,163,74,.22)}.tkx-theme-light .tkx-preview-banner input{background:#fff;color:#102018;border-color:#cbdad0}.tkx-theme-light .tkx-notice{color:#166534;background:rgba(22,163,74,.06)}
@media(max-width:560px){.tkx-theme-toggle{right:10px;top:68px;padding:7px 9px}.tkx-theme-toggle b{display:none}}
`;
