# VectorHire – AI-Powered Applicant Tracking System (ATS)

## Live Demo

Frontend:
https://Vectorhire.netlify.app/

Backend:
https://vectorhire.onrender.com

---
## HR Access

Recruiter credentials are available for authorized reviewers/demo purposes only.
Please contact the project owner for access.

## Deployment Architecture

Frontend:

* Netlify

Backend:

* Render

Database:

* Supabase PostgreSQL + pgvector

AI Services:

* Gemini LLM
* Sentence Transformers

---

## Local Development Setup

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app:app --reload --port 8001
```

---

## Production Deployment

### Frontend Deployment

* Netlify

### Backend Deployment

* Render

### Environment Variables

Backend:

```env
SUPABASE_URL=
SUPABASE_KEY=
GEMINI_API_KEY=
ENABLE_LOCAL_EMBEDDINGS=false
FRONTEND_URL=
```

Frontend:

```env
VITE_API_URL=https://vectorhire.onrender.com
```

---

## System Architecture

Candidate Upload
↓
Resume Parsing
↓
Chunking
↓
Embedding Generation
↓
Supabase pgvector Storage
↓
Semantic Retrieval
↓
Gemini AI Ranking
↓
Recruiter Dashboard

---

## Current Status

* Full-stack deployment completed
* Frontend deployed on Netlify
* Backend deployed on Render
* AI semantic retrieval working
* Resume upload pipeline working
* Gemini AI ranking integrated
* Supabase vector storage integrated
