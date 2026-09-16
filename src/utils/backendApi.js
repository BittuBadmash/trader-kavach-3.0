import { auth } from '../firebase';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://morning-glitter-4c00.bhupendraahirwar0786.workers.dev').replace(/\/$/, '');

export async function getFirebaseBearerToken(forceRefresh = false) {
  const currentUser = auth?.currentUser;
  if (!currentUser) throw new Error('Authentication required.');
  return currentUser.getIdToken(forceRefresh);
}

export async function backendFetch(path, options = {}) {
  const token = await getFirebaseBearerToken();
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (response.status === 401) {
    const freshToken = await getFirebaseBearerToken(true);
    headers.set('Authorization', `Bearer ${freshToken}`);
    return fetch(`${API_BASE}${path}`, { ...options, headers });
  }
  return response;
}

export { API_BASE };
