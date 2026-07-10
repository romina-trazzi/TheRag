document.addEventListener("DOMContentLoaded", () => {
    const askButton = document.getElementById("askButton");
    const questionInput = document.getElementById("questionInput");

    if (askButton) {
        askButton.addEventListener("click", askQuestion);
    }

    if (questionInput) {
        questionInput.addEventListener("keydown", event => {
            if (event.key === "Enter" && event.ctrlKey) {
                event.preventDefault();
                askQuestion();
            }
        });
    }
});


async function askQuestion() {
    const questionInput = document.getElementById("questionInput");
    const answerBox = document.getElementById("answerBox");
    const sourcesBox = document.getElementById("sourcesBox");
    const loadingMessage = document.getElementById("loadingMessage");
    const askButton = document.getElementById("askButton");

    if (
        !questionInput ||
        !answerBox ||
        !sourcesBox ||
        !loadingMessage ||
        !askButton
    ) {
        console.error("Uno o più elementi della pagina RAG non sono stati trovati.");
        return;
    }

    const query = questionInput.value.trim();

    if (!query) {
        showMessage(
            answerBox,
            "Scrivi una domanda prima di inviare.",
            true
        );
        return;
    }

    if (query.length < 3) {
        showMessage(
            answerBox,
            "La domanda è troppo corta.",
            true
        );
        return;
    }

    answerBox.innerHTML = "";
    sourcesBox.innerHTML = "";

    loadingMessage.classList.remove("hidden");
    askButton.disabled = true;
    askButton.textContent = "Attendi...";

    try {
        const data = await apiRequest("/query", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ query })
        });

        renderAnswer(data.answer);
        renderSources(data.sources || []);
    } catch (error) {
        console.error("Errore durante la query:", error);

        showMessage(
            answerBox,
            error.message || "Errore durante la generazione della risposta.",
            true
        );
    } finally {
        loadingMessage.classList.add("hidden");
        askButton.disabled = false;
        askButton.textContent = "Chiedi";
    }
}


function renderAnswer(answer) {
    const answerBox = document.getElementById("answerBox");

    if (!answerBox) return;

    if (!answer) {
        showMessage(
            answerBox,
            "Il modello non ha restituito una risposta.",
            true
        );
        return;
    }

    answerBox.textContent = answer;
    answerBox.classList.remove("error");
}


function renderSources(sources) {
    const sourcesBox = document.getElementById("sourcesBox");

    if (!sourcesBox) return;

    sourcesBox.innerHTML = "";

    if (!sources.length) {
        sourcesBox.innerHTML = `
            <p class="muted">
                Nessuna fonte disponibile.
            </p>
        `;
        return;
    }

    sources.forEach((source, index) => {
        const sourceItem = document.createElement("article");
        sourceItem.className = "source-item";

        sourceItem.innerHTML = createSourceHtml(source, index);

        sourcesBox.appendChild(sourceItem);
    });
}


function createSourceHtml(source, index) {
    /*
     * Gestisce sia fonti stringa sia oggetti.
     * Potremo precisarlo quando vedremo la struttura
     * effettivamente restituita da query.py.
     */

    if (typeof source === "string") {
        return `
            <h3>Fonte ${index + 1}</h3>
            <p>${escapeHtml(source)}</p>
        `;
    }

    const fileName =
        source.file_name ||
        source.source ||
        source.filename ||
        "Fonte senza nome";

    const content =
        source.content ||
        source.text ||
        source.document ||
        source.chunk ||
        "";

    const score =
        source.score ??
        source.distance ??
        null;

    return `
        <h3>
            ${escapeHtml(fileName)}
        </h3>

        ${
            score !== null
                ? `
                    <p class="source-score">
                        <strong>Score:</strong>
                        ${escapeHtml(score)}
                    </p>
                `
                : ""
        }

        ${
            content
                ? `
                    <p class="source-content">
                        ${escapeHtml(content)}
                    </p>
                `
                : ""
        }
    `;
}