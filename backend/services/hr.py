from fastapi import HTTPException

from services.database import supabase

VALID_STATUSES = {
    "pending",
    "shortlisted",
    "rejected",
    "interview",
    "ai_reviewed"
}


def get_all_applicants():

    response = supabase.table(
        "applicants"
    ).select("*").order(
        "created_at",
        desc=True
    ).execute()

    return response.data


def get_applicant_by_id(applicant_id):

    response = supabase.table(
        "applicants"
    ).select("*").eq(
        "id",
        applicant_id
    ).limit(1).execute()

    if not response.data:
        return None

    return response.data[0]


def update_applicant_status(
    applicant_id,
    status
):

    normalized_status = status.lower().strip()

    if normalized_status not in VALID_STATUSES:
        raise HTTPException(
            status_code=422,
            detail="Invalid applicant status"
        )

    existing = get_applicant_by_id(applicant_id)

    if existing is None:
        raise HTTPException(
            status_code=404,
            detail="Candidate not found"
        )

    # Update applicant status
    response = supabase.table(
        "applicants"
    ).update({
        "status": normalized_status
    }).eq(
        "id",
        applicant_id
    ).execute()

    if not response.data:
        raise HTTPException(
            status_code=500,
            detail="Failed to update applicant status"
        )

    # Get updated applicant data
    applicant = response.data[0]

    return applicant
