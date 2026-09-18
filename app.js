// HIER KOPPELEN WE JOUW ONLINE KLUIS
const SUPABASE_URL = "https://supabase.co";
const SUPABASE_KEY = "sb_publishable_5GMOHN817SlzWPDo7SW8rw_ghHJhqFE"; 

const form = document.getElementById('paymentForm');
const resultDiv = document.getElementById('result');
const linkInput = document.getElementById('generatedLink');
const copyBtn = document.getElementById('copyBtn');

const KOERS_SRD_NAAR_EUR = 1 / 35; 
const KOERS_USD_NAAR_EUR = 0.92;

const whatsappBtn = document.createElement('button');
whatsappBtn.innerText = "Deel via WhatsApp 💬";
whatsappBtn.style.backgroundColor = "#25D366"; 
whatsappBtn.style.marginTop = "8px";
resultDiv.appendChild(whatsappBtn);

form.addEventListener('submit', async function(e) {
    e.preventDefault(); 

    const name = document.getElementById('name').value;
    const originalAmount = parseFloat(document.getElementById('amount').value);
    const currency = document.getElementById('currency').value;
    const bank = document.getElementById('bank').value;
    const account = document.getElementById('account').value;
    const description = document.getElementById('description').value;
    
    let euroAmount = originalAmount;
    if (currency === 'SRD') {
        euroAmount = originalAmount * KOERS_SRD_NAAR_EUR;
    } else if (currency === 'USD') {
        euroAmount = originalAmount * KOERS_USD_NAAR_EUR;
    }
    euroAmount = parseFloat(euroAmount.toFixed(2));

    try {
        // We sturen het hier direct en dwingend naar JOUW unieke database link!
        const response = await fetch("https://supabase.co/rest/v1/betaalverzoeken", {
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

copyBtn.addEventListener('click', function() {
    linkInput.select();
    linkInput.setSelectionRange(0, 99999); 
    navigator.clipboard.writeText(linkInput.value);
    
    copyBtn.innerText = "Gekopieerd! ✅";
    setTimeout(() => {
        copyBtn.innerText = "Kopieer link";
    }, 2000);
});
