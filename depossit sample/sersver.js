const express = require("express");
const bodyParser = require("body-parser");
const RebillyAPI = require("rebilly-js-sdk").default;

const app = express();
const port = 3000;
app.use(express.static("client"));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const REBILLY_API_SECRET_KEY = "REBILLY_API_SECRET_KEY";
const REBILLY_WEBSITE_ID = "REBILLY_WEBSITE_ID";
const REBILLY_ORGANIZATION_ID = "REBILLY_ORGANIZATION_ID";

const rebilly = RebillyAPI({
    sandbox: true,
    organizationId: REBILLY_ORGANIZATION_ID,
    apiKey: REBILLY_API_SECRET_KEY,
});

app.get("/deposit", async (req, res) => {
    res.redirect(301, "/deposit.html");
});

app.post("/deposit-request", async function (req, res) {

    const { customerId } = req.body;
    const response = {};
    const data = {
        mode: "passwordless",
        customerId,
    };
    const { fields: login } = await rebilly.customerAuthentication.login({
        data,
    });

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

    const requestDepositData = {
        websiteId: REBILLY_WEBSITE_ID,
        customerId,
        currency: "USD",
        amounts: [50, 100],
    };

    const { fields: depositFields } = await rebilly.depositRequests.create({
        data: requestDepositData,
    });

    response.token = exchangeToken.token;
    response.depositRequestId = depositFields.id;

    res.send(response);
});

app.listen(port, () => {
    console.log(`Sandbox listening on port ${port}`);
});