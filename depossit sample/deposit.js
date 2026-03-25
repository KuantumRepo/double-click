const customerId = "cus_01HMW4HF2QMJZ3EJKEQ7T04TFQ";

(async () => {
    const response = await fetch("/deposit-request", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({ customerId }),
    });
    const { token, depositRequestId } = await response.json();

    RebillyInstruments.mount({
        apiMode: "sandbox",
        deposit: {
            depositRequestId,
        },
        jwt: token,
    });
    RebillyInstruments.on("instrument-ready", (instrument) => {
        console.info("instrument-ready", instrument);
    });

    RebillyInstruments.on("purchase-completed", (purchase) => {
        console.info("purchase-completed", purchase);
    });
})();