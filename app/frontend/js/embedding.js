document.addEventListener("DOMContentLoaded", () => {
    const uploadButton = document.getElementById("uploadButton");
    const refreshFilesButton = document.getElementById("refreshFilesButton");
    const closeChunksButton = document.getElementById("closeChunksButton");

    if (uploadButton) {
        uploadButton.addEventListener("click", uploadFile);
    }

    if (refreshFilesButton) {
        refreshFilesButton.addEventListener("click", loadFiles);
    }

    if (closeChunksButton) {
        closeChunksButton.addEventListener("click", closeChunks);
    }

    loadFiles();
});


async function uploadFile() {
    const fileInput = document.getElementById("fileInput");
    const uploadStatus = document.getElementById("uploadStatus");

    if (!fileInput || !uploadStatus) {
        console.error("Elementi fileInput o uploadStatus non trovati.");
        return;
    }

    const file = fileInput.files[0];

    if (!file) {
        showMessage(
            uploadStatus,
            "Seleziona un file prima di caricare.",
            true
        );
        return;
    }

    const allowedExtensions = [".pdf", ".txt", ".docx"];
    const fileName = file.name.toLowerCase();

    const isValidFile = allowedExtensions.some(extension =>
        fileName.endsWith(extension)
    );

    if (!isValidFile) {
        showMessage(
            uploadStatus,
            "Formato non supportato. Usa PDF, TXT o DOCX.",
            true
        );
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
        showMessage(
            uploadStatus,
            "Caricamento ed embedding in corso..."
        );

        const data = await apiRequest("/embed", {
            method: "POST",
            body: formData
        });

        showMessage(
            uploadStatus,
            data.message || "Documento caricato correttamente."
        );

        fileInput.value = "";

        await loadFiles();
    } catch (error) {
        console.error("Errore durante l'upload:", error);

        showMessage(
            uploadStatus,
            error.message,
            true
        );
    }
}

async function loadFiles() {
    const filesBox = document.getElementById("filesBox");

    if (!filesBox) {
        console.error("Elemento filesBox non trovato.");
        return;
    }

    try {
        filesBox.innerHTML = "<p>Caricamento documenti...</p>";

        const data = await apiRequest("/files");

        renderFiles(data.files || []);
    } catch (error) {
        console.error("Errore durante il caricamento dei file:", error);

        filesBox.innerHTML = `
            <p class="error">${escapeHtml(error.message)}</p>
        `;
    }
}

function renderFiles(files) {
    const filesBox = document.getElementById("filesBox");

    if (!filesBox) return;

    filesBox.innerHTML = "";

    if (!files.length) {
        filesBox.innerHTML = "<p>Nessun documento caricato.</p>";
        return;
    }

    files.forEach(file => {
        const item = document.createElement("div");
        item.className = "file-item";

        item.innerHTML = `
            <div class="file-info">
                <h3 class="file-name">
                    ${escapeHtml(file.file_name || "Senza nome")}
                </h3>

                <div class="file-metadata">
                    <div class="metadata-item metadata-hash">
                        <span class="metadata-label">Hash</span>
                        <code>${escapeHtml(file.file_hash || "")}</code>
                    </div>

                    <div class="metadata-item">
                        <span class="metadata-label">Chunk</span>
                        <span>${file.chunks ?? 0}</span>
                    </div>

                    <div class="metadata-item">
                        <span class="metadata-label">Caricato il</span>
                        <span>${formatDate(file.uploaded_at)}</span>
                    </div>
                </div>
            </div>

            <div class="file-actions">
                <button
                    type="button"
                    class="chunks-button secondary-button"
                >
                    Vedi chunk
                </button>

                <button
                    type="button"
                    class="delete-button danger-button"
                >
                    Elimina
                </button>
            </div>
        `;

        const chunksButton = item.querySelector(".chunks-button");
        const deleteButton = item.querySelector(".delete-button");

        chunksButton.addEventListener("click", () => {
            loadChunks(file.file_hash, file.file_name);
        });

        deleteButton.addEventListener("click", () => {
            deleteFile(file.file_hash, file.file_name);
        });

        filesBox.appendChild(item);
    });
}

async function loadChunks(fileHash, fileName) {
    const chunksBox = document.getElementById("chunksBox");
    const selectedDocument = document.getElementById("selectedDocument");
    const closeChunksButton = document.getElementById("closeChunksButton");

    if (!chunksBox) {
        console.error("Elemento chunksBox non trovato.");
        return;
    }

    if (!fileHash) {
        showMessage(
            chunksBox,
            "Hash del file mancante.",
            true
        );
        return;
    }

    if (selectedDocument) {
        selectedDocument.textContent =
            `Documento selezionato: ${fileName || "Senza nome"}`;
    }

    if (closeChunksButton) {
        closeChunksButton.classList.remove("hidden");
    }

    try {
        showMessage(chunksBox, "Caricamento chunk...");

        const data = await apiRequest(
            `/chunks?file_hash=${encodeURIComponent(fileHash)}`
        );

        renderChunks(data.chunks || []);
    } catch (error) {
        console.error("Errore durante il caricamento dei chunk:", error);

        showMessage(
            chunksBox,
            error.message,
            true
        );
    }
}

function renderChunks(chunks) {
    const chunksBox = document.getElementById("chunksBox");

    if (!chunksBox) return;

    chunksBox.innerHTML = "";

    if (!chunks.length) {
        chunksBox.innerHTML = "<p>Nessun chunk trovato.</p>";
        return;
    }

    chunks.forEach((chunk, index) => {
        const chunkItem = document.createElement("div");
        chunkItem.className = "chunk-item";

        const chunkText =
            chunk.text ||
            chunk.document ||
            chunk.content ||
            JSON.stringify(chunk, null, 2);

        chunkItem.innerHTML = `
            <h3>Chunk ${index + 1}</h3>
            <pre>${escapeHtml(chunkText)}</pre>
        `;

        chunksBox.appendChild(chunkItem);
    });
}

async function deleteFile(fileHash, fileName) {
    const uploadStatus = document.getElementById("uploadStatus");

    if (!fileHash) {
        if (uploadStatus) {
            showMessage(
                uploadStatus,
                "Hash del file mancante.",
                true
            );
        }

        return;
    }

    const confirmed = confirm(
        `Vuoi eliminare "${fileName || "questo documento"}" dal Vector DB?`
    );

    if (!confirmed) return;

    try {
        const data = await apiRequest(
            `/files?file_hash=${encodeURIComponent(fileHash)}`,
            {
                method: "DELETE"
            }
        );

        if (uploadStatus) {
            showMessage(
                uploadStatus,
                data.message || "Documento eliminato."
            );
        }

        closeChunks();

        await loadFiles();
    } catch (error) {
        console.error("Errore durante l'eliminazione:", error);

        if (uploadStatus) {
            showMessage(
                uploadStatus,
                error.message,
                true
            );
        }
    }

    
}

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

function closeChunks() {
    const chunksBox = document.getElementById("chunksBox");
    const selectedDocument = document.getElementById("selectedDocument");
    const closeChunksButton = document.getElementById("closeChunksButton");

    if (chunksBox) {
        chunksBox.innerHTML = "";
    }

    if (selectedDocument) {
        selectedDocument.textContent =
            "Seleziona un documento per vedere i chunk associati.";
    }

    if (closeChunksButton) {
        closeChunksButton.classList.add("hidden");
    }
}