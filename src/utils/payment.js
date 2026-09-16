import { load } from '@cashfreepayments/cashfree-js';
import { auth } from '../firebase';

export const PREMIUM_PRICE_INR = 99;
export const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://morning-glitter-4c00.bhupendraahirwar0786.workers.dev').replace(/\/$/, '');
export const CASHFREE_MODE = import.meta.env.VITE_CASHFREE_MODE === 'production' ? 'production' : 'sandbox';

let cashfreeInstance = null;

const getCashfree = async () => {
  if (!cashfreeInstance) cashfreeInstance = await load({ mode: CASHFREE_MODE });
  return cashfreeInstance;
};

async function authHeaders() {
  const currentUser = auth?.currentUser;
  if (!currentUser) throw new Error('Authentication required.');
  const token = await currentUser.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function openCashfreeCheckout({ user, phone, onSuccess, onError }) {
  try {
    if (!phone || !/^\d{10}$/.test(String(phone))) throw new Error('Kripya valid 10-digit mobile number darj karein.');

    const name = user?.displayName || user?.name || 'Trader Kavach User';
    const email = user?.email || 'trader@example.com';
    const userId = user?.uid || user?.id || '';
    if (!userId) throw new Error('Authenticated user ID missing.');

    const response = await fetch(`${API_BASE}/api/create-subscription`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({
        user_id: userId,
        customer_name: name,
        customer_email: email,
        customer_phone: String(phone),
        amount_inr: PREMIUM_PRICE_INR,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.success === false) {
      throw new Error(data?.error || data?.message || `Subscription create nahi ho saki. HTTP ${response.status}`);
    }

    const subscriptionSessionId = data?.subscription_session_id;
    if (!subscriptionSessionId) throw new Error('Cashfree subscription session nahi mila.');

    if (data?.subscription_id) sessionStorage.setItem('trader_kavach_subscription_id', data.subscription_id);
    sessionStorage.setItem('trader_kavach_user_id', userId);

    const cashfree = await getCashfree();
    if (!cashfree) throw new Error('Cashfree SDK load nahi ho saka.');

    const result = await cashfree.subscriptionsCheckout({
      subsSessionId: subscriptionSessionId,
      redirectTarget: '_modal',
    });

    if (result?.error) throw new Error(result.error?.message || 'Cashfree checkout fail ho gaya.');
    if (result?.paymentDetails && onSuccess) onSuccess(result.paymentDetails);
    return result;
  } catch (error) {
    console.error('Trader Kavach Checkout Error:', error);
    if (onError) onError(error);
    throw error;
  }
}

export async function verifyCashfreeSubscription(subscriptionId) {
  try {
    if (!subscriptionId) return { paid: false, status: 'MISSING_SUBSCRIPTION_ID' };
    const response = await fetch(`${API_BASE}/api/subscription/status?subscription_id=${encodeURIComponent(subscriptionId)}`, {
      headers: await authHeaders(),
    });
    const data = await response.json().catch(() => ({}));
    const status = String(data?.subscriptionStatus || data?.status || '').toUpperCase();
    return { paid: status === 'ACTIVE' || data?.premium === true, status, data };
  } catch (error) {
    console.error('Subscription verification error:', error);
    return { paid: false, status: 'ERROR' };
  }
}

export async function verifyCashfreeOrder(orderId) {
  return verifyCashfreeSubscription(orderId);
}
