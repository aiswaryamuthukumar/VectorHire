from fastapi import Header, HTTPException

from services.database import supabase


def require_recruiter(authorization: str | None = Header(default=None)):

    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=401,
            detail="Recruiter authentication required"
        )

    token = authorization.split(" ", 1)[1].strip()

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Recruiter authentication required"
        )

    try:
        response = supabase.auth.get_user(token)
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired recruiter session"
        )

    user = getattr(response, "user", None)

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired recruiter session"
        )

    return user
