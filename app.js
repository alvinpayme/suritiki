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

    const showError = (message) => { statusMessage.textContent = message; };
    const isConfigured = () => config.SUPABASE_URL && config.SUPABASE_KEY
        && /^https:\/\/[^/]+\.supabase\.co$/.test(config.SUPABASE_URL)
        && !config.SUPABASE_KEY.includes('JOUW-SUPABASE-ANON-KEY');

    const createId = () => {
        if (window.crypto?.randomUUID) return window.crypto.randomUUID();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
            const random = Math.random() * 16 | 0;
            const value = character === 'x' ? random : (random & 0x3 | 0x8);
            return value.toString(16);
        });
    };

    if (!form) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        statusMessage.textContent = '';
        result.classList.add('hidden');
        whatsappBtn.classList.add('hidden');

        if (!isConfigured()) {
            showError('Controleer SUPABASE_URL en SUPABASE_KEY in config.js.');
            return;
        }

        const name = document.getElementById('name').value.trim();
        const account = document.getElementById('account').value.trim();
        const originalAmount = Number.parseFloat(document.getElementById('amount').value);
        if (!name || !account || !Number.isFinite(originalAmount) || originalAmount <= 0) {
            showError('Vul alle verplichte velden en een geldig bedrag in.');
            return;
        }

        const currency = document.getElementById('currency').value;
        const euroAmount = Number((currency === 'SRD' ? originalAmount / 35 : currency === 'USD' ? originalAmount * 0.92 : originalAmount).toFixed(2));
        const id = createId();
        const payload = {
            id,
            naam: name,
            bedrag: euroAmount,
            bank: document.getElementById('bank').value,
            rekeningnummer: account,
            omschrijving: document.getElementById('description').value.trim()
        };

        submitBtn.disabled = true;
        try {
            const endpoint = `${config.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/betaalverzoeken?select=id`;
            const response = await fetch(endpoint, {
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
                const detail = data?.message || data?.hint || data?.details || `HTTP ${response.status}`;
                throw new Error(detail);
            }

            // The ID is generated before saving, so it is available even when
            // the REST response contains no representation because of API settings.
            const savedId = data?.[0]?.id || data?.id || id;
            const paymentUrl = new URL('betaal.html', window.location.href);
            paymentUrl.searchParams.set('id', savedId);
            linkInput.value = paymentUrl.href;
            whatsappBtn.href = `https://wa.me/?text=${encodeURIComponent(`Bekijk mijn Suritiki-betaalverzoek: ${paymentUrl.href}`)}`;
            whatsappBtn.classList.remove('hidden');
            result.classList.remove('hidden');
        } catch (error) {
            showError(`Opslaan mislukt: ${error.message}`);
        } finally {
            submitBtn.disabled = false;
        }
    });

    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(linkInput.value);
            copyBtn.textContent = 'Gekopieerd!';
            setTimeout(() => { copyBtn.textContent = 'Kopieer link'; }, 1500);
        } catch {
            linkInput.select();
            document.execCommand('copy');
        }
    });
})();
