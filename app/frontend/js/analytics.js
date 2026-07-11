document.addEventListener("DOMContentLoaded", () => {
    bindAnalyticsEvents();
    renderTestPlot();
});


function bindAnalyticsEvents() {
    const dimensionSelect = document.getElementById("dimensionSelect");
    const refreshButton = document.getElementById("refreshAnalyticsButton");
    const closeChunkDetailsButton = document.getElementById("closeChunkDetailsButton");

    dimensionSelect.addEventListener("change", () => {
        renderTestPlot();
    });

    refreshButton.addEventListener("click", () => {
        renderTestPlot();
    });

    closeChunkDetailsButton.addEventListener("click", () => {
        clearSelectedChunk();
    });
}


function renderTestPlot() {
    const dimension = document.getElementById("dimensionSelect").value;

    // Dati di prova.
    // Ogni elemento rappresenta un chunk.
    const testChunks = [
        {
            id: "chunk-1",
            fileName: "Agesilao.docx",
            chunkIndex: 0,
            text: "Agesilao fu uno dei più importanti re di Sparta.",
            vector: [0.24, -0.12, 0.51, 0.08],
            x: 1.2,
            y: 2.1,
            z: 0.8
        },
        {
            id: "chunk-2",
            fileName: "Agesilao.docx",
            chunkIndex: 1,
            text: "Il sovrano spartano partecipò a numerose campagne militari.",
            vector: [0.18, -0.07, 0.46, 0.12],
            x: 1.5,
            y: 2.4,
            z: 1.1
        },
        {
            id: "chunk-3",
            fileName: "Sparta.pdf",
            chunkIndex: 4,
            text: "La società spartana era organizzata attorno alla disciplina militare.",
            vector: [-0.14, 0.42, 0.21, -0.09],
            x: -1.4,
            y: 1.8,
            z: 2.2
        },
        {
            id: "chunk-4",
            fileName: "Sparta.pdf",
            chunkIndex: 5,
            text: "Gli Spartiati costituivano il gruppo dei cittadini di pieno diritto.",
            vector: [-0.22, 0.38, 0.19, -0.03],
            x: -1.8,
            y: 1.5,
            z: 1.9
        },
        {
            id: "chunk-5",
            fileName: "Python.txt",
            chunkIndex: 2,
            text: "Python è un linguaggio di programmazione interpretato.",
            vector: [0.61, 0.33, -0.25, 0.44],
            x: 3.7,
            y: -2.4,
            z: -1.2
        },
        {
            id: "chunk-6",
            fileName: "RAG.pdf",
            chunkIndex: 7,
            text: "Un sistema RAG recupera documenti prima di generare una risposta.",
            vector: [0.72, 0.48, -0.11, 0.29],
            x: 4.2,
            y: -1.8,
            z: -0.7
        }
    ];

    if (dimension === "3d") {
        render3DPlot(testChunks);
    } else {
        render2DPlot(testChunks);
    }
}


function render2DPlot(chunks) {
    const trace = {
        x: chunks.map(chunk => chunk.x),
        y: chunks.map(chunk => chunk.y),

        mode: "markers",
        type: "scatter",

        marker: {
            size: 12
        },

        text: chunks.map(chunk => {
            return `${chunk.fileName} - Chunk ${chunk.chunkIndex}`;
        }),

        customdata: chunks,

        hovertemplate:
            "<b>%{text}</b><br>" +
            "%{customdata.text}<br>" +
            "X: %{x}<br>" +
            "Y: %{y}" +
            "<extra></extra>"
    };

    const layout = {
        title: "Spazio vettoriale 2D",
        xaxis: {
            title: "Componente PCA 1"
        },
        yaxis: {
            title: "Componente PCA 2"
        },
        height: 600,
        margin: {
            l: 60,
            r: 30,
            t: 60,
            b: 60
        }
    };

    Plotly.newPlot(
        "vectorPlot",
        [trace],
        layout,
        {
            responsive: true
        }
    );

    bindPlotClick();
}


function render3DPlot(chunks) {
    const trace = {
        x: chunks.map(chunk => chunk.x),
        y: chunks.map(chunk => chunk.y),
        z: chunks.map(chunk => chunk.z),

        mode: "markers",
        type: "scatter3d",

        marker: {
            size: 7
        },

        text: chunks.map(chunk => {
            return `${chunk.fileName} - Chunk ${chunk.chunkIndex}`;
        }),

        customdata: chunks,

        hovertemplate:
            "<b>%{text}</b><br>" +
            "%{customdata.text}<br>" +
            "X: %{x}<br>" +
            "Y: %{y}<br>" +
            "Z: %{z}" +
            "<extra></extra>"
    };

    const layout = {
        title: "Spazio vettoriale 3D",
        height: 650,

        scene: {
            xaxis: {
                title: "Componente PCA 1"
            },
            yaxis: {
                title: "Componente PCA 2"
            },
            zaxis: {
                title: "Componente PCA 3"
            }
        },

        margin: {
            l: 20,
            r: 20,
            t: 60,
            b: 20
        }
    };

    Plotly.newPlot(
        "vectorPlot",
        [trace],
        layout,
        {
            responsive: true
        }
    );

    bindPlotClick();
}


function bindPlotClick() {
    const plot = document.getElementById("vectorPlot");

    plot.on("plotly_click", event => {
        const selectedChunk = event.points[0].customdata;

        renderSelectedChunk(selectedChunk);
        renderNumericVector(selectedChunk.vector);
    });
}


function renderSelectedChunk(chunk) {
    const message = document.getElementById("selectedChunkMessage");
    const container = document.getElementById("selectedChunkBox");
    const closeButton = document.getElementById("closeChunkDetailsButton");

    message.textContent = `${chunk.fileName} - Chunk ${chunk.chunkIndex}`;

    container.innerHTML = `
        <p>
            <strong>Documento:</strong>
            ${chunk.fileName}
        </p>

        <p>
            <strong>Chunk index:</strong>
            ${chunk.chunkIndex}
        </p>

        <p>
            <strong>ID:</strong>
            ${chunk.id}
        </p>

        <p>
            <strong>Testo:</strong>
        </p>

        <div class="answer-box">
            ${chunk.text}
        </div>
    `;

    closeButton.classList.remove("hidden");
}


function renderNumericVector(vector) {
    const container = document.getElementById("numericVectorBox");

    container.innerHTML = vector.map((value, index) => {
        return `
            <div class="vector-value">
                <span>[${index}]</span>
                <span>${value}</span>
            </div>
        `;
    }).join("");
}


function clearSelectedChunk() {
    const message = document.getElementById("selectedChunkMessage");
    const chunkContainer = document.getElementById("selectedChunkBox");
    const vectorContainer = document.getElementById("numericVectorBox");
    const closeButton = document.getElementById("closeChunkDetailsButton");

    message.textContent =
        "Seleziona un punto nel grafico per vedere i suoi dettagli.";

    chunkContainer.innerHTML = "";

    vectorContainer.innerHTML = `
        <p class="muted">
            Nessun vettore selezionato.
        </p>
    `;

    closeButton.classList.add("hidden");
}