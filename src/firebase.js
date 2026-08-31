import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const fallbackConfig = {
  apiKey: 'demo-api-key',
  authDomain: 'demo-project.firebaseapp.com',
  projectId: 'demo-project',
  storageBucket: 'demo-project.appspot.com',
  messagingSenderId: '000000000000',
  appId: '1:000000000000:web:000000000000',
};

const env = import.meta.env ?? {};

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || fallbackConfig.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || fallbackConfig.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || fallbackConfig.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || fallbackConfig.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || fallbackConfig.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || fallbackConfig.appId,
};

export const firebaseConfigured = Boolean(
  env.VITE_FIREBASE_API_KEY &&
  env.VITE_FIREBASE_AUTH_DOMAIN &&
  env.VITE_FIREBASE_PROJECT_ID &&
  env.VITE_FIREBASE_APP_ID
);

let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error('Firebase initialization failed:', error);
  app = null;
}

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const functions = app ? getFunctions(app, env.VITE_FIREBASE_FUNCTIONS_REGION || 'us-central1') : null;
export const googleProvider = new GoogleAuthProvider();

if (import.meta.env.DEV && app && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  try {
    if (auth) connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    if (db) connectFirestoreEmulator(db, '127.0.0.1', 8080);
    if (functions) connectFunctionsEmulator(functions, '127.0.0.1', 5001);
  } catch (error) {
    console.warn('Firebase emulator connection skipped:', error);
  }
}
