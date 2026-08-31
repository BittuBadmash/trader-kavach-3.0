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
  onSuccess,
  onError,
}) {
  try {
    if (!phone || !/^\d{10}$/.test(phone)) {
      throw new Error(
        'Kripya valid 10-digit mobile number darj karein.'
      );
    }

    const name =
      user?.displayName ||
      user?.name ||
      'Trader Kavach User';

    const email =
      user?.email ||
      'trader@example.com';

    console.log('Creating Trader Kavach subscription...');

    const response = await fetch(
      `${API_BASE}/api/create-subscription`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          phone,
        }),
      }
    );

    const data = await response.json();

    console.log(
      'Trader Kavach Worker Response:',
      data
    );

    if (!response.ok || data?.success === false) {
      throw new Error(
        data?.error ||
          data?.message ||
          'Subscription create nahi ho saki.'
      );
    }

    const subscriptionSessionId =
      data?.subscription_session_id;

    if (!subscriptionSessionId) {
      throw new Error(
        'Cashfree subscription_session_id nahi mila.'
      );
    }

    console.log(
      'Subscription Session:',
      subscriptionSessionId
    );

    const cashfree = await getCashfree();

    const result =
      await cashfree.subscriptionsCheckout({
        subsSessionId: subscriptionSessionId,
        redirectTarget: '_modal',
      });

    console.log(
      'Cashfree Checkout Result:',
      result
    );

    if (result?.error) {
      console.error(
        'Cashfree Error:',
        result.error
      );

      throw new Error(
        result.error?.message ||
          'Cashfree checkout fail ho gaya.'
      );
    }

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
  }
}

export async function verifyCashfreeSubscription(
  subscriptionId
) {
  try {
    if (!subscriptionId) {
      return {
        paid: false,
        status: 'MISSING_SUBSCRIPTION_ID',
      };
    }

    const response = await fetch(
      `${API_BASE}/api/verify-subscription?subscription_id=${encodeURIComponent(
        subscriptionId
      )}`
    );

    const data = await response.json();

    console.log(
      'Cashfree Subscription Verification:',
      data
    );

    const status = String(
      data?.status || ''
    ).toUpperCase();

    return {
      paid:
        status === 'ACTIVE' ||
        status === 'SUCCESS' ||
        data?.paid === true,
      status,
      data,
    };
  } catch (error) {
    console.error(
      'Subscription verification error:',
      error
    );

    return {
      paid: false,
      status: 'ERROR',
    };
  }
}

export async function verifyCashfreeOrder(orderId) {
  return verifyCashfreeSubscription(orderId);
}