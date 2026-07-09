from flask import Blueprint, request, jsonify, send_from_directory

from app.backend.services.query import query
from app.backend.services.embed import embed, save_file, list_uploaded_files, list_chunks_by_file_hash

router = Blueprint("router", __name__)


# Route per la home page
@router.route("/", methods=["GET"])
def frontend():
    return send_from_directory("app/frontend", "index.html")

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

# Route per la query dell'utente
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



