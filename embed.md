embed.py

Il file embed.py gestisce la fase di ingestion del RAG, cioè il processo con cui un documento viene caricato, letto, suddiviso in chunk, trasformato in embedding e salvato nel database vettoriale.

Funzioni principali
calculate_file_hash(file_path)

Calcola l’hash SHA-256 del file.

Serve per identificare il contenuto reale del documento, non solo il nome del file.

Uso:

file_hash = calculate_file_hash(file_path)

Permette di riconoscere duplicati anche se il file viene rinominato.

file_already_indexed(db, file_hash)

Controlla se un documento è già presente nel vector DB.

Cerca nei metadata dei chunk un file_hash uguale a quello del file corrente.

Uso:

if file_already_indexed(db, file_hash):
    return False

Serve a evitare di embeddare più volte lo stesso documento.

build_chunk_id(file_hash, chunk_index)

Crea un ID stabile e deterministico per ogni chunk.

Esempio:

abc123_chunk_0
abc123_chunk_1
abc123_chunk_2

Uso:

chunk_id = build_chunk_id(file_hash, index)

Serve a rendere ogni chunk identificabile in modo univoco.

load_documents(file_path)

Carica un documento in base alla sua estensione.

Formati supportati:

.pdf
.txt
.docx

Uso:

documents = load_documents(file_path)

Restituisce una lista di documenti LangChain.

split_documents(documents)

Divide i documenti caricati in chunk più piccoli.

Attualmente usa:

chunk_size = 800
chunk_overlap = 150

Uso:

chunks = split_documents(documents)

Serve a rendere i documenti più adatti alla ricerca semantica.

embed(file_path)

È la funzione principale del file.

Esegue l’intera pipeline di ingestion:

verifica che il file esista;
apre il vector DB;
calcola l’hash del file;
controlla se il documento è già stato caricato;
carica il documento;
lo divide in chunk;
aggiunge metadata ai chunk;
genera ID deterministici;
salva i chunk nel vector DB;
elimina il file temporaneo.

Uso:

embedded = embed(file_path)

Restituisce:

True

se il documento è stato caricato correttamente.

Restituisce:

False

se il file non esiste, non è supportato, è duplicato o non viene processato correttamente.

save_file(file)

Salva temporaneamente un file caricato dall’utente nella cartella TEMP_FOLDER.

Usa secure_filename() per rendere il nome file più sicuro.

Uso:

file_path = save_file(file)

Restituisce il path del file salvato.

list_uploaded_files()

Legge il vector DB e restituisce l’elenco dei documenti caricati.

Raggruppa i chunk usando file_hash.

Uso:

files = list_uploaded_files()

Output atteso:

[
  {
    "file_hash": "...",
    "file_name": "Per Vetri.docx",
    "source": "...",
    "uploaded_at": "...",
    "chunks": 12
  }
]

Serve per alimentare l’endpoint /files e mostrare cosa è presente nel database vettoriale.

Metadata salvati nei chunk

Ogni chunk contiene metadata come:

{
    "source": "...",
    "file_name": "...",
    "file_hash": "...",
    "chunk_index": 0,
    "total_chunks": 12,
    "uploaded_at": "..."
}

Questi metadata permettono di:

sapere da quale file proviene ogni chunk;
evitare duplicati;
contare i chunk per documento;
visualizzare i dati nel RAG Inspector;
preparare future funzioni di cancellazione.