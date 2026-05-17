from fastapi import Depends, FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel

import os
from pathlib import Path

from dotenv import load_dotenv

from services.database import (
    store_resume_chunks,
    check_resume_hash_exists
)

from services.applicants import (
    applicant_email_exists,
    resume_hash_exists,
    store_applicant
)

from services.candidate_validation import (
    detect_role_mismatch,
    detect_suspicious_resume,
    generate_file_hash,
    is_valid_email,
    validate_mobile_number,
    validate_candidate_inputs,
    validate_resume_bytes
)

from services.hr import (
    get_all_applicants,
    update_applicant_status
)

from services.email_service import (
    send_candidate_otp_email,
    safely_send_status_email
)

from services.auth import (
    require_recruiter
)

from services.otp_service import (
    generate_otp,
    is_verified,
    store_otp,
    verify_otp
)

from fastapi.middleware.cors import CORSMiddleware

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

app = FastAPI()


def _get_cors_origins():
    configured = os.getenv("CORS_ORIGINS") or os.getenv("FRONTEND_ORIGINS") or os.getenv("FRONTEND_URL") or ""
    origins = [
        origin.strip().rstrip("/")
        for origin in configured.split(",")
        if origin.strip()
    ]

    return origins or [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


app.add_middleware(
    CORSMiddleware,
    allow_origins=_get_cors_origins(),
    allow_origin_regex=os.getenv("CORS_ORIGIN_REGEX", r"https://.*\.netlify\.app"),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", str(BASE_DIR / "uploads"))

os.makedirs(
    UPLOAD_FOLDER,
    exist_ok=True
)


def _extract_text_from_pdf(file_path):
    from services.parser import extract_text_from_pdf

    return extract_text_from_pdf(file_path)


def _chunk_text(text):
    from services.chunker import chunk_text

    return chunk_text(text)


def _generate_embeddings(chunks):
    from services.embeddings import generate_embeddings

    return generate_embeddings(chunks)


def _build_candidate_matches(query):
    from services.retriever import build_candidate_matches

    return build_candidate_matches(query)


def _generate_candidate_ranking(query, ranked_candidates):
    from services.generator import generate_candidate_ranking

    return generate_candidate_ranking(query, ranked_candidates)


class StatusUpdateRequest(BaseModel):
    candidate_id: int
    status: str


class ChatRequest(BaseModel):
    query: str


class EmailOtpRequest(BaseModel):
    email: str


class VerifyEmailOtpRequest(BaseModel):
    email: str
    otp: str


class MobileOtpRequest(BaseModel):
    mobile_number: str


class VerifyMobileOtpRequest(BaseModel):
    mobile_number: str
    otp: str


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
    normalized["duplicate_email"] = bool(normalized.get("duplicate_email", False))
    normalized["duplicate_resume"] = bool(normalized.get("duplicate_resume", False))
    normalized["role_mismatch"] = bool(normalized.get("role_mismatch", False))
    normalized["suspicious_resume"] = bool(normalized.get("suspicious_resume", False))
    normalized["email_verified"] = bool(normalized.get("email_verified", False))
    normalized["mobile_verified"] = bool(normalized.get("mobile_verified", False))
    normalized["fraud_flags"] = normalized.get("fraud_flags") or []

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


@app.post("/send-email-otp")
async def send_email_otp(request: EmailOtpRequest):
    email = (request.email or "").strip().lower()

    if not is_valid_email(email):
        raise HTTPException(status_code=422, detail="Enter a valid email address.")

    otp = generate_otp()
    store_otp("email", email, otp)
    await send_candidate_otp_email(email, otp)

    return JSONResponse(content={
        "success": True,
        "message": "OTP sent to email."
    })


@app.post("/verify-email-otp")
async def verify_email_otp(request: VerifyEmailOtpRequest):
    email = (request.email or "").strip().lower()

    if not verify_otp("email", email, request.otp):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP.")

    return JSONResponse(content={
        "success": True,
        "message": "Email verified."
    })


@app.post("/send-mobile-otp")
async def send_mobile_otp(request: MobileOtpRequest):
    mobile_number = validate_mobile_number(request.mobile_number)
    otp = generate_otp()
    store_otp("mobile", mobile_number, otp)

    response = {
        "success": True,
        "message": "OTP sent to mobile."
    }

    if os.getenv("RETURN_DEV_OTP", "false").lower() == "true":
        response["dev_otp"] = otp

    print(f"VectorHire mobile OTP for {mobile_number}: {otp}")

    return JSONResponse(content=response)


@app.post("/verify-mobile-otp")
async def verify_mobile_otp(request: VerifyMobileOtpRequest):
    mobile_number = validate_mobile_number(request.mobile_number)

    if not verify_otp("mobile", mobile_number, request.otp):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP.")

    return JSONResponse(content={
        "success": True,
        "message": "Mobile verified."
    })


# APPLY FOR JOB
@app.post("/apply")
async def apply(

    name: str = Form(...),
    email: str = Form(...),
    mobile_number: str = Form(...),
    role: str = Form(...),

    resume: UploadFile = File(...)

):

    try:

        name, email, role = validate_candidate_inputs(
            name,
            email,
            role,
            resume
        )
        mobile_number = validate_mobile_number(mobile_number)

        file_bytes = await resume.read()
        validate_resume_bytes(file_bytes)

        if not is_verified("email", email):
            raise HTTPException(status_code=403, detail="Email verification required.")

        if applicant_email_exists(email):
            return JSONResponse(
                status_code=409,
                content={
                    "success": False,
                    "message": "You have already applied.",
                    "candidate_name": name,
                    "email": email
                }
            )

        resume_hash = generate_file_hash(file_bytes)
        duplicate_resume = resume_hash_exists(resume_hash) or check_resume_hash_exists(
            resume_hash
        )

        # CREATE UNIQUE FILENAME
        safe_original_filename = os.path.basename(resume.filename)
        unique_filename = f"{email}_{safe_original_filename}"

        # SAVE FILE
        file_path = os.path.join(
            UPLOAD_FOLDER,
            unique_filename
        )

        with open(file_path, "wb") as buffer:

            buffer.write(file_bytes)

        # EXTRACT PDF TEXT
        extracted_text = _extract_text_from_pdf(
            file_path
        )

        role_mismatch = detect_role_mismatch(
            role,
            extracted_text
        )

        suspicious_result = detect_suspicious_resume(
            extracted_text
        )

        fraud_flags = []

        if duplicate_resume:
            fraud_flags.append("duplicate_resume")

        if role_mismatch:
            fraud_flags.append("role_mismatch")

        if suspicious_result["suspicious"]:
            fraud_flags.extend(suspicious_result["reasons"])

        # CHUNK TEXT
        chunks = _chunk_text(
            extracted_text
        )

        # GENERATE EMBEDDINGS
        embeddings = _generate_embeddings(
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

            mobile_number=mobile_number,

            role=role,

            resume_filename=unique_filename,

            resume_hash=resume_hash,

            duplicate_resume=duplicate_resume,

            role_mismatch=role_mismatch,

            suspicious_resume=suspicious_result["suspicious"],

            fraud_flags=fraud_flags,

            email_verified=True,

            mobile_verified=False

        )

        # DUPLICATE APPLICANT
        if applicant_response.get("success") == False:

            status_code = 409 if applicant_response["message"] == "You have already applied." else 400

            return JSONResponse(status_code=status_code, content={

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

            "mobile_number": mobile_number,

            "role": role,

            "resume": unique_filename,

            "email_verified": True,

            "mobile_verified": False,

            "review_flags": fraud_flags

        })

    except HTTPException:
        raise

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
def get_applicants(_recruiter=Depends(require_recruiter)):

    applicants = get_all_applicants()

    return JSONResponse(content={

        "applicants": normalize_applicants(applicants)

    })


@app.get("/dashboard")
def dashboard(_recruiter=Depends(require_recruiter)):

    applicants = get_all_applicants()

    return JSONResponse(
        content=build_dashboard_payload(applicants)
    )


# UPDATE APPLICANT STATUS
@app.put("/update-status")
async def update_status(
    request: StatusUpdateRequest,
    _recruiter=Depends(require_recruiter)
):

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
async def shortlist_candidate(
    candidate_id: int,
    _recruiter=Depends(require_recruiter)
):

    return await _update_status_with_email(
        candidate_id,
        "shortlisted"
    )


@app.post("/candidate/reject/{candidate_id}")
async def reject_candidate(
    candidate_id: int,
    _recruiter=Depends(require_recruiter)
):

    return await _update_status_with_email(
        candidate_id,
        "rejected"
    )


@app.post("/candidate/interview/{candidate_id}")
async def interview_candidate(
    candidate_id: int,
    _recruiter=Depends(require_recruiter)
):

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
def ai_rank_candidates(
    query: str,
    _recruiter=Depends(require_recruiter)
):

    # RETRIEVE + RANK
    ranked_candidates = _build_candidate_matches(
        query
    )

    ai_analysis = None

    if ranked_candidates:
        ai_analysis = _generate_candidate_ranking(

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
async def chatbot(
    request: ChatRequest,
    _recruiter=Depends(require_recruiter)
):

    matches = _build_candidate_matches(
        request.query
    )

    if not matches:
        return JSONResponse(content={
            "answer": "No matching candidates found in the indexed talent database.",
            "candidates": []
        })

    ai_analysis = _generate_candidate_ranking(
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
