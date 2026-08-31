import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, firebaseConfigured } from '../firebase';

export default function Login({ onBack, onAuthSuccess }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function syncUser(user, extra = {}, createProfile = false) {
    if (!db) return;
    const base = {
      uid: user.uid,
      name: user.displayName || extra.name || '',
      email: user.email || '',
      updatedAt: serverTimestamp(),
      ...extra,
    };
    if (createProfile) base.isPremium = false;
    await setDoc(doc(db, 'users', user.uid), base, { merge: true });
  }

  async function submit(event) {
    event.preventDefault();
    setError('');

    if (!firebaseConfigured || !auth) {
      setError('Firebase is not configured. Add the VITE_FIREBASE_* values to .env and restart Vite.');
      return;
    }

    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }

    setBusy(true);
    try {
      let credential;

      if (mode === 'signup') {
        if (!name.trim()) throw new Error('Name is required for sign up.');
        credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(credential.user, { displayName: name.trim() });
        await syncUser(credential.user, { name: name.trim(), phoneNumber: phone.replace(/\D/g, '') }, true);
      } else {
        credential = await signInWithEmailAndPassword(auth, email.trim(), password);
        await syncUser(credential.user);
      }

      onAuthSuccess?.(credential.user);
    } catch (err) {
      console.error(err);
      const messages = {
        'auth/email-already-in-use': 'This email is already registered.',
        'auth/invalid-email': 'Enter a valid email address.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/invalid-credential': 'Email or password is incorrect.',
        'auth/popup-closed-by-user': 'Google sign-in was closed.',
      };
      setError(messages[err?.code] || err?.message || 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  }

  async function googleLogin() {
    setError('');
    if (!firebaseConfigured || !auth) {
      setError('Firebase is not configured. Add the VITE_FIREBASE_* values to .env and restart Vite.');
      return;
    }

    setBusy(true);
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      await syncUser(credential.user);
      onAuthSuccess?.(credential.user);
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Google sign-in failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <button className="back-link" onClick={onBack}>← Back to home</button>
      <section className="auth-card">
        <div className="auth-header">
          <span className="brand-mark">TK</span>
          <span className="eyebrow">SECURE ACCESS</span>
          <h1>{mode === 'login' ? 'Welcome back.' : 'Create your account.'}</h1>
          <p>Access your risk dashboard and capital plan.</p>
        </div>

        <div className="auth-tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Login</button>
          <button className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>Sign Up</button>
        </div>

        <form onSubmit={submit} className="auth-form">
          {mode === 'signup' && (
            <>
              <label>
                Full name
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tr. Bhupendra" autoComplete="name" />
              </label>
              <label>
                Mobile number
                <input type="tel" inputMode="numeric" maxLength="10" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile number" autoComplete="tel" />
              </label>
            </>
          )}
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 6 characters" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          </label>

          {error && <div className="alert alert-error">{error}</div>}

          <button className="btn btn-primary btn-full" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="divider"><span>OR</span></div>

        <button className="btn btn-google btn-full" onClick={googleLogin} disabled={busy}>
          <span className="google-g">G</span> Sign In with Google
        </button>
      </section>
    </main>
  );
}
