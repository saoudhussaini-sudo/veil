# VEIL Product Specifications & Design Philosophy

## Product Identity
- **Name**: VEIL
- **Core Tagline**: "AI for the knowledge you keep close."
- **Aesthetic**: Premium editorial, deep black background (`#050505`), warm gold accents (`#C9A45C`), generous whitespace, disciplined typography.

## Product Pillars
1. **Pillar 01 — Your Knowledge**: Unified ingestion of personal documents, engineering notes, PDF reports, and codebase documentation into isolated local knowledge spaces.
2. **Pillar 02 — Moss Retrieval**: Instant semantic search running in-memory on the hot path. Sub-10ms retrieval latency without vector database infrastructure complexity.
3. **Pillar 03 — Grounded AI**: The configured LLM receives only verified, relevant context chunks. If the context does not contain the answer, VEIL explicitly states that the knowledge base lacks sufficient data rather than hallucinating.

## Supported Document Formats
- Markdown (`.md`)
- Plain text (`.txt`)
- Portable Document Format (`.pdf`)
- Source code files (`.py`, `.ts`, `.js`, `.json`, `.yaml`)
