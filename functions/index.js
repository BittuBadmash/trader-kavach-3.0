const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const axios = require('axios');

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Cashfree Credentials (SANDBOX / TEST MODE)
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID || "YOUR_CASHFREE_APP_ID";
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || "YOUR_CASHFREE_SECRET_KEY";
const CASHFREE_ENV = "SANDBOX"; 

const CASHFREE_URL = CASHFREE_ENV === "PRODUCTION" 
  ? "https://api.cashfree.com/pg" 
  : "https://sandbox.cashfree.com/pg";

/**
 * 1. Payment Session Create Karein
 */
app.post('/create-cashfree-order', async (req, res) => {
  try {
    const { userId, email, phone, amount } = req.body;
    const orderId = `ORDER_${Date.now()}_${(userId || 'GUEST').slice(0, 5)}`;

    const payload = {
      order_id: orderId,
      order_amount: amount || 99,
      order_currency: 'INR',
      customer_details: {
        customer_id: userId || 'GUEST_USER',
        customer_email: email || 'trader@example.com',
        customer_phone: phone,
      },
      order_meta: {
        return_url: `https://traderkavach.in/?order_id={order_id}`,
      },
    };

    const response = await axios.post(`${CASHFREE_URL}/orders`, payload, {
      headers: {
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
        'x-api-version': '2023-08-01',
        'Content-Type': 'application/json',
      },
    });

    res.json({
      success: true,
      payment_session_id: response.data.payment_session_id,
      order_id: response.data.order_id,
    });
  } catch (error) {
    console.error('Order creation error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Payment session failed' });
  }
});

/**
 * 2. Payment Verify Karein aur Firestore me Premium Activate Karein
 */
app.get('/verify-cashfree-order', async (req, res) => {
  try {
    const { order_id } = req.query;
    if (!order_id) return res.status(400).json({ paid: false, message: 'Missing order_id' });

    const response = await axios.get(`${CASHFREE_URL}/orders/${order_id}`, {
      headers: {
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
        'x-api-version': '2023-08-01',
      },
    });

    const isPaid = response.data.order_status === 'PAID';
    const customerId = response.data.customer_details?.customer_id;

    // Payment Success hote hi Firestore Database update
    if (isPaid && customerId && customerId !== 'GUEST_USER') {
      await db.collection('users').doc(customerId).set(
        { isPremium: true, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true }
      );
    }

    res.json({ paid: isPaid, status: response.data.order_status });
  } catch (error) {
    console.error('Verification error:', error.response?.data || error.message);
    res.status(500).json({ paid: false, message: 'Verification failed' });
  }
});

exports.api = functions.https.onRequest(app);