export default async function handler(req, res) {
  // Only POST is allowed
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    // Cashfree sends subscription data in POST body
    const body = req.body || {};

    console.log('Cashfree Return Body:', body);

    const subscriptionId =
      body.subscription_id ||
      body.subscriptionId ||
      body.cf_subscription_id ||
      '';

    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        paid: false,
        status: 'MISSING_SUBSCRIPTION_ID',
        error: 'Missing subscription_id.'
      });
    }

    // Redirect user to React payment-success page
    const redirectUrl =
      `https://traderkavach.in/payment-success?subscription_id=${encodeURIComponent(
        subscriptionId
      )}`;

    return res.redirect(303, redirectUrl);

  } catch (error) {
    console.error('Cashfree return handler error:', error);

    return res.status(500).json({
      success: false,
      paid: false,
      status: 'ERROR',
      error: error?.message || 'Payment return processing failed.'
    });
  }
}