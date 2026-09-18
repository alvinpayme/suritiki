// HIER KOPPELEN WE JOUW ONLINE KLUIS
const SUPABASE_URL = "https://supabase.co";
const SUPABASE_KEY = "sb_publishable_5GMOHN817SlzWPDo7SW8rw_ghHJhqFE"; 

// We zoeken alle elementen op uit de HTML pagina
const form = document.getElementById('paymentForm');
const resultDiv = document.getElementById('result');
const linkInput = document.getElementById('generatedLink');
const copyBtn = document.getElementById('copyBtn');

// Vaste wisselkoersen als basis (deze kun je later live laten updaten)
// Voorbeeld: 1 EUR = 35 SRD, 1 USD = 0.92 EUR
const KOERS_SRD_NAAR_EUR = 1 / 35; 
const KOERS_USD_NAAR_EUR = 0.92;

// We maken dynamisch een WhatsApp-knop aan in de code
const whatsappBtn = document.createElement('button');
whatsappBtn.innerText = "Deel via WhatsApp 💬";
whatsappBtn.style.backgroundColor = "#25D366"; 
whatsappBtn.style.marginTop = "8px";
resultDiv.appendChild(whatsappBtn);

// Dit gebeurt er als je op de grote knop "Maak Suritiki Link" klikt
form.addEventListener('submit', async function(e) {
    e.preventDefault(); 

    // We pakken de ingevulde gegevens uit het formulier
    const name = document.getElementById('name').value;
    const originalAmount = parseFloat(document.getElementById('amount').value);
    const currency = document.getElementById('currency').value;
    const bank = document.getElementById('bank').value;
    const account = document.getElementById('account').value;
    const description = document.getElementById('description').value;
    
    // WISSELKOERS BEREKENING: We rekenen alles om naar Euro's voor jouw ABN AMRO
    let euroAmount = originalAmount;
    if (currency === 'SRD') {
        euroAmount = originalAmount * KOERS_SRD_NAAR_EUR;
    } else if (currency === 'USD') {
        euroAmount = originalAmount * KOERS_USD_NAAR_EUR;
    }
    // Rond netjes af op 2 cijfers achter de komma (bijv. € 14,29)
    euroAmount = parseFloat(euroAmount.toFixed(2));

    // VEILIGHEIDSCHECK EN OPSLAG: We sturen de gegevens nu écht naar je Supabase kluis!
    try {
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
                bedrag: euroAmount, // We slaan het bedrag direct op in Euro's!
                bank: bank,
                rekeningnummer: account,
                omschrijving: description
            })
        });

        const data = await response.json();
        
        if (data && data.length > 0) {
            const databaseId = data[0].id; // We pakken het unieke ID uit de database
            const currentUrl = window.location.href.replace('index.html', '');
            
            // De unieke, veilige link voor de betaler
            const generatedLink = `${currentUrl}betaal.html?id=${databaseId}`;
            
            linkInput.value = generatedLink;
            resultDiv.classList.add('visible'); 

            // We maken het WhatsApp-berichtje compleet met het originele bedrag ter info
            const whatsappBericht = `Hoi! Hier is een Suritiki betaalverzoek van ${name}. Of je ${currency} ${originalAmount} (omgerekend € ${euroAmount}) wilt overmaken voor "${description || 'Betaalverzoek'}". Je kunt via deze link direct met iDEAL betalen: ${generatedLink}`;
            
            whatsappBtn.onclick = function() {
                window.open(`https://whatsapp.com{encodeURIComponent(whatsappBericht)}`, '_blank');
            };
        }
    } catch (error) {
        alert("Oeps! Er ging iets mis met de verbinding naar de kluis.");
        console.error(error);
    }
});

// Code voor de gewone kopieerknop
copyBtn.addEventListener('click', function() {
    linkInput.select();
    linkInput.setSelectionRange(0, 99999); 
    navigator.clipboard.writeText(linkInput.value);
    
    copyBtn.innerText = "Gekopieerd!";
});