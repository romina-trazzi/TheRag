async function uploadFile() {
    const file = document.getElementById("fileInput").files[0];

    if (!file) {
        alert("Seleziona un file.");
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/embed", {
        method: "POST",
        body: formData
    });

    const data = await res.json();

    document.getElementById("uploadResult").textContent =
        JSON.stringify(data, null, 2);

    await loadFiles();
}


async function askQuestion() {
    const query = document.getElementById("queryInput").value;

    if (!query.trim()) {
        alert("Scrivi una domanda.");
        return;
    }

    const res = await fetch("/query", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ query })
    });

    const data = await res.json();

    document.getElementById("answer").textContent =
        JSON.stringify(data, null, 2);
}


async function loadFiles() {
    const res = await fetch("/files");
    const data = await res.json();

    const container = document.getElementById("filesList");
    container.innerHTML = "";

    if (!data.files || data.files.length === 0) {
        container.innerHTML = "<p>Nessun documento caricato.</p>";
        return;
    }

    data.files.forEach(file => {
        const div = document.createElement("div");
        div.className = "file-item";

        div.innerHTML = `
            <strong>${file.file_name}</strong><br>
            Hash: <code>${file.file_hash}</code><br>
            Chunks: ${file.chunks}<br>
            Upload: ${file.uploaded_at || "n/d"}

            <div class="file-actions">
                <button onclick="loadChunks('${file.file_hash}')">Vedi chunk</button>
                <button onclick="deleteFile('${file.file_hash}')">Elimina</button>
            </div>
        `;

        container.appendChild(div);
    });
}


async function loadChunks(fileHash) {
    const res = await fetch(`/chunks?file_hash=${encodeURIComponent(fileHash)}`);
    const data = await res.json();

    document.getElementById("chunksOutput").textContent =
        JSON.stringify(data, null, 2);
}


async function deleteFile(fileHash) {
    const confirmed = confirm("Vuoi eliminare questo documento dal Vector DB?");

    if (!confirmed) return;

    const res = await fetch(`/files?file_hash=${encodeURIComponent(fileHash)}`, {
        method: "DELETE"
    });

    const data = await res.json();

    document.getElementById("uploadResult").textContent =
        JSON.stringify(data, null, 2);

    await loadFiles();

    document.getElementById("chunksOutput").textContent =
        "Seleziona “Vedi chunk” da un documento.";
}


loadFiles();