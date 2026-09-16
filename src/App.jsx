import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Login from './components/Login';
import Dashboard from './components/DashboardPro';
import CapitalSetup from './components/CapitalSetup';
import SeoPage, { isSeoPath } from './components/SeoPage';
import { verifyCashfreeSubscription } from './utils/payment';

const MISSION_KEY = 'trader_kavach_mission';
const PROFILE_KEY = 'trader_kavach_currency_profile';

export default function App() {
  const [route, setRoute] = useState('home');
  const [user, setUser] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [booting, setBooting] = useState(true);
  const [globalError, setGlobalError] = useState('');
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [capitalSetupOpen, setCapitalSetupOpen] = useState(false);
  const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';
  const showingSeoPage = !user && isSeoPath(currentPath) && currentPath !== '/';

  useEffect(() => {
    if (currentPath === '/') {
      document.title = 'Trader Kavach – Trading Risk Management & Position Size Calculator';
      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) canonical.href = 'https://traderkavach.in/';
    }
  }, [currentPath]);

  const [cashfreeSubscriptionId, setCashfreeSubscriptionId] = useState(
    () => sessionStorage.getItem('trader_kavach_subscription_id') || ''
  );

  useEffect(() => {
    if (!auth) {
      setBooting(false);
      return undefined;
    }
    try {
      return onAuthStateChanged(auth, async (nextUser) => {
        try {
          setUser(nextUser);
          if (nextUser && db) {
            const snapshot = await getDoc(doc(db, 'users', nextUser.uid));
            setIsPremium(snapshot.exists() && snapshot.data()?.isPremium === true);
          } else {
            setIsPremium(false);
          }
        } catch (error) {
          console.error('User profile load failed:', error);
          setIsPremium(false);
        } finally {
          setBooting(false);
        }
      });
    } catch (error) {
      console.error('Auth listener failed:', error);
      setGlobalError('Authentication service could not be initialized.');
      setBooting(false);
      return undefined;
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    try {
      const mission = JSON.parse(localStorage.getItem(MISSION_KEY) || 'null');
      const profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
      const validUsdSetup = mission && profile?.currency === 'USD' && Number(mission.startingCapital) > 0;
      if (!validUsdSetup) setCapitalSetupOpen(true);
    } catch {
      setCapitalSetupOpen(true);
    }
  }, [user]);

  useEffect(() => {
    if (!cashfreeSubscriptionId || !user) return;
    let cancelled = false;
    (async () => {
      try {
        setVerifyingPayment(true);
        const result = await verifyCashfreeSubscription(cashfreeSubscriptionId);
        if (cancelled) return;
        if (result?.paid === true) {
          setIsPremium(true);
          setRoute('dashboard');
          sessionStorage.removeItem('trader_kavach_subscription_id');
          sessionStorage.removeItem('trader_kavach_user_id');
          setCashfreeSubscriptionId('');
        } else {
          setGlobalError(`Payment authorization pending. Current status: ${result?.status || 'UNKNOWN'}`);
        }
      } catch (error) {
        console.error('Cashfree payment verification failed:', error);
        if (!cancelled) setGlobalError('Payment verification failed. Please try again.');
      } finally {
        if (!cancelled) setVerifyingPayment(false);
      }
    })();
    return () => { cancelled = true; };
  }, [cashfreeSubscriptionId, user]);

  async function logout() {
    try {
      if (auth) await signOut(auth);
      setUser(null);
      setIsPremium(false);
      setRoute('home');
      sessionStorage.removeItem('trader_kavach_subscription_id');
      sessionStorage.removeItem('trader_kavach_user_id');
    } catch (error) {
      console.error('Logout failed:', error);
      setGlobalError('Logout failed. Please try again.');
    }
  }

  if (booting) return <div className="boot-screen"><div className="boot-logo">TK</div><p>Starting Trader Kavach...</p></div>;

  return <div className="app-shell">
    <Navbar user={user} onLogin={() => setRoute('login')} onLogout={logout} onHome={() => setRoute(user ? 'dashboard' : 'home')} />
    {globalError && <div className="global-error">{globalError}</div>}
    {verifyingPayment && <div className="global-error">Verifying Cashfree subscription...</div>}
    {!user && showingSeoPage && <SeoPage path={currentPath} />}
    {!user && !showingSeoPage && route === 'home' && <Home onLogin={() => setRoute('login')} />}
    {!user && !showingSeoPage && route === 'login' && <Login onBack={() => setRoute('home')} onAuthSuccess={() => setRoute('dashboard')} />}
    {user && <>
      <Dashboard user={user} isPremium={isPremium} onPremiumActivated={() => setIsPremium(true)} />
      <button onClick={() => setCapitalSetupOpen(true)} title="Set or edit starting capital" style={{position:'fixed',right:18,bottom:18,zIndex:1200,border:'1px solid rgba(245,185,66,.35)',background:'#111923',color:'#F5B942',borderRadius:999,padding:'9px 13px',fontSize:10,fontWeight:800,cursor:'pointer',boxShadow:'0 10px 30px rgba(0,0,0,.35)'}}>⚙ CAPITAL</button>
      {capitalSetupOpen && <CapitalSetup onDone={() => { setCapitalSetupOpen(false); window.location.reload(); }} />}
    </>}
    <footer className="site-footer"><span>© {new Date().getFullYear()} Trader Kavach</span><span>Risk management tool — not financial advice.</span></footer>
  </div>;
}
