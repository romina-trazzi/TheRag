import os
from flask import Blueprint, request, jsonify
from app.backend.config.config_folder import TEMP_FOLDER
from app.backend.services.query import query
from app.backend.services.embed import embed

router = Blueprint("router", __name__)


# Route per l'embedding dei file + gestione degli errori
@router.route('/embed', methods=['POST'])
def route_embed():
    if 'file' not in request.files:
        return jsonify({"error": "Nessuna parte del file"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "Nessun file selezionato"}), 400
    
    
    # Salvataggio del file in una cartella temporanea
    file_path = os.path.join(TEMP_FOLDER, str(file.filename))
    file.save(file_path)

    # Embedding del file (= trasformazione del file in un vettore numerico) e salvataggio nel vector database
    embedded = embed(file_path)

    if embedded:
        return jsonify({"message": "File caricato con successo nel vector database"}), 200

    return jsonify({"error": "Caricamento del file non riuscito"}), 400



# Route per la query dell'utente
@router.route('/query', methods=['POST'])
def route_query():
    
    # Query dell'utente trasformata in JSON
    data = request.get_json()
    
    # Estrazione del valore associato alla chiave "query" dal JSON ricevuto 
    # che viene passato alla funzione query(...) del file query.py
    response = query(data.get('query'))

    # Risposta del RAG model
    if response:
           return jsonify({
            "answer": response.get("answer"),
            "sources": response.get("sources")
    }), 200
            
    # Risposta di errore
    return jsonify({"error": "Qualcosa è andato storto"}), 400



