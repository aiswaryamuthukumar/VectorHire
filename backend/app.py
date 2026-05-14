from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel

import os
import shutil
import hashlib
import re

from services.chunker import chunk_text
from services.parser import extract_text_from_pdf
from services.embeddings import generate_embeddings

from services.database import (
    store_resume_chunks,
    check_resume_hash_exists
)

from services.retriever import (
    build_candidate_matches
)

from services.generator import (
    generate_candidate_ranking
)

from services.applicants import (
    store_applicant
)

from services.hr import (
    get_all_applicants,
    update_applicant_status,
    VALID_STATUSES
)

from services.email_service import (
    safely_send_status_email
)

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_FOLDER = "uploads"

os.makedirs(
    UPLOAD_FOLDER,
    exist_ok=True
)


class StatusUpdateRequest(BaseModel):
    candidate_id: int
    status: str


class ChatRequest(BaseModel):
    query: str


def get_resume_filename(applicant):
    return applicant.get("resume_filename") or applicant.get("filename")


def normalize_applicant(applicant):

    if not applicant:
        return applicant

    normalized = dict(applicant)
    resume_filename = get_resume_filename(normalized)
    normalized["resume_filename"] = resume_filename
    normalized["filename"] = resume_filename
    normalized["status"] = (
        normalized.get("status") or "pending"
    ).lower()

    return normalized


def normalize_applicants(applicants):
    return [
        normalize_applicant(applicant)
        for applicant in applicants
    ]


def build_dashboard_payload(applicants):

    normalized = normalize_applicants(applicants)
    counts = {
        "total_candidates": len(normalized),
        "pending_review": 0,
        "ai_reviewed": 0,
        "shortlisted": 0,
        "rejected": 0,
        "interview_scheduled": 0
    }

    for applicant in normalized:
        status = applicant.get("status", "pending")

        if status == "pending":
            counts["pending_review"] += 1
        elif status == "ai_reviewed":
            counts["ai_reviewed"] += 1
        elif status == "shortlisted":
            counts["shortlisted"] += 1
        elif status == "rejected":
            counts["rejected"] += 1
        elif status == "interview":
            counts["interview_scheduled"] += 1

    recent = sorted(
        normalized,
        key=lambda item: item.get("updated_at") or item.get("created_at") or "",
        reverse=True
    )[:10]

    return {
        "counts": counts,
        "recent_activity": recent,
        "live_application_feed": normalized[:10],
        "semantic_match_insights": []
    }


# HOME
@app.get("/")
def home():

    return {
        "message": "VectorHire Backend Running"
    }


# GENERATE RESUME HASH
def generate_resume_hash(text):

    # NORMALIZE TEXT
    text = text.lower()

    text = re.sub(
        r"\s+",
        " ",
        text
    ).strip()

    return hashlib.md5(
        text.encode("utf-8")
    ).hexdigest()


# APPLY FOR JOB
@app.post("/apply")
async def apply(

    name: str = Form(...),
    email: str = Form(...),
    role: str = Form(...),

    resume: UploadFile = File(...)

):

    try:

        # CREATE UNIQUE FILENAME
        unique_filename = f"{email}_{resume.filename}"

        # SAVE FILE
        file_path = os.path.join(
            UPLOAD_FOLDER,
            unique_filename
        )

        with open(file_path, "wb") as buffer:

            shutil.copyfileobj(
                resume.file,
                buffer
            )

        # EXTRACT PDF TEXT
        extracted_text = extract_text_from_pdf(
            file_path
        )

        # GENERATE HASH
        resume_hash = generate_resume_hash(
            extracted_text
        )

        # CHECK RESUME DUPLICATE
        if check_resume_hash_exists(
            resume_hash
        ):

            # DELETE DUPLICATE FILE
            os.remove(file_path)

            return JSONResponse(content={

                "success": False,

                "message": "Duplicate resume already exists",

                "candidate_name": name,

                "email": email

            })

        # CHUNK TEXT
        chunks = chunk_text(
            extracted_text
        )

        # GENERATE EMBEDDINGS
        embeddings = generate_embeddings(
            chunks
        )

        # STORE VECTOR CHUNKS
        store_resume_chunks(

            filename=unique_filename,

            chunks=chunks,

            embeddings=embeddings,

            resume_hash=resume_hash

        )

        # STORE APPLICANT
        applicant_response = store_applicant(

            name=name,

            email=email,

            role=role,

            resume_filename=unique_filename

        )

        # DUPLICATE APPLICANT
        if applicant_response.get("success") == False:

            return JSONResponse(content={

                "success": False,

                "message": applicant_response["message"],

                "candidate_name": name,

                "email": email

            })

        # SUCCESS RESPONSE
        return JSONResponse(content={

            "success": True,

            "message": "Application submitted successfully",

            "candidate_name": name,

            "email": email,

            "role": role,

            "resume": unique_filename

        })

    except Exception as e:

        print("ERROR:", str(e))

        return JSONResponse(

            status_code=500,

            content={

                "success": False,

                "message": str(e)

            }

        )


