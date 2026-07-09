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


function showJson(element, data) {
    element.textContent = JSON.stringify(data, null, 2);
    element.classList.remove("error");
}


function showMessage(element, message, isError = false) {
    element.textContent = message;

    if (isError) {
        element.classList.add("error");
    } else {
        element.classList.remove("error");
    }
}


function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}