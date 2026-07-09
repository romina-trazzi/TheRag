import os
from flask import Flask
from app.backend.controllers.routes import router
from app.backend.config.config_folder import TEMP_FOLDER


# Creazione della cartella temporanea se non esiste
os.makedirs(TEMP_FOLDER, exist_ok=True)

# Creazione dell'app Flask (flask è un framework per lo sviluppo di applicazioni web in Python 
# che permette di creare server web e gestire endpoint point HTTP)
app = Flask(__name__)

# Aggiungi all’app tutte le route contenute in questo blueprint
app.register_blueprint(router)


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=8080, debug=True)