# GET ALL APPLICANTS
@app.get("/get-applicants")
def get_applicants():

    applicants = get_all_applicants()

    return JSONResponse(content={

        "applicants": normalize_applicants(applicants)

    })


@app.get("/dashboard")
def dashboard():

    applicants = get_all_applicants()

    return JSONResponse(
        content=build_dashboard_payload(applicants)
    )


# UPDATE APPLICANT STATUS
@app.put("/update-status")
async def update_status(request: StatusUpdateRequest):

    normalized_status = request.status.lower().strip()

    if normalized_status in {"shortlisted", "rejected", "interview"}:
        return await _update_status_with_email(
            request.candidate_id,
            normalized_status
        )

    updated = update_applicant_status(

        request.candidate_id,
        normalized_status

    )

    return JSONResponse(content={

        "message": "Applicant status updated",

        "updated_data": normalize_applicant(updated)

    })


async def _update_status_with_email(candidate_id, status):

    updated = update_applicant_status(
        candidate_id,
        status
    )

    email_result = await safely_send_status_email(
        updated,
        status
    )

    return JSONResponse(content={
        "message": "Applicant status updated",
        "updated_data": normalize_applicant(updated),
        "email": email_result
    })


@app.post("/candidate/shortlist/{candidate_id}")
async def shortlist_candidate(candidate_id: int):

    return await _update_status_with_email(
        candidate_id,
        "shortlisted"
    )


@app.post("/candidate/reject/{candidate_id}")
async def reject_candidate(candidate_id: int):

    return await _update_status_with_email(
        candidate_id,
        "rejected"
    )


@app.post("/candidate/interview/{candidate_id}")
async def interview_candidate(candidate_id: int):

    return await _update_status_with_email(
        candidate_id,
        "interview"
    )


# VIEW RESUME
@app.get("/resume/{filename}")
def view_resume(filename: str):

    safe_filename = os.path.basename(filename)

    if safe_filename != filename:
        raise HTTPException(
            status_code=400,
            detail="Invalid resume filename"
        )

    file_path = os.path.abspath(
        os.path.join(
            UPLOAD_FOLDER,
            safe_filename
        )
    )

    upload_root = os.path.abspath(UPLOAD_FOLDER)

    if not file_path.startswith(upload_root):
        raise HTTPException(
            status_code=400,
            detail="Invalid resume filename"
        )

    # FILE NOT FOUND
    if not os.path.exists(
        file_path
    ):

        raise HTTPException(
            status_code=404,
            detail="Resume not found"
        )

    return FileResponse(

        path=file_path,

        media_type="application/pdf",

        filename=safe_filename

    )


# AI RANK CANDIDATES
@app.get("/ai-rank-candidates")
def ai_rank_candidates(query: str):

    # RETRIEVE + RANK
    ranked_candidates = build_candidate_matches(
        query
    )

    ai_analysis = None

    if ranked_candidates:
        ai_analysis = generate_candidate_ranking(

            query,

            [
                {
                    "candidate": candidate.get("name"),
                    "average_similarity": candidate.get("average_similarity"),
                    "evidence": candidate.get("evidence", [])
                }
                for candidate in ranked_candidates
            ]

        )

    return JSONResponse(content={

        "query": query,

        "ranked_candidates": ranked_candidates,
        "candidates": ranked_candidates,

        "ai_analysis": ai_analysis

    })


@app.post("/chatbot")
async def chatbot(request: ChatRequest):

    matches = build_candidate_matches(
        request.query
    )

    if not matches:
        return JSONResponse(content={
            "answer": "No matching candidates found in the indexed talent database.",
            "candidates": []
        })

    ai_analysis = generate_candidate_ranking(
        request.query,
        [
            {
                "candidate": candidate.get("name"),
                "average_similarity": candidate.get("average_similarity"),
                "evidence": candidate.get("evidence", [])
            }
            for candidate in matches
        ]
    )

    return JSONResponse(content={
        "answer": ai_analysis,
        "candidates": matches
    })
