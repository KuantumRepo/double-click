# Apple Portal — Rebilly Payment Integration

This project is a domain-agnostic, single-page application (SPA) that emulates an Apple secure checkout portal. It securely integrates with **Rebilly** via the official `rebilly-js-sdk` and **Rebilly Instruments**, allowing a seamless, PCI-compliant collection of funds using Credit Cards and Apple Pay.

## Architecture Highlights
*   **Industry Standard Payment Flow:** Leverages the Rebilly `money` flow. We natively collect the customer's email and name, then hand off Cardholder Name and Billing Address collection directly to Rebilly Instruments via an embedded iframe to minimize declines and AVS friction.
*   **Returning Customer Handling:** The Node.js backend intelligently queries `rebilly.customers.getAll()`. If an email exists, it securely reuses the underlying Customer ID array. If new, it creates the customer.
*   **Dynamic UI Blending:** The custom Vue/Vanilla SPA slider utilizes a `ResizeObserver` to track the exact height of the asynchronously-loaded Rebilly iframe. This guarantees no UI clipping regardless of dynamic validation errors or payment method expansion (e.g., Apple Pay). The iframe inherits a strict Apple `SF Pro Display` theme configuration.

## Requirements
*   Node.js (v18+)
*   pnpm (for frontend dependencies)
*   A Rebilly Sandbox or Production Account

## Environment Setup

You must create a `.env` file in the `backend/` directory:

```env
REBILLY_API_SECRET_KEY=sk_sandbox_...
REBILLY_ORGANIZATION_ID=...
REBILLY_WEBSITE_ID=...
PORT=3001
```

## Running the Project

### 1. Start the Backend API
The backend acts as a secure proxy to authenticate the customer with Rebilly and generate a scoped JSON Web Token (JWT).
```bash
cd backend
npm install
node server.js
```
The server will run on `http://localhost:3001`.

### 2. Start the Frontend App
The `apple/` frontend directory contains the Vite-powered SPA.
```bash
cd apple
pnpm install
pnpm dev
```
The checkout UI will launch on `http://localhost:5173`.

---

### Local Development Notes
*   **Apple Pay Error:** If you see `InvalidAccessError` regarding Apple Pay in your browser console, this is **normal**. Apple Pay requires an `https://` secure context to initialize. This error proves the Instruments SDK is working and will clear once deployed to production.
*   **Adblockers:** Browsers with strict adblockers (e.g., Brave) will block Rebilly's internal Datadog metric loggers. This causes a harmless yellow warning in your console and does not affect the payment flow in any way.
