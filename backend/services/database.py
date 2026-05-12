from supabase import create_client
from dotenv import load_dotenv

import os

# Load .env file
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Create Supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def store_resume_chunks(filename, chunks, embeddings):

    data = []

    for chunk, embedding in zip(chunks, embeddings):

        data.append({
            "filename": filename,
            "chunk": chunk,
            "embedding": embedding
        })

    response = supabase.table("resume_chunks").insert(data).execute()

    return response