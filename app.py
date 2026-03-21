import os
from dotenv import load_dotenv

load_dotenv()

from flask import Flask, request, jsonify
from embed import embed
from query import query

TEMP_FOLDER = os.getenv('TEMP_FOLDER', './_temp')
os.makedirs(TEMP_FOLDER, exist_ok=True)

app = Flask(__name__)


# Route per l'embedding dei file + gestione degli errori
@app.route('/embed', methods=['POST'])
def route_embed():
    if 'file' not in request.files:
        return jsonify({"error": "Nessuna parte del file"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "Nessun file selezionato"}), 400
    
    file_path = os.path.join(TEMP_FOLDER, str(file.filename))
    file.save(file_path)

    embedded = embed(file_path)

    if embedded:
        return jsonify({"message": "File caricato con successo"}), 200

    return jsonify({"error": "Caricamento del file non riuscito"}), 400



# Route per la query dell'utente
@app.route('/query', methods=['POST'])
def route_query():
    
    # Query dell'utente trasformata in JSON
    data = request.get_json()
    
    # Estrazione del valore associato alla chiave "query" dal JSON ricevuto 
    # che viene passato alla funzione query(...) del file query.py
    response = query(data.get('query'))

    # Risposta del RAG model
    if response:
        return jsonify({"message": response}), 200

    # Risposta di errore
    return jsonify({"error": "Qualcosa è andato storto"}), 400


# Avvio dell'app Flask
if __name__ == '__main__':
    app.run(host="0.0.0.0", port=8080, debug=True)