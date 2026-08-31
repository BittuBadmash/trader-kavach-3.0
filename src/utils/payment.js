import { load } from '@cashfreepayments/cashfree-js';

export const PREMIUM_PRICE_INR = 99;

const API_BASE =
  'https://morning-glitter-4c00.bhupendraahirwar0786.workers.dev';

let cashfreeInstance = null;

const getCashfree = async () => {
  if (!cashfreeInstance) {
    cashfreeInstance = await load({
      mode: 'sandbox',
    });
  }

  return cashfreeInstance;
};

export async function openCashfreeCheckout({
  user,
  phone,
  customerName,
  onSuccess,
  onError,
}) {
  try {
    // -----------------------------
    // Validate phone
    // -----------------------------

    const cleanPhone = String(phone || '')
      .replace(/\D/g, '');

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      throw new Error(
        'Kripya valid 10-digit mobile number darj karein.'
      );
    }

    // -----------------------------
    // Customer details
    // -----------------------------

    const name =
      customerName ||
      user?.displayName ||
      'Trader Kavach User';

    const email =
      user?.email ||
      'trader@example.com';

    const userId =
      user?.uid ||
      'GUEST_USER';

    // -----------------------------
    // Create Cashfree subscription
    // -----------------------------

    const response = await fetch(
      `${API_BASE}/api/create-subscription`,
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          user_id: userId,
          customer_name: name,
          customer_email: email,
          customer_phone: cleanPhone,
        }),
      }
    );

    // -----------------------------
    // Read response safely
    // -----------------------------

    const responseText = await response.text();

    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error(
        `Worker ne invalid response diya. HTTP ${response.status}`
      );
    }

    console.log(
      'Trader Kavach Worker Response:',
      data
    );

    // -----------------------------
    // Worker error
    // -----------------------------

    if (!response.ok || !data.success) {
      throw new Error(
        data?.error ||
        data?.message ||
        'Cashfree subscription create nahi ho saka.'
      );
    }

    // -----------------------------
    // Subscription session check
    // -----------------------------

    if (!data.subscription_session_id) {
      throw new Error(
        'Cashfree subscription_session_id nahi mila.'
      );
    }

    console.log(
      'Subscription Session:',
      data.subscription_session_id
    );

    // -----------------------------
    // Load Cashfree
    // -----------------------------

    const cashfree = await getCashfree();

    if (!cashfree) {
      throw new Error(
        'Cashfree SDK load nahi ho saka.'
      );
    }

    // -----------------------------
    // Open Cashfree checkout
    // -----------------------------

    const result = await cashfree.checkout({
      subscriptionSessionId:
        data.subscription_session_id,

      redirectTarget: '_modal',
    });

    console.log(
      'Cashfree Checkout Result:',
      result
    );

    // -----------------------------
    // Cashfree error
    // -----------------------------

    if (result?.error) {
      console.error(
        'Cashfree Error:',
        result.error
      );

      throw new Error(
        result.error.message ||
        'Payment cancel ya fail ho gaya.'
      );
    }

    // -----------------------------
    // Payment details
    // -----------------------------

    if (result?.paymentDetails) {
      console.log(
        'Payment Success Details:',
        result.paymentDetails
      );

      if (onSuccess) {
        onSuccess(result.paymentDetails);
      }

      return result.paymentDetails;
    }

    return result;

  } catch (error) {
    console.error(
      'Trader Kavach Checkout Error:',
      error
    );

    if (onError) {
      onError(error);
    }

    throw error;
  }
}


// =====================================================
// VERIFY CASHFREE SUBSCRIPTION
// =====================================================

export async function verifyCashfreeOrder(
  subscriptionId
) {
  try {
    if (!subscriptionId) {
      return {
        paid: false,
        error: 'Subscription ID missing.',
      };
    }

    const response = await fetch(
      `${API_BASE}/api/verify-subscription?subscription_id=${encodeURIComponent(
        subscriptionId
      )}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const responseText =
      await response.text();

    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      return {
        paid: false,
        error:
          'Worker ne invalid verification response diya.',
      };
    }

    console.log(
      'Cashfree Verification Response:',
      data
    );

    return {
      paid:
        data?.paid === true ||
        data?.status === 'ACTIVE' ||
        data?.subscription_status === 'ACTIVE',

      status:
        data?.status ||
        data?.subscription_status ||
        null,

      data,
    };

  } catch (error) {
    console.error(
      'Subscription verification error:',
      error
    );

    return {
      paid: false,
      error: error?.message || 'Verification failed.',
    };
  }
}