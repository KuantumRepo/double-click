# Payment form using a JWT example

This example describes how to integrate an embedded payment form into your website.
It uses the Rebilly Instruments JavaScript library, [Rebilly JS SDK](https://www.npmjs.com/package/rebilly-js-sdk), [Express JS](https://expressjs.com/en/starter/installing.html), and a JWT for authentication.

To view the integration guide, see [Payment form using a JWT](https://rebilly.com/docs/dev-docs/process-a-payment-jwt.md).

## Setup

1. Install dependencies: `npm install`

2. Configure credentials:

> In production, it is recommended to use a secrets manager to store your secret key instead of including it alongside code.

In `server.js`, update the following variables with your credentials: `REBILLY_API_SECRET_KEY`, `REBILLY_WEBSITE_ID`, `REBILLY_ORGANIZATION_ID`.

3. Set customer and invoice values:

In `client/client.js`, replace the following transaction values. These values must exist in the sandbox environment:

- `customerId`.
  For more information, see [Upsert a customer](https://rebilly.com/docs/dev-docs/api/customers/putcustomer/).
- `invoiceId`.
  For more information, see [Upsert an invoice](https://rebilly.com/docs/dev-docs/api/invoices/putinvoice/).

## Start the sample application

1. Start a server: `node server.js`

2. Open the application: [http://localhost:3000](http://localhost:3000)

3. Test the payment flow: Select a payment method and press **Continue**.

## Error handling

Errors from the server are logged to your console.
Check the browser's developer tools for client-side errors.
