from google import genai
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Create Gemini client
client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

def generate_response(query, retrieved_chunks):

    # Combine retrieved chunks into context
    context = "\n\n".join(
        [chunk["chunk"] for chunk in retrieved_chunks]
    )

    # Prompt for Gemini
    prompt = f"""
    You are an AI recruitment assistant.

    Recruiter Query:
    {query}

    Candidate Resume Information:
    {context}

    Analyze the candidate suitability for the recruiter query.

    Mention:
    - relevant skills
    - relevant projects
    - strengths
    - overall suitability

    Keep the response professional and concise.
    """

    # Generate Gemini response
    try:

        response = client.models.generate_content(
            model="gemini-3.1-flash-lite",
            contents=prompt
        )

        return response.text

    except Exception as e:

        return f"Gemini Error: {str(e)}"