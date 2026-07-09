document.addEventListener("DOMContentLoaded", () => {
    const uploadButton = document.getElementById("uploadButton");
    const refreshFilesButton = document.getElementById("refreshFilesButton");

    if (uploadButton) {
        uploadButton.addEventListener("click", uploadFile);
    }

    if (refreshFilesButton) {
        refreshFilesButton.addEventListener("click", loadFiles);
    }

    loadFiles();
});


async function uploadFile() {
    const fileInput = document.getElementById("fileInput");
    const uploadResult = document.getElementById("uploadResult");

    if (!fileInput || !uploadResult) return;

    const file = fileInput.files[0];

    if (!file) {
        showMessage(uploadResult, "Seleziona un file prima di caricare.", true);
        return;
    }

    const allowedExtensions = [".pdf", ".txt", ".docx"];
    const fileName = file.name.toLowerCase();

    const isValidFile = allowedExtensions.some(ext => fileName.endsWith(ext));

    if (!isValidFile) {
        showMessage(
            uploadResult,
            "Formato non supportato. Usa PDF, TXT o DOCX.",
            true
        );
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
        showMessage(uploadResult, "Caricamento ed embedding in corso...");

        const data = await apiRequest("/embed", {
            method: "POST",
            body: formData
        });

        showJson(uploadResult, data);
        fileInput.value = "";

        await loadFiles();
    } catch (error) {
        showMessage(uploadResult, error.message, true);
    }
}


async function loadFiles() {
    const filesList = document.getElementById("filesList");

    if (!filesList) return;

    try {
        filesList.innerHTML = "<p>Caricamento documenti...</p>";

        const data = await apiRequest("/files");

        renderFiles(data.files || []);
    } catch (error) {
        filesList.innerHTML = `<p class="error">${escapeHtml(error.message)}</p>`;
    }
}


function renderFiles(files) {
    const filesList = document.getElementById("filesList");

    if (!filesList) return;

    filesList.innerHTML = "";

    if (!files.length) {
        filesList.innerHTML = "<p>Nessun documento caricato.</p>";
        return;
    }

    files.forEach(file => {
        const item = document.createElement("div");
        item.className = "file-item";

        item.innerHTML = `
            <strong>${escapeHtml(file.file_name || "Senza nome")}</strong>
            <p><strong>Hash:</strong> <code>${escapeHtml(file.file_hash || "")}</code></p>
            <p><strong>Chunks:</strong> ${file.chunks ?? 0}</p>
            <p><strong>Upload:</strong> ${escapeHtml(file.uploaded_at || "n/d")}</p>

            <div class="file-actions">
                <button type="button" class="chunks-button">Vedi chunk</button>
                <button type="button" class="delete-button">Elimina</button>
            </div>
        `;

        const chunksButton = item.querySelector(".chunks-button");
        const deleteButton = item.querySelector(".delete-button");

        chunksButton.addEventListener("click", () => {
            loadChunks(file.file_hash);
        });

        deleteButton.addEventListener("click", () => {
            deleteFile(file.file_hash, file.file_name);
        });

        filesList.appendChild(item);
    });
}


async function loadChunks(fileHash) {
    const chunksOutput = document.getElementById("chunksOutput");

    if (!chunksOutput) return;

    if (!fileHash) {
        showMessage(chunksOutput, "Hash del file mancante.", true);
        return;
    }

    try {
        showMessage(chunksOutput, "Caricamento chunk...");

        const data = await apiRequest(
            `/chunks?file_hash=${encodeURIComponent(fileHash)}`
        );

        showJson(chunksOutput, data);
    } catch (error) {
        showMessage(chunksOutput, error.message, true);
    }
}


async function deleteFile(fileHash, fileName) {
    const uploadResult = document.getElementById("uploadResult");
    const chunksOutput = document.getElementById("chunksOutput");

    if (!fileHash) {
        if (uploadResult) {
            showMessage(uploadResult, "Hash del file mancante.", true);
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

        if (uploadResult) {
            showJson(uploadResult, data);
        }

        if (chunksOutput) {
            chunksOutput.textContent = "Seleziona “Vedi chunk” da un documento.";
        }

        await loadFiles();
    } catch (error) {
        if (uploadResult) {
            showMessage(uploadResult, error.message, true);
        }
    }
}