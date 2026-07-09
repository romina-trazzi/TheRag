from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from app.backend.db.vector_db import get_vector_db

# Chiamare la funzione da get_vector_db.py per ottenere l'oggetto DB
db = get_vector_db()

# Funzione di Initial prompt (= template prompt con blocchi di contesto e domanda)
def get_prompt():
    template = """Rispondi alla domanda SOLO usando il contesto fornito.
                Regole:
                    - Rispondi in modo preciso e dettagliato
                    - Usa informazioni specifiche dal contesto
                    - Se possibile, cita esempi o elementi presenti nel testo
                    - Se la risposta non è nel contesto, dillo chiaramente  

                Contesto:
                {context}

                Domanda:
                {question}
                """
    return ChatPromptTemplate.from_template(template)


# Funzione per la query dell'utente al RAG model
def query(input_text):

    # Controllo se l'input è vuoto
    if not input_text:
        return None

    # Fase 1: Creazione del retriever dal database vettoriale.
    # k=4 significa che il retriever recupera i 4 chunk semanticamente più vicini alla query.
    retriever = db.as_retriever(search_kwargs={"k": 4})

    # Fase 1bis: Esecuzione manuale del retrieval.
    # In questo modo recuperiamo i chunk una sola volta e possiamo anche stamparli per debug.
    docs = retriever.invoke(input_text)

    print("\n📄 CHUNK RECUPERATI:", len(docs))

    # Debug: stampa dei chunk recuperati.
    # Questo serve per capire quali parti del database vettoriale vengono usate per rispondere.
    for i, doc in enumerate(docs):
        print(f"\n--- CHUNK {i + 1} ---")
        print("File:", doc.metadata.get("file_name", "sconosciuto"))
        print("Chunk index:", doc.metadata.get("chunk_index", "n/d"))
        print(doc.page_content[:300])

    # Fase 2: Costruzione del contesto testuale.
    # I chunk recuperati vengono uniti in una singola stringa che sarà inserita nel prompt.
    context = "\n\n".join(
        doc.page_content
        for doc in docs
    )

    # Fase 3: Creazione del prompt con contesto e domanda.
    prompt = get_prompt()

    # Fase 4: Definizione dell'LLM locale tramite Ollama.
    LLM_MODEL = ChatOllama(
        model="qwen3",
        base_url="http://localhost:11434",
        temperature=0.3,
    )

    # Fase 5: Chain semplificata.
    # Qui NON passiamo più il retriever dentro la chain, perché il retrieval è già stato fatto sopra.
    chain = (
        prompt
        | LLM_MODEL
        | StrOutputParser()
    )

    # Fase 6: Invocazione della chain.
    # Passiamo direttamente al prompt un dizionario con:
    # - context: i chunk recuperati
    # - question: la domanda dell'utente
    response = chain.invoke({
        "context": context,
        "question": input_text
    })

    print("\n✅ RISPOSTA GENERATA\n")

    # Fase 7: Estrazione delle fonti dai metadata dei chunk recuperati.
    sources = list(set(
        doc.metadata.get("file_name", doc.metadata.get("source", "sconosciuto"))
        for doc in docs
    ))

    # Fase 8: Risposta finale restituita alla route /query.
    return {
        "answer": str(response),
        "sources": sources
    }