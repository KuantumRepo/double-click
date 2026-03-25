require("dotenv").config();
const express = require("express");
const cors = require("cors");
const RebillyAPI = require("rebilly-js-sdk").default;

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const {
    REBILLY_API_SECRET_KEY,
    REBILLY_ORGANIZATION_ID,
    REBILLY_WEBSITE_ID,
    PORT = 3001,
} = process.env;

if (!REBILLY_API_SECRET_KEY || !REBILLY_ORGANIZATION_ID || !REBILLY_WEBSITE_ID) {
    console.error("Missing required env vars. Copy .env.example → .env and fill in your Rebilly credentials.");
    process.exit(1);
}

// ---------------------------------------------------------------------------
// Express
// ---------------------------------------------------------------------------
const app = express();
app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// Rebilly SDK
// ---------------------------------------------------------------------------
const rebilly = RebillyAPI({
    sandbox: true,
    organizationId: REBILLY_ORGANIZATION_ID,
    apiKey: REBILLY_API_SECRET_KEY,
});

// ---------------------------------------------------------------------------
// POST /api/deposit-request
//
// Body: { email, firstName, lastName? }
//
// 1. Upsert customer in Rebilly
// 2. Passwordless login → exchange for JWT
// 3. Create deposit request
// 4. Return { token, depositRequestId }
// ---------------------------------------------------------------------------
app.post("/api/deposit-request", async (req, res) => {
    try {
        const { email, firstName, lastName = "" } = req.body;

        if (!email || !firstName) {
            return res.status(400).json({ error: "email and firstName are required" });
        }

        // ── 1. Create or Find customer (handle returning customers) ──────
        let customerId;

        // Step A: Search if customer already exists by email
        const { items } = await rebilly.customers.getAll({
            limit: 1,
            filter: `primaryAddress.emails.value:"${email}"`,
        });

        if (items && items.length > 0) {
            // Customer exists! Use their existing ID
            customerId = items[0].fields.id;
        } else {
            // New customer! Create them
            const { fields: customer } = await rebilly.customers.create({
                data: {
                    primaryAddress: {
                        firstName,
                        lastName,
                        emails: [{ label: "main", value: email }],
                    },
                    websiteId: REBILLY_WEBSITE_ID,
                },
            });
            customerId = customer.id;
        }

        // ── 2. Passwordless login ────────────────────────────────────────
        const { fields: login } = await rebilly.customerAuthentication.login({
            data: {
                mode: "passwordless",
                customerId,
            },
        });

        // ── 3. Exchange token → JWT ──────────────────────────────────────
        const { fields: exchangeToken } = await rebilly.customerAuthentication.exchangeToken({
            token: login.token,
            data: {
                acl: [
                    {
                        scope: {
                            organizationId: [REBILLY_ORGANIZATION_ID],
                        },
                        permissions: [
                            "PostToken",
                            "PostDigitalWalletValidation",
                            "StorefrontGetAccount",
                            "StorefrontPatchAccount",
                            "StorefrontPostPayment",
                            "StorefrontGetTransactionCollection",
                            "StorefrontGetTransaction",
                            "StorefrontGetPaymentInstrumentCollection",
                            "StorefrontPostPaymentInstrument",
                            "StorefrontGetPaymentInstrument",
                            "StorefrontPatchPaymentInstrument",
                            "StorefrontPostPaymentInstrumentDeactivation",
                            "StorefrontGetWebsite",
                            "StorefrontGetInvoiceCollection",
                            "StorefrontGetInvoice",
                            "StorefrontGetProductCollection",
                            "StorefrontGetProduct",
                            "StorefrontPostReadyToPay",
                            "StorefrontGetPaymentInstrumentSetup",
                            "StorefrontPostPaymentInstrumentSetup",
                            "StorefrontGetDepositRequest",
                            "StorefrontGetDepositStrategy",
                            "StorefrontPostDeposit",
                        ],
                    },
                ],
                customClaims: {
                    websiteId: REBILLY_WEBSITE_ID,
                },
            },
        });

        // ── 4. Respond ───────────────────────────────────────────────────
        res.json({
            token: exchangeToken.token,
        });

    } catch (err) {
        console.error("Token exchange failed:", err?.response?.data || err.message || err);
        res.status(500).json({ error: "Failed to authenticate customer" });
    }
});

// ---------------------------------------------------------------------------
// Start (Monolithic Static + API Server)
// ---------------------------------------------------------------------------
const path = require("path");

// Serve Vite frontend static assets
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// SPA Catch-all route 
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

app.listen(PORT, () => {
    console.log(`Backend securely listening on http://localhost:${PORT}`);
});
