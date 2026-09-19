# VEIL Architecture Documentation

## System Topology & Flow

```
USER QUESTION
      │
      ▼
┌────────────────────────────────────────┐
│             VEIL INTERFACE             │
│        (Next.js 14 + Tailwind)         │
└───────────────────┬────────────────────┘
                    │ HTTP POST /api/query
                    ▼
┌────────────────────────────────────────┐
│            FASTAPI BACKEND             │
│      (Local High-Performance API)      │
└─────────┬────────────────────┬─────────┘
          │                    │
          ▼                    ▼
┌──────────────────┐  ┌──────────────────┐
│ DOCUMENT INGEST  │  │  LOCAL STORAGE   │
│ - PDF, MD, TXT   │  │  - SQLite db     │
│ - Overlap chunks │  │  - Chunk offsets │
└─────────┬────────┘  └────────┬─────────┘
          │                    │
          ▼                    │
┌──────────────────────────────┴─────────┐
│              MOSS RUNTIME              │
│       Sub-10ms Semantic Retrieval      │
│  - In-process memory execution         │
│  - Hybrid dense vector + BM25 scores   │
│  - Measured time_taken_ms              │
└───────────────────┬────────────────────┘
                    │ Top-K Chunks (Scores > 0.01)
                    ▼
┌────────────────────────────────────────┐
│        CONFIGURABLE LLM SERVICE        │
│   (Gemini, Groq, OpenAI, or Local)     │
│  - Isolated context injection          │
│  - Strict non-hallucination system     │
└───────────────────┬────────────────────┘
                    │ Grounded Answer + Separate LLM Latency
                    ▼
┌────────────────────────────────────────┐
│           CLIENT PRESENTATION          │
│  - Real Moss Latency Indicator (ms)    │
│  - Verified Source Documents           │
│  - Interactive Text Passage Inspector  │
└────────────────────────────────────────┘
```

## Local vs Remote Boundaries

| Component | Execution Environment | Network Exposure |
| :--- | :--- | :--- |
| **File Storage & Ingestion** | Local FastAPI process (`data/files/`, `data/extracted/`, `data/previews/`) | None (preserved on local disk) |
| **Document Parsing & Extraction** | Local memory (pypdf, python-docx, openpyxl, PIL, zipfile) | None |
| **Metadata & Chunk Database** | Local SQLite (`data/veil.db`) | None (local SQLite) |
| **Moss Index Runtime** | Local in-process memory | Sub-10ms queries run locally without network hops on the hot path |
| **Live Web Search & Scraping** | Local DuckDuckGo Lite fetcher + BeautifulSoup | Queries search engine; results are indexed into an ephemeral Moss session |
| **Inference Layer (Local AI)** | Configurable (Ollama, Built-in Analytical Engine, Gemini, Groq) | Zero knowledge base leakage; only minimal retrieved evidence is presented |

## Dual-Source Retrieval Pipeline

1. **Query Intent Classification**: `QueryOrchestrator` determines whether the question should be answered from `LOCAL_FILES`, `WEB_SEARCH`, `HYBRID`, `COMPARISON`, or `FACT_CHECK`.
2. **Persistent Moss Indexing**: User files are stored in `data/files/`, chunked into `data/veil.db`, and indexed in the persistent Moss index `veil-default`.
3. **Ephemeral Web Session Indexing**: When web search is triggered, search result snippets and scraped page passages are indexed into a temporary in-memory Moss session index (`web-session-{uuid}`).
4. **Moss Semantic Retrieval**: Moss runs sub-10ms hybrid BM25 + dense semantic retrieval over both indexes.
5. **Local-First AI Reasoning**: The retrieved evidence is synthesized into structured findings, comparative analyses, or fact-checking claim evaluations with precise citations.

## Physical File Storage Architecture

```
backend/data/
├── files/        # Original unaltered binary and text files
├── extracted/    # Cached extracted text representations
├── previews/     # Pre-rendered structured JSON previews (tables, code, archives)
└── veil.db       # SQLite database storing file metadata, chunks, and query telemetry
```

## Microsecond Latency Measurement
Moss measures latency using high-resolution performance counters (`time_taken_ms`). Unlike traditional remote vector databases that require 80ms–350ms of network latency per search, Moss loads indexes directly into the runtime memory cache, enabling queries in 0.4ms to 5ms. Real measured times are returned in the query telemetry.
