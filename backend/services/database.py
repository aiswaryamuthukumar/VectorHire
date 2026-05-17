from supabase import create_client
from dotenv import load_dotenv

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / ".env")


class SupabaseClientProxy:
    def __init__(self):
        self._client = None

    def _get_client(self):
        if self._client is None:
            supabase_url = os.getenv("SUPABASE_URL")
            supabase_key = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")

            if not supabase_url or not supabase_key:
                raise RuntimeError(
                    "Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_KEY "
                    "or SUPABASE_SERVICE_ROLE_KEY in Render environment variables."
                )

            self._client = create_client(
                supabase_url,
                supabase_key
            )

        return self._client

    def __getattr__(self, name):
        return getattr(self._get_client(), name)


supabase = SupabaseClientProxy()


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
