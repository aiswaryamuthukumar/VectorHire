from services.database import supabase


def store_applicant(
    name,
    email,
    role,
    resume_filename
):

    try:

        # CHECK DUPLICATE EMAIL
        existing = supabase.table(
            "applicants"
        ).select(
            "id"
        ).eq(
            "email",
            email
        ).execute()

        if existing.data:

            return {
                "success": False,
                "message": "Applicant already exists"
            }

        # INSERT DATA
        data = {
            "name": name,
            "email": email,
            "role": role,
            "resume_filename": resume_filename,
            "status": "pending"
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