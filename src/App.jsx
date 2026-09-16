import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Login from './components/Login';
import Dashboard from './components/DashboardPro';
import SeoPage, { isSeoPath } from './components/SeoPage';
import { verifyCashfreeSubscription } from './utils/payment';

export default function App() {
  const [route, setRoute] = useState('home');
  const [user, setUser] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [booting, setBooting] = useState(true);
  const [globalError, setGlobalError] = useState('');
  const [verifyingPayment, setVerifyingPayment] = useState(false);
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

  if (booting) {
    return <div className="boot-screen"><div className="boot-logo">TK</div><p>Starting Trader Kavach...</p></div>;
  }

  return (
    <div className="app-shell">
      <Navbar user={user} onLogin={() => setRoute('login')} onLogout={logout} onHome={() => setRoute(user ? 'dashboard' : 'home')} />
      {globalError && <div className="global-error">{globalError}</div>}
      {verifyingPayment && <div className="global-error">Verifying Cashfree subscription...</div>}
      {!user && showingSeoPage && <SeoPage path={currentPath} />}
      {!user && !showingSeoPage && route === 'home' && <Home onLogin={() => setRoute('login')} />}
      {!user && !showingSeoPage && route === 'login' && <Login onBack={() => setRoute('home')} onAuthSuccess={() => setRoute('dashboard')} />}
      {user && <Dashboard user={user} isPremium={isPremium} onPremiumActivated={() => setIsPremium(true)} />}
      <footer className="site-footer"><span>© {new Date().getFullYear()} Trader Kavach</span><span>Risk management tool — not financial advice.</span></footer>
    </div>
  );
}
