// ---------------------------------------------------------------------------
// Rebilly Instruments global type declaration
// ---------------------------------------------------------------------------
declare const RebillyInstruments: {
    mount(config: Record<string, unknown>): Promise<void>;
    on(event: string, cb: (data: unknown) => void): void;
};

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
// Using relative path for unified monolithic deployment (eliminates CORS)

document.addEventListener('DOMContentLoaded', () => {
    // ── SPA Slider Elements ──────────────────────────────────────────
    const spaTrack = document.getElementById('spa-track') as HTMLElement;
    const formViewport = document.getElementById('portal-form-container') as HTMLElement;

    const btn1 = document.getElementById('btn-continue-1') as HTMLButtonElement;
    const btn2 = document.getElementById('btn-continue-2') as HTMLButtonElement;
    const btnConfirmAmount = document.getElementById('btn-confirm-amount') as HTMLButtonElement;

    const emailInput = document.getElementById('auth-email') as HTMLInputElement;
    const nameInput = document.getElementById('auth-name') as HTMLInputElement;
    const amountInput = document.getElementById('auth-amount') as HTMLInputElement;

    const summaryEmail = document.getElementById('summary-email') as HTMLElement;
    const summaryName = document.getElementById('summary-name') as HTMLElement;

    // ── Success Receipt Elements ─────────────────────────────────────
    const successContainer = document.getElementById('success-receipt-container') as HTMLElement;
    const receiptEmailDisplay = document.getElementById('receipt-email-display') as HTMLElement;
    const receiptAmountDisplay = document.getElementById('receipt-amount-display') as HTMLElement;

    // ── Loading / Amount Entry Elements ──────────────────────────────
    const rebillyLoading = document.getElementById('rebilly-loading') as HTMLElement;
    const amountEntry = document.getElementById('amount-entry') as HTMLElement;

    // ── Viewport Height Calc ─────────────────────────────────────────
    function updateViewportHeight(viewIndex: number) {
        const activeView = document.getElementById(`view-${viewIndex + 1}`);
        if (activeView && formViewport) {
            formViewport.style.height = `${activeView.offsetHeight}px`;
        }
    }

    // ── View Navigation ──────────────────────────────────────────────
    function navigateToView(viewIndex: number) {
        const percentage = viewIndex * -33.3333;
        spaTrack.style.transform = `translateX(${percentage}%)`;
        updateViewportHeight(viewIndex);

        setTimeout(() => {
            const currentView = document.getElementById(`view-${viewIndex + 1}`);
            const input = currentView?.querySelector('input');
            if (input) input.focus();
        }, 400);
    }

    // ── Currency Formatter ───────────────────────────────────────────
    function formatCurrency(value: number): string {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    }

    // ── Input Validation ─────────────────────────────────────────────
    emailInput.addEventListener('input', () => {
        btn1.disabled = emailInput.value.length < 3 || !emailInput.value.includes('@');
    });
    nameInput.addEventListener('input', () => {
        btn2.disabled = nameInput.value.length < 2;
    });
    amountInput.addEventListener('input', () => {
        const val = parseFloat(amountInput.value);
        btnConfirmAmount.disabled = isNaN(val) || val < 1;
    });

    // ── Step 1 → Step 2 ──────────────────────────────────────────────
    btn1.addEventListener('click', () => {
        summaryEmail.innerText = emailInput.value;
        navigateToView(1);
    });

    // ── Step 2 → Step 3 ──────────────────────────────────────────────
    btn2.addEventListener('click', () => {
        summaryName.innerText = nameInput.value;
        navigateToView(2);
    });

    // ── Step 3: Confirm Amount → Mount Rebilly ───────────────────────
    btnConfirmAmount.addEventListener('click', async () => {
        const amount = parseFloat(amountInput.value);
        if (isNaN(amount) || amount < 1) return;

        // Hide amount input, show loading
        amountEntry.style.display = 'none';
        rebillyLoading.style.display = 'flex';
        updateViewportHeight(2);

        try {
            // Parse first/last name
            const nameParts = nameInput.value.trim().split(/\s+/);
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            // Call backend via relative monolithic path
            const response = await fetch('/api/deposit-request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    email: emailInput.value,
                    firstName,
                    lastName,
                }),
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const { token } = await response.json();

            // Hide loading
            rebillyLoading.style.display = 'none';

            // Mount Rebilly — money flow (payment methods only)
            await RebillyInstruments.mount({
                apiMode: 'sandbox',
                money: {
                    amount,
                    currency: 'USD',
                },
                jwt: token,
                theme: {
                    colorPrimary: '#0066CC',
                    colorText: '#1D1D1F',
                    colorDanger: '#d70015',
                    colorBackground: '#FFFFFF',
                    fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                },
                paymentInstruments: {
                    address: {
                        show: ['all'],
                        require: ['address', 'city', 'country', 'postalCode'],
                    },
                },
            });

            // Dynamically resize height based on iframe changes to prevent clipping
            const view3 = document.getElementById('view-3');
            if (view3) {
                const observer = new ResizeObserver(() => {
                    // Only update if viewport is currently showing view 3 to prevent backward slide jumps
                    if (spaTrack.style.transform.includes('-66')) {
                        updateViewportHeight(2);
                    }
                });
                // Watch the main view container
                observer.observe(view3);
                
                // Also directly watch the Rebilly injection div in case it changes size without pushing the parent immediately
                const rebillyContainer = document.querySelector('.rebilly-instruments');
                if (rebillyContainer) {
                    observer.observe(rebillyContainer);
                }
            }
            
            // Initial fallback
            setTimeout(() => updateViewportHeight(2), 100);
            setTimeout(() => updateViewportHeight(2), 500);

        } catch (err) {
            console.error('Failed to initialize deposit:', err);
            rebillyLoading.style.display = 'none';
            amountEntry.style.display = 'block';
            amountEntry.innerHTML = '<p class="microcopy text-center" style="color:#d70015;">Unable to load checkout. Please try again.</p>';
        }
    });

    // ── Rebilly Lifecycle Events ─────────────────────────────────────
    RebillyInstruments.on('instrument-ready', (instrument) => {
        console.info('instrument-ready', instrument);
    });

    RebillyInstruments.on('purchase-completed', (purchase: any) => {
        console.info('purchase-completed', purchase);

        // Transition to success receipt
        formViewport.style.opacity = '0';

        setTimeout(() => {
            formViewport.classList.add('hidden');

            // Inject values into receipt
            receiptEmailDisplay.innerText = emailInput.value;
            const txAmount = purchase?.amount || purchase?.transaction?.amount || parseFloat(amountInput.value);
            receiptAmountDisplay.innerText = formatCurrency(txAmount);

            successContainer.classList.remove('fade-hidden');
            successContainer.style.opacity = '0';

            setTimeout(() => {
                successContainer.style.opacity = '1';
            }, 20);
        }, 300);
    });

    // ── Back Navigation ──────────────────────────────────────────────
    const backNavs = document.querySelectorAll('.back-btn, .step-edit-btn');
    backNavs.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetStr = (e.currentTarget as HTMLElement).getAttribute('data-target');
            if (targetStr !== null) {
                navigateToView(parseInt(targetStr, 10) - 1);
            }
        });
    });

    // ── Initial Setup ────────────────────────────────────────────────
    setTimeout(() => updateViewportHeight(0), 50);
});
