import os
import hashlib
from pathlib import Path
from datetime import datetime
from werkzeug.utils import secure_filename
from langchain_community.document_loaders import (PyPDFLoader, TextLoader, Docx2txtLoader)
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.backend.db.vector_db import get_vector_db
from app.backend.config.config_folder import TEMP_FOLDER


# Funzione per calcolare l'hash del file da caricare
def calculate_file_hash(file_path : str | Path) -> str:
    
    file_path = Path(file_path)
    
    hasher = hashlib.sha256()

    with open(file_path, "rb") as file:
        for chunk in iter(lambda: file.read(4096), b""):
            hasher.update(chunk)

    return hasher.hexdigest()

# Funzione per costruire un ID unico per ogni chunk basato sull'hash del file e sull'indice del chunk
def build_chunk_id(file_hash: str, chunk_index: int) -> str:
    return f"{file_hash}_chunk_{chunk_index}"

# Funzione per controllare se il file è già presente nel database vettoriale
def file_already_indexed(db, file_hash:str) -> bool:
    existing = db.get(
        where={"file_hash": file_hash},
        include=["metadatas"]   
    )

    return bool(existing and existing.get("ids"))

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

    db = get_vector_db()

    file_hash = calculate_file_hash(file_path)

    if file_already_indexed(db, file_hash):
        print("Documento già presente nel vector DB")
        os.remove(file_path)
        return False

    documents = load_documents(file_path)

    if not documents:
        os.remove(file_path)
        return False

    chunks = split_documents(documents)

    file_name = os.path.basename(file_path)
    total_chunks = len(chunks)
    uploaded_at = datetime.now().isoformat()

    ids = []

    for index, chunk in enumerate(chunks):
        chunk_id = build_chunk_id(file_hash, index)
        ids.append(chunk_id)

        chunk.metadata["source"] = file_path
        chunk.metadata["file_name"] = file_name
        chunk.metadata["file_hash"] = file_hash
        chunk.metadata["chunk_index"] = index
        chunk.metadata["total_chunks"] = total_chunks
        chunk.metadata["uploaded_at"] = uploaded_at

    db.add_documents(chunks, ids=ids)
    os.remove(file_path)

    print(f"📄 Caricato file: {file_name}")
    print(f"🔐 Hash file: {file_hash}")
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
    data = db.get(include=["metadatas"])
    
    print(data)

    files = {}

    for metadata in data.get("metadatas", []):
        if not metadata:
            continue

        file_hash = metadata.get("file_hash")

        if not file_hash:
            continue

        if file_hash not in files:
            files[file_hash] = {
                "file_hash": file_hash,
                "file_name": metadata.get("file_name"),
                "source": metadata.get("source"),
                "uploaded_at": metadata.get("uploaded_at"),
                "chunks": 0
            }

        files[file_hash]["chunks"] += 1

    return list(files.values())

# Funzione per ottenere i chunk di un file specifico tramite il suo hash, legata all'endpoint /files/<file_hash>
def list_chunks_by_file_hash(file_hash: str):
    db = get_vector_db()

    data = db.get(
        where={"file_hash": file_hash},
        include=["documents", "metadatas"]
    )

    chunks = []

    for chunk_id, document, metadata in zip(
        data.get("ids", []),
        data.get("documents", []),
        data.get("metadatas", [])
    ):
        chunks.append({
            "id": chunk_id,
            "text": document,
            "metadata": metadata
        })

    return chunks

# Funzione per cancellare i file dal database vettoriale tramite file_hash
def delete_file_by_hash(file_hash: str):
    if not file_hash:
        return False

    db = get_vector_db()

    db.delete(
        where={"file_hash": file_hash}
    )

    return True


