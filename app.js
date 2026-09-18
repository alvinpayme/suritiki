const KOERS_SRD_NAAR_EUR = 1 / 41.5;
const KOERS_USD_NAAR_EUR = 0.92;

(() => {
    'use strict';

    const config = window.SURITIKI_CONFIG || {};
    const form = document.getElementById('paymentForm');
    const result = document.getElementById('result');
    const linkInput = document.getElementById('generatedLink');
    const copyBtn = document.getElementById('copyBtn');
    const whatsappBtn = document.getElementById('whatsappBtn');
    const submitBtn = document.getElementById('submitBtn');
    const statusMessage = document.getElementById('statusMessage');
    let whatsappMessage = '';

    if (!form) return;

    const showError = (message) => {
        if (statusMessage) statusMessage.textContent = message;
    };

    const isConfigured = () => !!(
        config.SUPABASE_URL &&
        config.SUPABASE_KEY &&
        !config.SUPABASE_URL.includes('JOUW-PROJECT-REF') &&
        !config.SUPABASE_KEY.includes('JOUW-SUPABASE-ANON-KEY')
    );

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (statusMessage) statusMessage.textContent = '';
        if (result) result.classList.add('hidden');

        if (!isConfigured()) {
            showError('Vul eerst SUPABASE_URL en SUPABASE_KEY in config.js in.');
            return;
        }

        const originalAmount = Number.parseFloat(document.getElementById('amount').value);
        if (!Number.isFinite(originalAmount) || originalAmount <= 0) {
            showError('Vul een geldig bedrag groter dan nul in.');
            return;
        }

        const currency = document.getElementById('currency').value;
        const euroAmount = Number(
            (currency === 'SRD'
                ? originalAmount * KOERS_SRD_NAAR_EUR
                : currency === 'USD'
                    ? originalAmount * KOERS_USD_NAAR_EUR
                    : originalAmount
            ).toFixed(2)
        );

        const payload = {
            naam: document.getElementById('name').value.trim(),
            bedrag: euroAmount,
            bank: document.getElementById('bank').value,
            rekeningnummer: document.getElementById('account').value.trim(),
            omschrijving: document.getElementById('description').value.trim(),
            betaallink: document.getElementById('paymentUrl').value.trim() || null
        };

        submitBtn.disabled = true;

        try {
            const response = await fetch(`${config.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/betaalverzoeken`, {
                method: 'POST',
                headers: {
                    apikey: config.SUPABASE_KEY,
                    Authorization: `Bearer ${config.SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    Prefer: 'return=representation'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(data?.message || data?.hint || `HTTP ${response.status}`);
            }

            const record = Array.isArray(data) ? data[0] : data;
            if (!record?.public_token) {
                throw new Error('De database gaf geen publieke token terug.');
            }

            const paymentUrl = new URL('betaal.html', window.location.href);
            paymentUrl.searchParams.set('token', record.public_token);
            linkInput.value = paymentUrl.href;
            whatsappMessage = `Hoi! Hier is een Suritiki-betaalverzoek van ${payload.naam}. Bedrag: ${currency} ${originalAmount.toFixed(2)} (omgerekend € ${euroAmount.toFixed(2)}). Omschrijving: ${payload.omschrijving || 'Betaalverzoek'}. ${paymentUrl.href}`;
            result.classList.remove('hidden');
        } catch (error) {
            showError(`Opslaan mislukt: ${error.message}`);
        } finally {
            submitBtn.disabled = false;
        }
    });

    copyBtn?.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(linkInput.value);
            copyBtn.textContent = 'Gekopieerd!';
            setTimeout(() => {
                copyBtn.textContent = 'Kopieer link';
            }, 1500);
        } catch {
            linkInput.select();
            document.execCommand('copy');
        }
    });

    whatsappBtn?.addEventListener('click', () => {
        if (whatsappMessage) {
            window.open(`https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`, '_blank', 'noopener,noreferrer');
        }
    });
})();
