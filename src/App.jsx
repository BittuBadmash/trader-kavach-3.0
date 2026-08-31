import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { verifyCashfreeOrder } from './utils/payment';

export default function App() {
  const [route, setRoute] = useState('home');
  const [user, setUser] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [booting, setBooting] = useState(true);
  const [globalError, setGlobalError] = useState('');

  const [cashfreeOrderId, setCashfreeOrderId] = useState(() => new URLSearchParams(window.location.search).get('order_id') || '');

  useEffect(() => {
    const returnedOrderId = cashfreeOrderId;
    if (returnedOrderId) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

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
    if (!cashfreeOrderId || !user) return;

    let cancelled = false;
    (async () => {
      try {
        const result = await verifyCashfreeOrder(cashfreeOrderId);
        if (!cancelled && result?.paid) {
          setIsPremium(true);
          setRoute('dashboard');
          setCashfreeOrderId('');
        }
      } catch (error) {
        console.error('Cashfree payment verification failed:', error);
        if (!cancelled) setGlobalError('Payment verification failed. If you were charged, do not pay again; contact support with your order ID.');
      }
    })();

    return () => { cancelled = true; };
  }, [cashfreeOrderId, user]);

  async function logout() {
    try {
      if (auth) await signOut(auth);
      setUser(null);
      setIsPremium(false);
      setRoute('home');
    } catch (error) {
      console.error('Logout failed:', error);
      setGlobalError('Logout failed. Please try again.');
    }
  }

  if (booting) {
    return (
      <div className="boot-screen">
        <div className="boot-logo">TK</div>
        <p>Starting Trader Kavach…</p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Navbar
        user={user}
        onLogin={() => setRoute('login')}
        onLogout={logout}
        onHome={() => setRoute(user ? 'dashboard' : 'home')}
      />

      {globalError && <div className="global-error">{globalError}</div>}

      {!user && route === 'home' && <Home onLogin={() => setRoute('login')} />}
      {!user && route === 'login' && (
        <Login
          onBack={() => setRoute('home')}
          onAuthSuccess={() => setRoute('dashboard')}
        />
      )}
      {user && (
        <Dashboard
          user={user}
          isPremium={isPremium}
          onPremiumActivated={() => setIsPremium(true)}
        />
      )}

      <footer className="site-footer">
        <span>© {new Date().getFullYear()} Trader Kavach</span>
        <span>Risk management tool — not financial advice.</span>
      </footer>
    </div>
  );
}
