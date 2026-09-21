# VEIL — Google Gemini Cloud AI & Advanced PDF Study Suite

> *"AI for the knowledge you keep close."*

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsaoudhussaini-sudo%2Fveil&root-directory=frontend)

VEIL is a production-grade, privacy-first AI Document & Study Assistant powered by the **Google Gemini API** (`gemini-2.5-flash`), with complete backward compatibility for local **Ollama** (`qwen2.5:0.5b`) offline execution.

---

## What's New in Version 3.2

1. **Google Gemini Cloud AI Inference**:
   - Production inference powered by Google Gemini (`gemini-2.5-flash`) with large-context reasoning and high speed.
   - 100% Vercel serverless deployment compatible — runs out of the box with zero GPU or local server dependencies.
   - Dual-mode architecture: seamlessly switch between Google Gemini Cloud (Production default) and Ollama Local (Offline air-gapped fallback).

2. **Advanced PDF Study Suite**:
   - **4-Step Study Path**: Systematic learning path: **READ** (Quick Overview) → **UNDERSTAND** (Key Points & Glossary) → **REVISE** (3D Flashcards) → **TEST** (Interactive Exam Quiz).
   - **6 Summary Dimensions**: Quick Summary, Comprehensive Detailed Breakdown, Chapter-by-Chapter Breakdown, High-Impact Key Points, Terms & Glossary, and 2-Sentence TL;DR.
   - **Interactive Quiz Generator & Grader**: Multiple-choice quizzes with configurable difficulty (`Easy`, `Medium`, `Hard`) and count (`5` to `20`), complete with real-time scoring, percentage grading, and in-depth explanations.
   - **Exam Q&A Generator**: Model answers across 5 categories (Short Answer, Long Answer, High-Yield Important Questions, Exam Questions, Conceptual Questions) with page citations.
   - **3D Active-Recall Flashcards**: Card deck with 3D flip animation, previous/next controls, and progress tracking.
   - **11 Specialized AI Tools**: Deep Explain, Simplify (ELI5), Rewrite Notes, Key Points, Real Examples, Compare Concepts, Ask Why, Exam Mode, Cornell Notes, 5-Min Revision, and Cheat Sheet.

3. **Strict Anti-Hallucination Guardrails**:
   - Grounded strictly in uploaded document evidence.
   - If the requested information is not present in the document, VEIL explicitly states: *"The requested information was not found in the uploaded document."*

4. **Student Personalization & In-Memory Caching**:
   - Configurable Learning Level (Beginner / Intermediate / Advanced), Learning Style (Simple / Detailed / Exam-focused / Technical / Examples-first), and Response Length (Short / Balanced / Detailed).
   - Client-side in-memory caching to eliminate redundant Gemini API calls when toggling between study tabs.

5. **Signature Editorial Visual Identity**:
   - Void black base (`#050505`, `#0D0D0D`), champagne gold accents (`#C9A45C`, `#D8B46E`), and dark borders (`#1A1A1A`, `rgba(201,164,92,0.12)`).

---

## 1-Click Deployment to Vercel

Deploying VEIL to Vercel takes under 2 minutes:

1. Click the **Deploy with Vercel** button above or import your repository directly in Vercel.
2. Set the **Root Directory** to `frontend`.
3. In **Environment Variables**, add:
   - `GEMINI_API_KEY`: Your Google Gemini API Key ([Get a free key here](https://aistudio.google.com)).
   - `GEMINI_MODEL`: `gemini-2.5-flash` (optional, defaults to `gemini-2.5-flash`).
4. Click **Deploy**. Your AI PDF Study Assistant is live!

---

## Local Development Setup

### 1. Prerequisites
- Node.js 18+ and npm
- (Optional) Python 3.10+ if running local FastAPI backend
- (Optional) Ollama with `qwen2.5:0.5b` if running offline

### 2. Frontend Setup
```bash
cd frontend
npm install

# Add your Gemini API key in frontend/.env.local:
# GEMINI_API_KEY=your_key_here

npm run dev
```
Open `http://localhost:3000`.

### 3. (Optional) Fullstack Local Python Backend
```bash
cd backend
pip install -r requirements.txt
python run.py
```
FastAPI runs on `http://127.0.0.1:8000`.

---

## Architecture Diagram

```
                               ┌──────────────────────────────────────────────┐
                               │                 USER BROWSER                 │
                               │  Existing UI (Black + #C9A45C Gold Palette)  │
                               └──────────────────────┬───────────────────────┘
                                                      │
                       ┌──────────────────────────────┴──────────────────────────────┐
                       ▼                                                             ▼
         [PRODUCTION: VERCEL DEPLOYMENT]                              [LOCAL: DEVELOPMENT / AIR-GAP]
      Next.js Serverless Route Handlers                             FastAPI Python Backend (run.py)
   (frontend/app/api/... & services/gemini.ts)                  (backend/app/... & llm/provider.py)
                       │                                                             │
        ┌──────────────┴──────────────┐                               ┌──────────────┴──────────────┐
        ▼                             ▼                               ▼                             ▼
Google Gemini Cloud API         Cached Results              Google Gemini Cloud API         Local Ollama
(gemini-2.5-flash)            (Session Storage)             (gemini-2.5-flash)           (qwen2.5:0.5b)
```

---

## License

MIT License. Designed with privacy, precision, and performance.
