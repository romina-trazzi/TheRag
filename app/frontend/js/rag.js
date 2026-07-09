const questionInput = document.getElementById("questionInput");
const askButton = document.getElementById("askButton");
const answerBox = document.getElementById("answerBox");
const sourcesBox = document.getElementById("sourcesBox");
const loadingMessage = document.getElementById("loadingMessage");

document.addEventListener("DOMContentLoaded", () => {
    const queryButton = document.getElementById("queryButton");

    if (queryButton) {
        queryButton.addEventListener("click", askQuestion);
    }
});


async function askQuestion() {
    const queryInput = document.getElementById("queryInput");
    const answerOutput = document.getElementById("answer");

    if (!queryInput || !answerOutput) return;

    const query = queryInput.value.trim();

    if (!query) {
        showMessage(answerOutput, "Scrivi una domanda prima di inviare.", true);
        return;
    }

    if (query.length < 3) {
        showMessage(answerOutput, "La domanda è troppo corta.", true);
        return;
    }

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