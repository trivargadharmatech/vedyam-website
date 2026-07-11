import os
import sys
import psycopg2
import json

# Add backend to path so we can import modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings

def main():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("ERROR: DATABASE_URL is not set.")
        print("Please set DATABASE_URL to your Supabase PostgreSQL connection string.")
        return

    vectorstore_dir = os.path.join(os.path.dirname(__file__), '..', 'backend', 'vectorstore')
    
    if not os.path.exists(vectorstore_dir):
        print(f"ERROR: vectorstore directory not found at {vectorstore_dir}")
        return

    print("Loading local FAISS vectorstore...")
    
    # We use a dummy embedding function to load the FAISS index because we only need the data
    # but FAISS load_local requires an embedding function. We use the same local model if possible.
    try:
        embeddings = HuggingFaceEmbeddings(model_name="BAAI/bge-base-en-v1.5")
    except Exception as e:
        print(f"Warning: Could not load embedding model, using a dummy wrapper. {e}")
        class DummyEmbeddings:
            def embed_documents(self, texts): return [[0.0]*768]*len(texts)
            def embed_query(self, text): return [0.0]*768
        embeddings = DummyEmbeddings()

    vectorstore = FAISS.load_local(
        vectorstore_dir,
        embeddings,
        allow_dangerous_deserialization=True
    )
    
    docs_and_scores = vectorstore.docstore._dict
    print(f"Successfully loaded {len(docs_and_scores)} documents from FAISS.")
    
    print("Connecting to PostgreSQL database...")
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
    except Exception as e:
        print(f"ERROR: Could not connect to PostgreSQL: {e}")
        return

    # Enable pgvector extension and create table if they don't exist
    print("Ensuring pgvector extension and table exist...")
    cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
    cur.execute("""
    CREATE TABLE IF NOT EXISTS document_chunks (
        id          SERIAL PRIMARY KEY,
        source      VARCHAR(255) NOT NULL,
        content     TEXT NOT NULL,
        metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
        embedding   vector(768),
        created_at  BIGINT NOT NULL
    );
    """)
    conn.commit()

    print("Clearing existing data...")
    cur.execute("TRUNCATE TABLE document_chunks RESTART IDENTITY;")
    conn.commit()

    print("Starting ingestion to PostgreSQL...")
    
    # Extract FAISS vectors. 
    # FAISS stores vectors internally. We need to map them back to the docs.
    # index.reconstruct(i) gets the vector for the i-th document.
    index = vectorstore.index
    doc_ids = list(docs_and_scores.keys())
    
    # Process in batches for performance
    batch_size = 500
    total_docs = len(doc_ids)
    
    import time
    start_time = time.time()
    
    for i in range(0, total_docs, batch_size):
        batch_ids = doc_ids[i:i+batch_size]
        
        args_list = []
        for j, doc_id in enumerate(batch_ids):
            doc = docs_and_scores[doc_id]
            # Get internal FAISS ID (which corresponds to its position)
            # We map doc_id -> internal integer ID using index_to_docstore_id mapping
            internal_idx = list(vectorstore.index_to_docstore_id.keys())[list(vectorstore.index_to_docstore_id.values()).index(doc_id)]
            vector = index.reconstruct(internal_idx).tolist()
            
            source = doc.metadata.get("source", "Unknown")
            metadata = json.dumps(doc.metadata)
            content = doc.page_content
            created_at = int(time.time())
            
            args_list.append((source, content, metadata, vector, created_at))
            
        # Execute batch insert using execute_values for much better performance
        from psycopg2.extras import execute_values
        query = "INSERT INTO document_chunks (source, content, metadata, embedding, created_at) VALUES %s"
        execute_values(cur, query, args_list)
        conn.commit()
        
        print(f"Progress: {min(i + batch_size, total_docs)} / {total_docs} inserted...")
        
    conn.close()
    print(f"Success! Ingested {total_docs} documents in {int(time.time() - start_time)} seconds.")
    print("Your PostgreSQL database is now fully populated!")

if __name__ == "__main__":
    main()
