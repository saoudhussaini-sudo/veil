# VEIL System Architecture & API Documentation

## System Topology
```
[User Query]
      │
      ▼
[FastAPI Gateway]
      │
      ├──> [Moss Index Query]  ─── (sub-10ms in-process search)
      │          │
      │          ▼
      │    [Top-K Chunks + Measured Latency]
      │          │
      └──> [Configurable LLM Service]
                 │
                 ▼
          [Grounded Output + Verified Sources]
```

## API Endpoints
- `GET /api/health`: Service health, Moss runtime status, and configured LLM provider.
- `POST /api/knowledge/upload`: Multipart file upload for PDF, MD, TXT, and code files.
- `GET /api/knowledge`: Returns list of uploaded documents and indexing metrics.
- `POST /api/knowledge/index`: Triggers chunking and Moss index creation/reload.
- `POST /api/knowledge/demo`: Instantly populates and indexes the demo knowledge space.
- `POST /api/query`: Submits a natural language question, executes Moss retrieval, and streams/returns grounded response.
- `GET /api/sources/{doc_id}`: Retrieves complete document text with chunk coordinates.
