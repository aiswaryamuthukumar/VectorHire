from services.database import supabase


def applicant_email_exists(email):

    response = supabase.table(
        "applicants"
    ).select(
        "id"
    ).eq(
        "email",
        email
    ).limit(1).execute()

    return bool(response.data)


def resume_hash_exists(resume_hash):

    try:
        response = supabase.table(
            "applicants"
        ).select(
            "id"
        ).eq(
            "resume_hash",
            resume_hash
        ).limit(1).execute()
    except Exception:
        return False

    return bool(response.data)


def store_applicant(
    name,
    email,
    mobile_number,
    role,
    resume_filename,
    resume_hash=None,
    duplicate_resume=False,
    role_mismatch=False,
    suspicious_resume=False,
    fraud_flags=None,
    email_verified=False,
    mobile_verified=False
):

    try:

        if applicant_email_exists(email):

            return {
                "success": False,
                "message": "You have already applied."
            }

        # INSERT DATA
        data = {
            "name": name,
            "email": email,
            "mobile_number": mobile_number,
            "role": role,
            "resume_filename": resume_filename,
            "status": "pending",
            "resume_hash": resume_hash,
            "duplicate_resume": duplicate_resume,
            "role_mismatch": role_mismatch,
            "suspicious_resume": suspicious_resume,
            "fraud_flags": fraud_flags or [],
            "email_verified": email_verified,
            "mobile_verified": mobile_verified
        }

        supabase.table(
            "applicants"
        ).insert(data).execute()

        print("APPLICANT STORED SUCCESSFULLY")

        return {
            "success": True,
            "message": "Application submitted successfully"
        }

    except Exception as e:

        print("SUPABASE ERROR:", str(e))

        return {
            "success": False,
            "message": str(e)
        }
