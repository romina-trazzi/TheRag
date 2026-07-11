// Funzione asincrona per inviare richieste API al backend
async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(url, options);

        let data = null;

        try {
            data = await response.json();
        } catch {
            data = null;
        }

        if (!response.ok) {
            const message = data?.error || `Errore HTTP ${response.status}`;
            throw new Error(message);
        }

        return data;
    } catch (error) {
        console.error("Errore richiesta API:", error);
        throw error;
    }
}

// Funzione per mostrare i dati JSON in un elemento HTML
function showJson(element, data) {
    element.textContent = JSON.stringify(data, null, 2);
    element.classList.remove("error");
}

// Funzione per mostrare un messaggio in un elemento HTML
function showMessage(element, message, isError = false) {
    element.textContent = message;

    if (isError) {
        element.classList.add("error");
    } else {
        element.classList.remove("error");
    }
}


// Funzione per caratteri di escape HTML 
function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// Funzione per formattare al meglio la data
function formatDate(dateString) {
    if (!dateString) {
        return "n/d";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleString("it-IT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

