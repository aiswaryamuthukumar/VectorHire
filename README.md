# VectorHire – AI-Powered Applicant Tracking System (ATS)

## Project Overview

VectorHire is an AI-powered Applicant Tracking System designed to automate resume screening, candidate ranking, and recruitment workflow management using Retrieval-Augmented Generation (RAG), vector embeddings, and Large Language Models (LLMs).

The system allows candidates to apply for jobs by uploading resumes, while recruiters can search, rank, analyze, and manage applicants through AI-assisted workflows.

---

# Core Features

## Candidate Application Workflow

Candidates can:

* Apply for a job role
* Upload PDF resumes
* Submit personal details such as:

  * Name
  * Email
  * Role applied for

When a candidate applies:

1. Resume PDF is uploaded
2. Resume text is extracted
3. Text is chunked into semantic sections
4. Embeddings are generated
5. Resume chunks and embeddings are stored in Supabase with pgvector
6. Applicant details are stored in a separate applicants table

---

# AI Resume Processing Pipeline

The backend automatically performs:

## 1. Resume Parsing

Extracts text content from uploaded PDF resumes.

## 2. Chunking

Splits resume text into smaller semantic chunks for efficient retrieval.

## 3. Embedding Generation

Uses sentence-transformer embeddings to convert chunks into vector representations.

## 4. Vector Database Storage

Stores embeddings inside Supabase pgvector for semantic similarity search.

---

# Semantic Resume Search

Recruiters can search resumes using natural language queries such as:

* "candidate with blockchain and React experience"
* "frontend developer with FastAPI knowledge"

The system retrieves semantically relevant resume chunks using vector similarity search.

---

# AI Candidate Ranking

The platform ranks candidates based on:

* Embedding similarity
* Relevant evidence retrieved from resumes
* AI reasoning using Gemini LLM

The AI provides:

* Relevant skills
* Matching projects
* Candidate strengths
* Overall suitability analysis

---

# Evidence-Based AI Reasoning

The AI system only analyzes retrieved resume evidence and avoids hallucinating skills not present in resumes.

Example:

If a resume explicitly contains:

* React
* Blockchain

the system prioritizes that candidate over resumes containing only partial matches.

---

# HR Applicant Management

Recruiters can:

* View all applicants
* Track candidate application status
* Search and rank candidates
* Perform AI-assisted screening

Application statuses include:

* pending
* shortlisted
* rejected
* interview
* accepted

---

# Resume Storage Architecture

PDF resumes are stored locally inside an uploads folder during development.

Applicant metadata and resume references are stored inside Supabase.

Resume embeddings and chunks are stored separately for semantic AI retrieval.

---

# APIs / Backend Endpoints

## Candidate APIs

* `/apply`
* `/upload`
* `/bulk-upload`

## AI Search APIs

* `/search`
* `/rank-candidates`
* `/rag-search`
* `/ai-rank-candidates`

## HR APIs

* `/get-applicants`
* `/update-status`

---

# Technologies Used

## Backend

* FastAPI

## Database

* Supabase
* PostgreSQL
* pgvector

## AI / NLP

* Sentence Transformers
* Gemini LLM
* RAG Architecture

## Resume Processing

* PDF text extraction
* Semantic chunking
* Embedding generation

---

# Future Enhancements

Planned future improvements include:

* Resume PDF viewing endpoint
* Email notifications for candidates
* HR dashboard frontend
* Candidate cards UI
* JD upload and match percentage
* Skill gap analysis
* Interview scheduling
* Cloud storage integration
* Recruiter analytics dashboard

---

# Project Goal

The goal of VectorHire is to simulate a real-world AI-powered recruitment platform that combines:

* semantic search
* vector databases
* LLM reasoning
* recruiter workflows
* applicant management

into a complete end-to-end Applicant Tracking System.
