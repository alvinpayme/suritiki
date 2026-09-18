// HIER KOPPELEN WE JOUW ONLINE KLUIS
const SUPABASE_URL = "https://supabase.co";
// PLAK HIERONDER JOUW GEKOPIEERDE SLEUTEL TUSSEN DE AANHALINGSTEKENS:
const SUPABASE_KEY = "sb_publishable_5GMOHN8l7S1zWPDo78W0rw_ghHJhqfE";

// We zoeken alle elementen op uit de HTML pagina
const form = document.getElementById('paymentForm');
const resultDiv = document.getElementById('result');
const linkInput = document.getElementById('generatedLink');
const copyBtn = document.getElementById('copyBtn');

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
    const amount = document.getElementById('amount').value;
    const currency = document.getElementById('currency').value;
    const bank = document.getElementById('bank').value;
    const account = document.getElementById('account').value;
    const description = document.getElementById('description').value;
    
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
                bedrag: parseFloat(amount),
                bank: bank,
                rekeningnummer: account,
                omschrijving: description
            })
        });

        const data = await response.json();
        
        // Als het opslaan in de database is gelukt, maken we een unieke link met het ID uit de database
        if (data && data[0]) {
            const databaseId = data[0].id;
            const currentUrl = window.location.href.replace('index.html', '');
            
            // De link verwijst nu naar het unieke ID in je kluis, hackers kunnen hier niks aan veranderen!
            const generatedLink = `${currentUrl}betaal.html?id=${databaseId}`;
            
            linkInput.value = generatedLink;
            resultDiv.classList.add('visible'); 

            // We maken de kant-en-klare tekst voor WhatsApp
            const whatsappBericht = `Hoi! Hier is een Suritiki betaalverzoek. Of je dit via de link wilt voldoen: ${generatedLink}`;
            
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
    
    copyBtn.innerText = "Gekopieerd! ✅";
    setTimeout(() => {
        copyBtn.innerText = "Kopieer link";
    }, 2000);
});