import os
import hashlib
from datetime import datetime
from werkzeug.utils import secure_filename
from langchain_community.document_loaders import (PyPDFLoader, TextLoader, Docx2txtLoader)
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.backend.db.vector_db import get_vector_db
from app.backend.config.config_folder import TEMP_FOLDER


# Funzione per calcolare l'hash del file da caricare
def calculate_file_hash(file_path):
    hasher = hashlib.sha256()

    with open(file_path, "rb") as file:
        for chunk in iter(lambda: file.read(4096), b""):
            hasher.update(chunk)

    return hasher.hexdigest()

# Funzione per caricare, processare e inserire i documenti nel database vettoriale
def load_documents(file_path):
    if file_path.endswith(".pdf"):
        loader = PyPDFLoader(file_path)
    elif file_path.endswith(".txt"):
        loader = TextLoader(file_path)
    elif file_path.endswith(".docx"):
        loader = Docx2txtLoader(file_path)
    else:
        return None
    
    return loader.load()

# Funzione per suddividere i documenti in chunk più piccoli
def split_documents(documents):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=150
    )
    return splitter.split_documents(documents)

# Funzione principale per l'embedding dei file e l'inserimento nel database vettoriale
def embed(file_path):
    if not file_path or not os.path.exists(file_path):
        return False

    documents = load_documents(file_path)
    
    if not documents:
        return False
    
    file_hash = calculate_file_hash(file_path)

    existing = db.get(
        where={"file_hash": file_hash}
    )

    if existing and existing.get("ids"):
        print("Documento già presente nel vector DB")
        return False
    

    chunks = split_documents(documents)
    
    for chunk in chunks:
        chunk.metadata["source"] = os.path.basename(file_path)
        chunk.metadata["file_hash"] = file_hash
        
    db = get_vector_db()
    
    db.add_documents(chunks)

    os.remove(file_path)
    
    print(f"📄 Caricato file: {file_path}")
    print(f"📚 Chunk generati: {len(chunks)}")
    
    return True

# Funzione per salvare i file in modo sicuro e organizzato nella cartella temporanea
def save_file(file):
    ct = datetime.now()
    filename = f"{ct.timestamp()}_{secure_filename(file.filename)}"
    file_path = os.path.join(TEMP_FOLDER, filename)
    file.save(file_path)
    return file_path

# Funzione per avere la lista dei file caricati nel database vettoriale, legata all'endpoint /files
def list_uploaded_files():
    db = get_vector_db()
    data = db.get()

    files = set()

    for metadata in data.get("metadatas", []):
        if metadata and metadata.get("source"):
            files.add(metadata.get("source"))

    return list(files)
