// Inizializza gli eventi al caricamento del DOM 
document.addEventListener("DOMContentLoaded", () => {
    bindEvents();
});


// Funzione per legare un evento a un button
function bindEvents() {

    const queryButton = document.getElementById("queryButton");

    if (queryButton) {
        queryButton.addEventListener("click", askQuestion);
    }
}

// Funzione per inviare la domanda dell'utente al backend e visualizzare la risposta
async function askQuestion() {

    // Selezione degli elementi HTML per ottenere la domanda e visualizzare la risposta
    const queryInput = document.getElementById("queryInput");
    const answerOutput = document.getElementById("answer");

    if (!queryInput || !answerOutput) return;

    const query = queryInput.value.trim();

    // Se la query ha problemi
    if (!query) {
        showMessage(answerOutput, "Scrivi una domanda prima di inviare.", true);
        return;
    }

    if (query.length < 3) {
        showMessage(answerOutput, "La domanda è troppo corta.", true);
        return;
    }

    // Mostra un messaggio di caricamento mentre si attende la risposta
    try {
        showMessage(answerOutput, "Sto generando la risposta...");

        const data = await apiRequest("/query", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ query })
        });

        showJson(answerOutput, data);

    } catch (error) {
        
        showMessage(answerOutput, error.message, true);
    }
}

