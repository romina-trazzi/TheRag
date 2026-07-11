document.addEventListener("DOMContentLoaded", () => {
    bindAnalyticsEvents();
    loadAnalyticsVectors();
});

function bindAnalyticsEvents() {
    const dimensionSelect = document.getElementById("dimensionSelect");
    const refreshButton = document.getElementById("refreshAnalyticsButton");
    const closeChunkDetailsButton = document.getElementById("closeChunkDetailsButton");

    dimensionSelect.addEventListener("change", () => {
        renderVectorPlot();
    });

    refreshButton.addEventListener("click", () => {
        loadAnalyticsVectors();
    });

    closeChunkDetailsButton.addEventListener("click", () => {
        clearSelectedChunk();
    });
}

function bindPlotClick() {
    const plot = document.getElementById("vectorPlot");

    plot.on("plotly_click", event => {
        const selectedChunk = event.points[0].customdata;

        renderSelectedChunk(selectedChunk);
        renderNumericVector(selectedChunk.vector);
    });
}

let currentVectors = [];

async function loadAnalyticsVectors() {
    const loadingMessage = document.getElementById("analyticsLoadingMessage");

    loadingMessage.classList.remove("hidden");

    try {
        const response = await fetch("/analytics/vectors");

        if (!response.ok) {
            throw new Error("Errore nel caricamento dei vettori");
        }

        const data = await response.json();

        currentVectors = data.vectors;

        renderVectorPlot();
    } catch (error) {
        console.error(error);

        document.getElementById("vectorPlot").innerHTML = `
            <p>Errore nel caricamento dei vettori.</p>
        `;
    } finally {
        loadingMessage.classList.add("hidden");
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
            const metadata = chunk.metadata || {};

            const fileName =
                metadata.file_name ||
                metadata.source ||
                "sconosciuto";

            const chunkIndex =
                metadata.chunk_index ??
                "n/d";

            return `${fileName} - Chunk ${chunkIndex}`;
        }),

        customdata: chunks,

       hovertemplate:
        "<b>%{text}</b><br>" +
        "%{customdata.document}<br>" +
        "X: %{x:.3f}<br>" +
        "Y: %{y:.3f}" +
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
            const metadata = chunk.metadata || {};

            const fileName =
                metadata.file_name ||
                metadata.source ||
                "sconosciuto";

            const chunkIndex =
                metadata.chunk_index ??
                "n/d";

            return `${fileName} - Chunk ${chunkIndex}`;
        }),

        customdata: chunks,

       hovertemplate:
        "<b>%{text}</b><br>" +
        "%{customdata.document}<br>" +
        "X: %{x:.3f}<br>" +
        "Y: %{y:.3f}<br>" +
        "Z: %{z:.3f}" +
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

function renderVectorPlot() {
    const dimension = document.getElementById("dimensionSelect").value;

    if (dimension === "3d") {
        render3DPlot(currentVectors);
    } else {
        render2DPlot(currentVectors);
    }
}

function renderSelectedChunk(chunk) {
    const message = document.getElementById("selectedChunkMessage");
    const container = document.getElementById("selectedChunkBox");
    const closeButton = document.getElementById("closeChunkDetailsButton");

    const metadata = chunk.metadata || {};

    const fileName =
        metadata.file_name ||
        metadata.source ||
        "sconosciuto";

    const chunkIndex =
        metadata.chunk_index ??
        "n/d";

    message.textContent = `${fileName} - Chunk ${chunkIndex}`;

    container.innerHTML = `
        <p>
            <strong>Documento:</strong>
            ${fileName}
        </p>

        <p>
            <strong>Chunk index:</strong>
            ${chunkIndex}
        </p>

        <p>
            <strong>ID:</strong>
            ${chunk.id}
        </p>

        <p>
            <strong>Coordinate PCA:</strong>
            X = ${chunk.x.toFixed(3)},
            Y = ${chunk.y.toFixed(3)},
            Z = ${chunk.z.toFixed(3)}
        </p>

        <p>
            <strong>Testo:</strong>
        </p>

        <div class="answer-box">
            ${chunk.document}
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