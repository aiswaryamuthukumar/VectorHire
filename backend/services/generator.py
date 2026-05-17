from google import genai
from dotenv import load_dotenv

import os
from pathlib import Path

# Load environment variables
load_dotenv(Path(__file__).resolve().parents[1] / ".env")

client = None


def get_gemini_client():
    global client

    if client is None:
        api_key = os.getenv("GEMINI_API_KEY")

        if not api_key:
            raise RuntimeError("Missing GEMINI_API_KEY environment variable.")

        client = genai.Client(api_key=api_key)

    return client


# ANALYZE RETRIEVED CHUNKS
def generate_response(
    query,
    retrieved_chunks
):

    # Combine retrieved chunks into context
    context = "\n\n".join(
        [chunk["chunk"] for chunk in retrieved_chunks]
    )

    # Prompt
    prompt = f"""
    You are an AI recruitment assistant.

    Recruiter Query:
    {query}

    Candidate Resume Information:
    {context}

    Analyze the candidate suitability.

    Mention:
    - relevant skills
    - relevant projects
    - strengths
    - overall suitability

    IMPORTANT:
    - Only mention skills explicitly present in the resume
    - Do not assume technologies not mentioned
    - Use evidence from the retrieved resume content

    Keep the response professional and concise.
    """

    try:

        response = get_gemini_client().models.generate_content(
            model="gemini-3.1-flash-lite",
            contents=prompt
        )

        return response.text

    except Exception as e:

        return f"Gemini Error: {str(e)}"


# ANALYZE TOP CANDIDATES
def generate_candidate_ranking(
    query,
    ranked_candidates
):

    # Build candidate context with ACTUAL EVIDENCE
    candidate_context = "\n".join([

        f"""
Candidate: {candidate["candidate"]}

Average Similarity:
{candidate["average_similarity"]}

Evidence:
{candidate["evidence"]}
"""

        for candidate in ranked_candidates
    ])

    # Better recruiter-focused prompt
    prompt = f"""
    You are an AI hiring assistant.

    Recruiter Requirement:
    {query}

    Ranked Candidate Results:
    {candidate_context}

    Analyze the candidates carefully using ONLY the provided evidence.

    Instructions:
    1. Identify the best candidate for the recruiter requirement
    2. Prioritize direct technology matches strongly
    3. Do NOT assume skills not explicitly mentioned
    4. Prefer candidates with exact mentions of required technologies
    5. Use evidence text as the primary source
    6. Mention strengths based strictly on retrieved information
    7. Compare briefly with other candidates

    Keep the response professional and concise.
    """

    try:

        response = get_gemini_client().models.generate_content(
            model="gemini-3.1-flash-lite",
            contents=prompt
        )

        return response.text

    except Exception as e:

        return f"Gemini Error: {str(e)}"
