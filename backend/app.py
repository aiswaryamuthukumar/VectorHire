from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse

from services.chunker import chunk_text
from services.parser import extract_text_from_pdf
from services.embeddings import generate_embeddings
from services.database import store_resume_chunks
from services.retriever import search_resumes
from services.generator import generate_response

import os
import shutil

app = FastAPI()

UPLOAD_FOLDER = "uploads"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@app.get("/")
def home():
    return {"message": "VectorHire Backend Running"}


@app.post("/upload")
async def upload_resume(resume: UploadFile = File(...)):

    # Save uploaded file
    file_path = os.path.join(UPLOAD_FOLDER, resume.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(resume.file, buffer)

    # Extract text from PDF
    extracted_text = extract_text_from_pdf(file_path)

    # Chunk text
    chunks = chunk_text(extracted_text)

    # Generate embeddings
    embeddings = generate_embeddings(chunks)

    # Store in Supabase
    store_resume_chunks(
        resume.filename,
        chunks,
        embeddings
    )

    return JSONResponse(content={
        "message": "Resume uploaded successfully",
        "total_chunks": len(chunks),
        "embedding_dimension": len(embeddings[0]),
        "sample_embedding": embeddings[0][:10]
    })


@app.get("/search")
def search(query: str):

    results = search_resumes(query)

    return JSONResponse(content={
        "query": query,
        "results": results
    })
@app.get("/rag-search")
def rag_search(query: str):

    retrieved_chunks = search_resumes(query)

    ai_response = generate_response(
        query,
        retrieved_chunks
    )

    return JSONResponse(content={
        "query": query,
        "retrieved_chunks": retrieved_chunks,
        "ai_response": ai_response
    })