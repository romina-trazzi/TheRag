from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from get_vector_db import get_vector_db


# Chiamare la funzione da get_vector_db.py per ottenere l'oggetto DB
db = get_vector_db()


# Funzione di Initial prompt \ template prompt con blocchi di contesto e domanda
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

# Se non lo è, procedo con la query al RAG model

    # Fase 1: Retriever dal db dei K chunk (= pezzi di documenti) più rilevanti
    retriever = db.as_retriever(search_kwargs={"k": 4})

    # Fase 1bis: debug
    docs = retriever.invoke(input_text)
    print("\n📄 DOCUMENTI TROVATI:", len(docs))
    
    # Fase 2: Prompt che include la query e il contesto dei documenti recuperati
    prompt = get_prompt()
    
    # Fase 3: Definire l'LLM (ChatOllama) con il modello specificato
    LLM_MODEL = ChatOllama(
        model="qwen3",
        base_url="http://localhost:11434",
        temperature=0.3,
    )

    # Fase 3: Chain che collega il retriever, il prompt e l'LLM, con output parser per formattare la risposta
    chain = (
        {"context": retriever, "question": RunnablePassthrough()}
        | prompt
        | LLM_MODEL
        | StrOutputParser()
    )

    # Esegui per ottenere la risposta formattata
    response = chain.invoke(input_text)
    

    print("\n✅ RISPOSTA GENERATA\n")
    
    # Estrai fonti
    sources = list(set(
        doc.metadata.get("source", "sconosciuto")
        for doc in docs
    ))

    return {
        "answer": str(response),
        "sources": sources
    }
    
  
