# VEIL — Privacy-First AI Knowledge Workspace

> *"AI for the knowledge you keep close."*

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsaoudhussaini-sudo%2Fveil&root-directory=frontend)

VEIL is a privacy-first AI workspace that allows users to interact with their own local knowledge through natural language, using **Moss** as the dedicated sub-10ms semantic retrieval layer and a configurable LLM provider for context-grounded responses.

---

## Key Features

1. **Dual-Source Intelligence**: Reasons seamlessly across **both** the live Internet and user files.
2. **Zero Upload Requirement**: Ask current questions right away without uploading files (e.g., "What is the latest version of React and what changed?").
3. **Intent-Aware Routing**: Intelligently classifies questions into `LOCAL_FILES`, `WEB_SEARCH`, `HYBRID`, `COMPARISON`, and `FACT_CHECK`.
4. **Sub-10ms Moss Retrieval**: Uses Moss for low-latency semantic indexing and retrieval across both persistent local documents and ephemeral web session content.
5. **Universal File Ingestion & In-Browser Viewers**: Rich viewing and extraction for PDFs, Word documents (.docx), Spreadsheets (.xlsx, .csv), JSON, Code (.py, .ts, .go, .rs, etc.), Images (.png, .jpg, .svg), and Archives (.zip).
6. **Physical Raw File Preservation**: Original user files are stored safely in `data/files/` alongside structured previews and extracted text representations.
7. **Local-First AI Reasoning**: Grounded synthesis supporting local models (Ollama, local analytical engine) as well as Gemini and Groq.
8. **Real Measured Telemetry**: Actual measured latency for web search, Moss retrieval, and LLM reasoning is transparently reported.
9. **Strict Reference Visual Identity**: Deep black background (`#050505`), warm gold accents (`#C9A45C`), refined borders (`#262626`), and the exact 3-pillar editorial card layout.

---

## System Architecture

```
USER QUERY
    ↓
QUERY INTENT ROUTING (Local / Web / Hybrid / Comparison / Fact-Check)
    │
    ├─────────────────────────────┬─────────────────────────────┐
    ▼                             ▼                             ▼
LOCAL FILES (SQLite)      LIVE WEB SEARCH (DDG)         DUAL-SOURCE
    ↓                             ↓                             ↓
EXTRACT & CHUNK           FETCH & SCRAPE PASSAGES       CROSS-REFERENCE
    │                             │                             │
    └──────────────┬──────────────┘                             │
                   ▼                                            │
         MOSS RETRIEVAL RUNTIME (Sub-10ms)                      │
                   ↓                                            │
         TOP-K RELEVANT EVIDENCE                                │
                   ↓                                            │
         LOCAL-FIRST AI REASONING (Ollama / Local / Gemini) ◄───┘
                   ↓
         GROUNDED CITATIONS + SOURCES + REAL MEASURED TELEMETRY
```

---

## Getting Started

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt

# Run the backend server
python run.py
```
The FastAPI backend runs at `http://127.0.0.1:8000`. API documentation is available at `http://127.0.0.1:8000/docs`.

### 3. Frontend Setup
```bash
cd frontend
npm install

# Run the development server
npm run dev
```
The Next.js application runs at `http://localhost:3000`.

---

## Environment Configuration (`.env`)

Create a `.env` file in the root or `backend/` directory:

```env
# Moss Credentials (Optional - runs in high-performance local mode if omitted)
MOSS_PROJECT_ID=
MOSS_PROJECT_KEY=
MOSS_DEFAULT_INDEX=veil-default

# LLM Configuration
# Options: gemini, groq, openai, anthropic, local
LLM_PROVIDER=gemini
LLM_API_KEY=your_api_key_here
LLM_MODEL=gemini-1.5-flash

# Backend Settings
PORT=8000
HOST=127.0.0.1
DEBUG=true
DATA_DIR=./data
```

---

## Privacy Model

VEIL adheres strictly to the principle of **context minimization**:
- **Local Ingestion**: Text extraction, parsing, and chunking run entirely on your local machine.
- **In-Process Moss Queries**: After the index is loaded into the Moss runtime, queries execute in-memory with sub-10ms response times without remote database lookups.
- **Minimal Context Injection**: Only the top-k highest-scoring passage snippets (typically under 800 words) are passed to the language model.
- **Local Metadata**: Documents and query history are preserved in a local SQLite database (`data/veil.db`).

---

## Running the Automated Test Suite

```bash
cd backend
python -m pytest tests -v
```
All tests verify file parsing, chunking, Moss index creation/loading, latency capture, and API endpoints.
