from flask import Blueprint, request, jsonify, send_from_directory

from app.backend.services.query import query
from app.backend.services.embed import *
from app.backend.db.vector_db import get_all_vectors

from sklearn.decomposition import PCA
from sklearn.manifold import TSNE

router = Blueprint("router", __name__)

# ROUTES PER IL FRONTEND #

# Route per la home page
@router.route("/", methods=["GET"])
def frontend():
    return send_from_directory("app/frontend", "index.html")

@router.route("/embedding-page", methods=["GET"])
def embedding_page():
    return send_from_directory("app/frontend", "embedding.html")

@router.route("/analytics-page", methods=["GET"])
def analytics_page():
    return send_from_directory("app/frontend", "analytics.html")

@router.route("/static/css/<path:filename>")
def serve_css(filename):
    return send_from_directory("app/frontend/css", filename)


@router.route("/static/js/<path:filename>")
def serve_js(filename):
    return send_from_directory("app/frontend/js", filename)


# ROUTES PER IL BACKEND #

# Route per l'embedding dei file + gestione degli errori
@router.route("/embed", methods=["POST"])
def route_embed():
    if "file" not in request.files:
        return jsonify({"error": "Nessuna parte del file"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "Nessun file selezionato"}), 400

    file_path = save_file(file)
    embedded = embed(file_path)

    if embedded:
        return jsonify({
            "message": "File caricato con successo nel vector database"
        }), 200

    return jsonify({
        "error": "Caricamento del file non riuscito"
    }), 400

# Route per eseguire la query dell'utente
@router.route("/query", methods=["POST"])
def route_query():
    data = request.get_json()

    if not data or not data.get("query"):
        return jsonify({"error": "Query mancante"}), 400

    response = query(data.get("query"))

    if response:
        return jsonify({
            "answer": response.get("answer"),
            "sources": response.get("sources")
        }), 200

    return jsonify({"error": "Qualcosa è andato storto"}), 400

# Route per ottenere la lista dei file caricati nel database vettoriale
@router.route("/files", methods=["GET"])
def route_files():
    files = list_uploaded_files()

    return jsonify({
        "count": len(files),
        "files": files
    }), 200

# Route per ottenere la lista dei chunk di un file specifico tramite il suo hash
@router.route("/chunks", methods=["GET"])
def route_chunks():
    file_hash = request.args.get("file_hash")

    if not file_hash:
        return jsonify({
            "error": "Parametro file_hash mancante"
        }), 400

    chunks = list_chunks_by_file_hash(file_hash)

    return jsonify({
        "file_hash": file_hash,
        "chunks_count": len(chunks),
        "chunks": chunks
    }), 200

# Route per cancellare un file specifico tramite il suo hash
@router.route("/files", methods=["DELETE"])
def route_delete_file():
    file_hash = request.args.get("file_hash")

    if not file_hash:
        return jsonify({
            "error": "Parametro 'file_hash' mancante"
        }), 400

    deleted = delete_file_by_hash(file_hash)

    if deleted:
        return jsonify({
            "message": "Documento eliminato con successo.",
            "file_hash": file_hash
        }), 200

    return jsonify({
        "error": "Impossibile eliminare il documento."
    }), 400

# Route per trasformare i vettori in un formato JSON-friendly e restituirli al frontend
@router.route("/analytics/vectors", methods=["GET"])
def analytics_vectors():
    data = get_all_vectors()

    embeddings = data["embeddings"]

    if embeddings is None or len(embeddings) == 0:
        return jsonify({
            "count": 0,
            "vectors": []
        })

    # PCA: trasforma i vettori originali in coordinate 3D.
    # Le prime due coordinate verranno usate anche per il grafico 2D.
    pca = PCA(n_components=3)
    coordinates = pca.fit_transform(embeddings)

    vectors = []

    for i in range(len(data["ids"])):
        embedding = embeddings[i]

        if hasattr(embedding, "tolist"):
            embedding = embedding.tolist()

        vectors.append({
            "id": data["ids"][i],
            "document": data["documents"][i],
            "metadata": data["metadatas"][i],
            "embedding": embedding,

            "x": float(coordinates[i][0]),
            "y": float(coordinates[i][1]),
            "z": float(coordinates[i][2])
        })

    return jsonify({
        "count": len(vectors),
        "embedding_dimension": len(embeddings[0]),
        "vectors": vectors
    })