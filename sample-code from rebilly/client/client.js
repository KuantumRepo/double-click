const customerId = "cus_01HMW4HF2QMJZ3EJKEQ7T04TFQ";

(async () => {
    const response = await fetch("/authenticate", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({ customerId }),
    });
    const { token } = await response.json();

    RebillyInstruments.mount({
        apiMode: "sandbox",
        invoiceId: "in_01HTQB8FKKE4C8B79HK1TY3FP9",
        jwt: token,
    });

    // Optional
    RebillyInstruments.on("instrument-ready", (instrument) => {
        console.info("instrument-ready", instrument);
    });

    RebillyInstruments.on("purchase-completed", (purchase) => {
        console.info("purchase-completed", purchase);
    });
})();
