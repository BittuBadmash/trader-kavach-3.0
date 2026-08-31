# Trader Kavach — Cashfree ₹99 Setup

This version replaces the old Razorpay client flow with Cashfree Checkout and a Firebase Cloud Functions backend.

## Architecture

React/Vite -> Firebase callable function -> Cashfree Create Order -> Cashfree Checkout -> return to app -> Firebase callable verification -> Firestore `users/{uid}.isPremium = true`.

The Cashfree secret never goes into Vite `VITE_*` variables.

## 1. Frontend

The root `.env` contains the Firebase Web App configuration and `VITE_FIREBASE_FUNCTIONS_REGION`.

Run:

```powershell
npm install
npm run dev
```

## 2. Firebase CLI

If Firebase CLI is not installed:

```powershell
npm install -g firebase-tools
firebase login
```

From the project root:

```powershell
firebase use trader-kavach
```

## 3. Cashfree Test credentials

In Cashfree Test Environment -> Developers -> API Keys, copy the Test App ID and Secret Key.

Do NOT put the secret into `.env` at the project root and do NOT prefix it with `VITE_`.

Set Firebase Functions secrets:

```powershell
firebase functions:secrets:set CASHFREE_CLIENT_ID
firebase functions:secrets:set CASHFREE_CLIENT_SECRET
```

Paste the corresponding Test values when prompted.

## 4. Functions environment

Copy `functions/.env.example` to `functions/.env`.

For sandbox testing:

```text
CASHFREE_ENV=sandbox
APP_BASE_URL=http://localhost:5173
```

For production, change to your HTTPS website URL and `CASHFREE_ENV=production`.

Never commit `functions/.env` if it contains anything sensitive.

## 5. Install backend dependencies

```powershell
cd functions
npm install
cd ..
```

## 6. Deploy Cloud Functions

```powershell
firebase deploy --only functions
```

The callable functions are:

- `createCashfreeOrder`
- `verifyCashfreeOrder`
- `cashfreeWebhook`

## 7. Deploy Firestore rules

```powershell
firebase deploy --only firestore:rules
```

The rules prevent the browser from changing `isPremium` or payment fields directly.

## 8. Cashfree webhook

After deploying, Cashfree can be configured to call the deployed `cashfreeWebhook` HTTPS endpoint. The function verifies the webhook signature and then confirms the order through Cashfree before granting premium access.

## 9. ₹99 price

The amount is fixed server-side at INR 99 in `functions/index.js`. Do not trust a price sent by the browser.
