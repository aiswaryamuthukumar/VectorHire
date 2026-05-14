from supabase import create_client
from dotenv import load_dotenv

import os
from pathlib import Path

# LOAD ENV VARIABLES
load_dotenv(Path(__file__).resolve().parents[1] / ".env")

SUPABASE_URL = os.getenv(
    "SUPABASE_URL"
)

SUPABASE_KEY = os.getenv(
    "SUPABASE_KEY"
)

# CREATE CLIENT
supabase = create_client(
    SUPABASE_URL,
    SUPABASE_KEY
)


# STORE RESUME CHUNKS
def store_resume_chunks(

    filename,
    chunks,
    embeddings,
    resume_hash

):

    data = []

    for chunk, embedding in zip(
        chunks,
        embeddings
    ):

        data.append({

            "filename": filename,

            "resume_hash": resume_hash,

            "chunk": chunk,

            "embedding": embedding

        })

    response = supabase.table(
        "resume_chunks"
    ).insert(data).execute()

    if hasattr(response, 'data') and not response.data:
        raise Exception("Failed to store resume chunks. Check RLS policies on the 'resume_chunks' table.")

    return response


# CHECK HASH DUPLICATE
def check_resume_hash_exists(
    resume_hash
):

    response = supabase.table(
        "resume_chunks"
    ).select(
        "id"
    ).eq(
        "resume_hash",
        resume_hash
    ).limit(1).execute()

    return len(response.data) > 0


# GET ALL UNIQUE CANDIDATES
def get_all_candidates():

    response = supabase.table(
        "resume_chunks"
    ).select(
        "filename"
    ).execute()

    filenames = set()

    for row in response.data:

        filenames.add(
            row["filename"]
        )

    return list(filenames)
