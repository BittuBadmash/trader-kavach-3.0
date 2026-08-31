import { load } from '@cashfreepayments/cashfree-js';

export const PREMIUM_PRICE_INR = 99;

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

    console.log('Creating Trader Kavach subscription...');

    const response = await fetch(
      '/api/create-cashfree-order',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.uid || 'GUEST_USER',
          email: user?.email || 'trader@example.com',
          phone,
          amount: PREMIUM_PRICE_INR,
        }),
      }
    );

    const data = await response.json();

    console.log('Trader Kavach Worker Response:', data);

    if (!response.ok) {
      throw new Error(
        data?.message ||
        data?.error ||
        'Subscription create nahi ho saki.'
      );
    }

    /*
     * IMPORTANT:
     * Cashfree Subscription API returns:
     *
     * subscription_session_id
     *
     * NOT:
     *
     * payment_session_id
     */

    const subscriptionSessionId =
      data?.subscription_session_id;

    if (!subscriptionSessionId) {
      throw new Error(
        'Cashfree subscription_session_id nahi mila. Backend response check karein.'
      );
    }

    console.log(
      'Subscription Session:',
      subscriptionSessionId
    );

    const cashfree = await getCashfree();

    /*
     * Cashfree Subscription Checkout
     *
     * subscriptionsCheckout()
     * + subsSessionId
     */

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
        result.error.message ||
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

    /*
     * Subscription checkout may redirect/complete
     * without returning paymentDetails immediately.
     */

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
      `/api/verify-cashfree-subscription?subscription_id=${encodeURIComponent(
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


/*
 * Backward-compatible function.
 *
 * Existing components may still call:
 * verifyCashfreeOrder()
 *
 * We keep it here so the application does not
 * break while we finish the subscription flow.
 */

export async function verifyCashfreeOrder(orderId) {
  return verifyCashfreeSubscription(orderId);
}