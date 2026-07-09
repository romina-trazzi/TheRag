const documentsCount = document.getElementById("documentsCount");
const chunksCount = document.getElementById("chunksCount");
const vectorsCount = document.getElementById("vectorsCount");

async function loadAnalytics() {
    try {
        const response = await fetch("/analytics");

        if (!response.ok) {
            throw new Error("Errore nel recupero analytics.");
        }

        const data = await response.json();

        documentsCount.innerHTML = data.documents_count ?? "-";
        chunksCount.innerHTML = data.chunks_count ?? "-";
        vectorsCount.innerHTML = data.vectors_count ?? "-";

    } catch (error) {
        documentsCount.innerHTML = "-";
        chunksCount.innerHTML = "-";
        vectorsCount.innerHTML = "-";
    }
}

loadAnalytics();