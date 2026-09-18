const SUPABASE_URL = "https://<jouw-project-id>.supabase.co";
const SUPABASE_KEY = "<anon_key>";

form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const originalAmount = parseFloat(document.getElementById('amount').value);
    const currency = document.getElementById('currency').value;
    const bank = document.getElementById('bank').value;
    const account = document.getElementById('account').value;
    const description = document.getElementById('description').value;

    let euroAmount = originalAmount;

    if (currency === 'SRD') euroAmount = originalAmount * (1/35);
    if (currency === 'USD') euroAmount = originalAmount * 0.92;

    euroAmount = parseFloat(euroAmount.toFixed(2));

    const response = await fetch(`${SUPABASE_URL}/rest/v1/betaalverzoeken`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({
            naam: name,
            bedrag: euroAmount,
            bank: bank,
            rekeningnummer: account,
            omschrijving: description
        })
    });

    const data = await response.json();

    if (data && data.length > 0) {
        const databaseId = data[0].id;
        const currentUrl = window.location.href.replace('index.html', '');
        const generatedLink = `${currentUrl}betaal.html?id=${databaseId}`;

        linkInput.value = generatedLink;
        resultDiv.classList.add('visible');

        const whatsappBericht = `Hoi! Hier is een Suritiki betaalverzoek van ${name}. Of je ${currency} ${originalAmount} (omgerekend € ${euroAmount}) wilt overmaken voor "${description || 'Betaalverzoek'}". Betaal via deze link: ${generatedLink}`;

        whatsappBtn.onclick = function() {
            window.open(`https://wa.me/?text=${encodeURIComponent(whatsappBericht)}`, '_blank');
        };
    }
});
