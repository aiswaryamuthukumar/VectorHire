from services.database import supabase
from services.embeddings import model


def search_resumes(query):

    # Convert query to embedding
    query_embedding = model.encode(query).tolist()

    # Call Supabase similarity search function
    response = supabase.rpc(
        "match_resume_chunks",
        {
            "query_embedding": query_embedding,
            "match_threshold": 0.4,
            "match_count": 3
        }
    ).execute()

    return response.data