# THE RAG

## Stack RAG locale:

- LLM: Ollama qwen3:latest
- Embeddings: nomic-embed-text
- Vector DB: Chroma
- Framework: LangChain (modulare)
- Backend: Flask
- Document loaders: PDF, DOCX

## Comandi per il RAG

ollama show qwen3
ollama run qwen3

### Per avviare il server

Su terminale Powershell, nella cartella del progetto:

python main.py

### Per embeddare nuovi documenti

Aprendo un nuovo terminale Bash su VsCode:

curl.exe -X POST "http://localhost:8080/embed" -F "file=@app/backend/data/Per Vetri.docx"

curl --request POST \
  --url http://localhost:8080/embed \
  --header 'Content-Type: multipart/form-data' \
  --form file=@data/Disinfettanti.docx


### Per interrogare il modello

Aprendo un nuovo terminale Bash su VsCode:

curl --request POST \
  --url http://localhost:8080/query \
  --header 'Content-Type: application/json' \
  --data '{ "query": "Di cosa parla il documento dei vetri?" }'


#### Esercizio di base preso qui: 

https://massimilianovurro.com/come-creare-una-rag-app-gratis-sul-tuo-computer-in-10-minuti/

#### Video Youtube utili:

https://www.youtube.com/watch?v=b7-IV7IS5YI
https://www.youtube.com/watch?v=S6ZdlvSCzUw
https://www.youtube.com/watch?v=SSc_OVJli4Q

### Altre pagine di documentazione utili

https://www.starfounder.it/data/

