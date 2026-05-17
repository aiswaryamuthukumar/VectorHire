from collections import defaultdict

from services.database import supabase


# REMOVE DUPLICATE CHUNKS
def remove_duplicate_chunks(results):

    seen = set()
    unique_results = []

    for result in results:

        chunk_text = result["chunk"].strip()

        key = (
            result["filename"],
            chunk_text
        )

        if key not in seen:

            seen.add(key)
            unique_results.append(result)

    return unique_results


# SEARCH RELEVANT CHUNKS
def search_resumes(query):

    try:
        from services.embeddings import generate_embeddings

        # Convert query into embedding
        query_embedding = generate_embeddings([query])[0]
    except Exception as exc:
        print(f"Embedding search disabled: {exc}")
        return []

    # Search similar chunks
    response = supabase.rpc(
        "match_resume_chunks",
        {
            "query_embedding": query_embedding,
            "match_threshold": 0.45,
            "match_count": 15
        }
    ).execute()

    results = response.data

    # REMOVE DUPLICATES
    results = remove_duplicate_chunks(results)

    return results


# SKILL MATCH SCORE
def calculate_skill_match(query, chunks):

    query_words = set(
        query.lower().split()
    )

    text = " ".join(chunks).lower()

    matched = 0

    for word in query_words:

        if word in text:
            matched += 1

    return matched


# RANK CANDIDATES
def rank_candidates(query):

    if not query or not query.strip():
        return []

    # Retrieve matching chunks
    results = search_resumes(query)

    # Store candidate information
    candidate_data = defaultdict(
        lambda: {
            "scores": [],
            "chunks": []
        }
    )

    # Group by candidate
    for result in results:

        filename = result["filename"]

        candidate_data[filename]["scores"].append(
            result["similarity"]
        )

        candidate_data[filename]["chunks"].append(
            result["chunk"]
        )

    ranked_candidates = []

    # Build ranking response
    for filename, data in candidate_data.items():

        avg_score = sum(
            data["scores"]
        ) / len(data["scores"])

        # SKILL MATCH
        skill_match = calculate_skill_match(
            query,
            data["chunks"]
        )

        # FINAL SCORE
        final_score = (
            avg_score * 0.8
        ) + (
            skill_match * 0.2
        )

        ranked_candidates.append({

            "candidate": filename,

            "average_similarity": round(
                avg_score,
                3
            ),

            "skill_match_score": skill_match,

            "final_score": round(
                final_score,
                3
            ),

            "matched_chunks": len(
                data["chunks"]
            ),

            "evidence": data["chunks"][:3]

        })

    # Sort highest first
    ranked_candidates = sorted(
        ranked_candidates,
        key=lambda x: x["final_score"],
        reverse=True
    )

    return ranked_candidates


def get_applicants_by_resume_filenames(filenames):

    if not filenames:
        return {}

    response = supabase.table(
        "applicants"
    ).select("*").in_(
        "resume_filename",
        filenames
    ).execute()

    return {
        applicant.get("resume_filename"): applicant
        for applicant in response.data
    }


def build_candidate_matches(query):

    ranked = rank_candidates(query)

    applicants_by_resume = get_applicants_by_resume_filenames(
        [candidate["candidate"] for candidate in ranked]
    )

    matches = []

    for candidate in ranked:

        applicant = applicants_by_resume.get(
            candidate["candidate"]
        )

        if not applicant:
            continue

        matches.append({
            "id": applicant.get("id"),
            "name": applicant.get("name"),
            "email": applicant.get("email"),
            "role": applicant.get("role"),
            "status": applicant.get("status"),
            "resume_filename": applicant.get("resume_filename"),
            "semantic_score": candidate.get("final_score"),
            "average_similarity": candidate.get("average_similarity"),
            "skill_match_score": candidate.get("skill_match_score"),
            "matched_chunks": candidate.get("matched_chunks"),
            "evidence": candidate.get("evidence", []),
            "retrieved_strengths": candidate.get("evidence", [])
        })

    return matches
