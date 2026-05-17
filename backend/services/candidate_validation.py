import hashlib
import re
from collections import Counter

from fastapi import HTTPException


MAX_RESUME_BYTES = 150 * 1024

ALLOWED_ROLES = {
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "AI/ML Engineer",
    "Product Manager",
}

ROLE_KEYWORDS = {
    "Frontend Developer": {
        "frontend", "front-end", "react", "javascript", "typescript", "html",
        "css", "tailwind", "vite", "redux", "ui", "ux", "browser",
    },
    "Backend Developer": {
        "backend", "back-end", "api", "fastapi", "django", "flask", "node",
        "database", "postgres", "sql", "server", "microservice",
    },
    "Full Stack Developer": {
        "frontend", "backend", "fullstack", "full-stack", "react", "api",
        "database", "javascript", "node", "python", "server",
    },
    "AI/ML Engineer": {
        "machine", "learning", "ml", "ai", "tensorflow", "pytorch", "model",
        "nlp", "computer", "vision", "llm", "embedding", "data",
    },
    "Product Manager": {
        "product", "roadmap", "stakeholder", "metrics", "analytics",
        "strategy", "user", "research", "prioritization", "launch",
    },
}

TEMPLATE_PATTERNS = {
    "lorem ipsum",
    "your name",
    "company name",
    "responsible for [",
    "insert",
    "template",
}


def validate_candidate_inputs(name, email, role, resume):
    normalized_name = (name or "").strip()
    normalized_email = (email or "").strip().lower()
    normalized_role = (role or "").strip()

    if not normalized_name:
        raise HTTPException(status_code=422, detail="Name is required.")

    if len(normalized_name) < 3:
        raise HTTPException(status_code=422, detail="Name must be at least 3 characters.")

    if len(normalized_name) > 50:
        raise HTTPException(status_code=422, detail="Name must be 50 characters or fewer.")

    if not re.match(r"^[A-Za-z ]+$", normalized_name):
        raise HTTPException(status_code=422, detail="Only letters and spaces allowed.")

    if not is_valid_email(normalized_email):
        raise HTTPException(status_code=422, detail="Enter a valid email address.")

    if normalized_role not in ALLOWED_ROLES:
        raise HTTPException(status_code=422, detail="Select a valid role.")

    if resume is None or not resume.filename:
        raise HTTPException(status_code=422, detail="Resume upload is required.")

    if resume.content_type != "application/pdf":
        raise HTTPException(status_code=422, detail="Only PDF resumes are allowed.")

    return normalized_name, normalized_email, normalized_role


def is_valid_email(email):
    return bool(re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email or ""))


def validate_mobile_number(mobile_number):
    normalized_mobile = re.sub(r"\D", "", mobile_number or "")

    if len(normalized_mobile) != 10:
        raise HTTPException(status_code=422, detail="Enter a valid 10 digit mobile number.")

    return normalized_mobile


def validate_resume_bytes(file_bytes):
    if not file_bytes:
        raise HTTPException(status_code=422, detail="Resume upload is required.")

    if len(file_bytes) > MAX_RESUME_BYTES:
        raise HTTPException(status_code=413, detail="Resume exceeds maximum upload size.")

    if not file_bytes.startswith(b"%PDF"):
        raise HTTPException(status_code=422, detail="Only PDF resumes are allowed.")


def generate_file_hash(file_bytes):
    return hashlib.sha256(file_bytes).hexdigest()


def detect_role_mismatch(role, resume_text):
    normalized_text = (resume_text or "").lower()
    role_keywords = ROLE_KEYWORDS.get(role, set())

    if not normalized_text.strip():
        return True

    matches = sum(1 for keyword in role_keywords if keyword in normalized_text)

    return matches < 2


def detect_suspicious_resume(resume_text):
    normalized_text = re.sub(r"\s+", " ", (resume_text or "").lower()).strip()
    words = re.findall(r"[a-zA-Z][a-zA-Z+#.-]*", normalized_text)

    reasons = []

    if len(words) < 50:
        reasons.append("empty_semantic_content")

    counts = Counter(words)
    meaningful_words = [
        (word, count)
        for word, count in counts.items()
        if len(word) > 3
    ]

    if meaningful_words:
        top_word, top_count = max(meaningful_words, key=lambda item: item[1])
        if top_count >= 20 or top_count / max(len(words), 1) > 0.08:
            reasons.append(f"repeated_keyword:{top_word}")

    skill_terms = {
        "react", "python", "java", "javascript", "typescript", "sql", "aws",
        "docker", "kubernetes", "tensorflow", "pytorch", "node", "fastapi",
        "django", "flask", "html", "css", "machine", "learning",
    }
    skill_hits = sum(1 for word in words if word in skill_terms)

    if words and skill_hits / len(words) > 0.28:
        reasons.append("unrealistic_skill_density")

    if any(pattern in normalized_text for pattern in TEMPLATE_PATTERNS):
        reasons.append("template_pattern")

    return {
        "suspicious": bool(reasons),
        "reasons": reasons,
    }
