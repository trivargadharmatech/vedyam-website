"""
Migrates FAISS chunks to PostgreSQL pgvector.
Usage:
  set DATABASE_URL=postgresql://user:password@host/dbname
  python scripts/migrate_faiss_to_pgvector.py
"""
import os
import sys
import json
import time
import psycopg2
from psycopg2.extras import DictCursor

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

# Important: We must use the exact same embedding model!
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

VECTORSTORE_DIR = os.path.join(os.path.dirname(__file__), '../backend/vectorstore')
EMBEDDING_MODEL = "BAAI/bge-base-en-v1.5"

def migrate_vectors():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("ERROR: DATABASE_URL environment variable is required.")
        sys.exit(1)

    print("Connecting to PostgreSQL...")
    try:
        pg_conn = psycopg2.connect(db_url, cursor_factory=DictCursor)
    except Exception as e:
        print(f"Failed to connect to PostgreSQL: {e}")
        sys.exit(1)
        
    pg_cur = pg_conn.cursor()

    from db import init_db
    init_db()  # Ensures document_chunks and vector extension exist

    print(f"Loading local FAISS index from {VECTORSTORE_DIR}...")
    import torch
    device = "cuda" if torch.cuda.is_available() else "cpu"
    embeddings = HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL,
        model_kwargs={"device": device}
    )
    
    try:
        vectorstore = FAISS.load_local(
            VECTORSTORE_DIR,
            embeddings,
            allow_dangerous_deserialization=True
        )
    except Exception as e:
        print(f"Failed to load FAISS: {e}")
        sys.exit(1)

    docs = list(vectorstore.docstore._dict.values())
    print(f"Found {len(docs)} documents in FAISS.")

    print("Clearing existing document_chunks in PostgreSQL...")
    pg_cur.execute("DELETE FROM document_chunks")

    print("Embedding and migrating documents to pgvector... this may take a moment.")
    now = int(time.time())
    
    # We embed them using the exact same model to guarantee the vector space is identical.
    batch_size = 32
    for i in range(0, len(docs), batch_size):
        batch = docs[i:i+batch_size]
        texts = [doc.page_content for doc in batch]
        
        # Generate vectors
        batch_embeddings = embeddings.embed_documents(texts)
        
        for doc, emb in zip(batch, batch_embeddings):
            source = str(doc.metadata.get("source", "unknown"))
            pg_cur.execute(
                """INSERT INTO document_chunks (source, content, metadata, embedding, created_at)
                   VALUES (%s, %s, %s, %s, %s)""",
                (source, doc.page_content, json.dumps(doc.metadata), emb, now)
            )
        print(f"Migrated {min(i + batch_size, len(docs))}/{len(docs)} chunks...")

    pg_conn.commit()
    pg_conn.close()
    print("Migration completed! (FAISS directory remains untouched).")

if __name__ == "__main__":
    migrate_vectors()
