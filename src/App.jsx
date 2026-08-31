import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { verifyCashfreeSubscription } from './utils/payment';

export default function App() {
  const [route, setRoute] = useState('home');
  const [user, setUser] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [booting, setBooting] = useState(true);
  const [globalError, setGlobalError] = useState('');
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  // -------------------------------------
  // CASHFREE SUBSCRIPTION ID
  // -------------------------------------

  const [cashfreeSubscriptionId, setCashfreeSubscriptionId] = useState(
    () =>
      sessionStorage.getItem(
        'trader_kavach_subscription_id'
      ) || ''
  );

  // -------------------------------------
  // AUTH + USER PROFILE
  // -------------------------------------

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
            const snapshot = await getDoc(
              doc(db, 'users', nextUser.uid)
            );

            setIsPremium(
              snapshot.exists() &&
                snapshot.data()?.isPremium === true
            );
          } else {
            setIsPremium(false);
          }
        } catch (error) {
          console.error(
            'User profile load failed:',
            error
          );

          // Firebase permission problem should not
          // break the payment verification flow.
          setIsPremium(false);
        } finally {
          setBooting(false);
        }
      });
    } catch (error) {
      console.error(
        'Auth listener failed:',
        error
      );

      setGlobalError(
        'Authentication service could not be initialized.'
      );

      setBooting(false);

      return undefined;
    }
  }, []);

  // -------------------------------------
  // CASHFREE PAYMENT VERIFICATION
  // -------------------------------------

  useEffect(() => {
    if (!cashfreeSubscriptionId || !user) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setVerifyingPayment(true);

        console.log(
          'Verifying Trader Kavach subscription:',
          cashfreeSubscriptionId
        );

        const result =
          await verifyCashfreeSubscription(
            cashfreeSubscriptionId
          );

        console.log(
          'Trader Kavach payment verification result:',
          result
        );

        if (cancelled) {
          return;
        }

        if (result?.paid === true) {
          console.log(
            'Trader Kavach Premium activated.'
          );

          setIsPremium(true);
          setRoute('dashboard');

          sessionStorage.removeItem(
            'trader_kavach_subscription_id'
          );

          sessionStorage.removeItem(
            'trader_kavach_user_id'
          );

          setCashfreeSubscriptionId('');
        } else {
          console.log(
            'Subscription is not authorized yet:',
            result?.status
          );

          setGlobalError(
            `Payment authorization pending. Current status: ${
              result?.status || 'UNKNOWN'
            }`
          );
        }
      } catch (error) {
        console.error(
          'Cashfree payment verification failed:',
          error
        );

        if (!cancelled) {
          setGlobalError(
            'Payment verification failed. Please try again.'
          );
        }
      } finally {
        if (!cancelled) {
          setVerifyingPayment(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cashfreeSubscriptionId, user]);

  // -------------------------------------
  // LOGOUT
  // -------------------------------------

  async function logout() {
    try {
      if (auth) {
        await signOut(auth);
      }

      setUser(null);
      setIsPremium(false);
      setRoute('home');

      sessionStorage.removeItem(
        'trader_kavach_subscription_id'
      );

      sessionStorage.removeItem(
        'trader_kavach_user_id'
      );
    } catch (error) {
      console.error(
        'Logout failed:',
        error
      );

      setGlobalError(
        'Logout failed. Please try again.'
      );
    }
  }

  // -------------------------------------
  // BOOT SCREEN
  // -------------------------------------

  if (booting) {
    return (
      <div className="boot-screen">
        <div className="boot-logo">TK</div>

        <p>
          Starting Trader Kavach...
        </p>
      </div>
    );
  }

  // -------------------------------------
  // APP
  // -------------------------------------

  return (
    <div className="app-shell">

      <Navbar
        user={user}
        onLogin={() => setRoute('login')}
        onLogout={logout}
        onHome={() =>
          setRoute(
            user ? 'dashboard' : 'home'
          )
        }
      />

      {globalError && (
        <div className="global-error">
          {globalError}
        </div>
      )}

      {verifyingPayment && (
        <div className="global-error">
          Verifying Cashfree subscription...
        </div>
      )}

      {!user && route === 'home' && (
        <Home
          onLogin={() => setRoute('login')}
        />
      )}

      {!user && route === 'login' && (
        <Login
          onBack={() => setRoute('home')}
          onAuthSuccess={() =>
            setRoute('dashboard')
          }
        />
      )}

      {user && (
        <Dashboard
          user={user}
          isPremium={isPremium}
          onPremiumActivated={() =>
            setIsPremium(true)
          }
        />
      )}

      <footer className="site-footer">
        <span>
          © {new Date().getFullYear()} Trader Kavach
        </span>

        <span>
          Risk management tool — not financial advice.
        </span>
      </footer>

    </div>
  );
}