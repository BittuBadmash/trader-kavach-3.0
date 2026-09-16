# Trader Kavach production backend foundation

This repository keeps the existing React/Vite + Firebase + Cloudflare Worker + Cashfree architecture.

## Production contract

- Firebase Authentication is the user identity layer.
- Firestore is the application data store.
- Cloudflare Worker is the trusted API/payment boundary.
- Cashfree Subscriptions is the ₹99/month payment provider.
- Vercel hosts the frontend.

The browser must never decide premium entitlement. The Worker must verify the Firebase identity, validate the Cashfree subscription, and write server-managed subscription fields.

## Required Worker secrets

Set these in Cloudflare Worker Secrets, never in Git:

- `CASHFREE_APP_ID`
- `CASHFREE_SECRET_KEY`
- `CASHFREE_WEBHOOK_SECRET`
- Firebase server verification credentials required by the chosen Worker implementation
- AI provider key, if AI Market Assistant is enabled

## Cashfree production

Cashfree's current subscription API uses the production base URL `https://api.cashfree.com/pg` and API version `2025-01-01`. The create-subscription response includes a `subscription_id` and `subscription_session_id`; the client uses the session ID with Cashfree Checkout. The Worker must verify the subscription state before granting premium access.

Webhook requests must verify `x-webhook-signature` and `x-webhook-timestamp` before processing. Webhook handling must be idempotent.

## API contract

Expected protected routes:

- `GET /api/health`
- `GET /api/auth/me`
- `GET/PATCH /api/user/profile`
- `GET/PUT /api/trading-profile`
- `GET/PUT /api/mission`
- `GET/PUT /api/risk-settings`
- `GET/PUT /api/rules`
- `GET/POST /api/trades`
- `GET/PATCH/DELETE /api/trades/:tradeId`
- `GET /api/statistics`
- `GET /api/today-plan`
- `POST /api/create-subscription`
- `GET /api/subscription/status`
- `POST /api/webhooks/cashfree`
- `GET /api/market/:symbol`
- `POST /api/market-chat`

Protected requests use `Authorization: Bearer <Firebase ID token>`.

## Important deployment note

The Cloudflare Worker source and its encrypted secrets are not stored in this frontend repository. The frontend must never contain Cashfree production secrets. Deploying this repository does not by itself configure the Worker or Cashfree production credentials.
