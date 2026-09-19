# Research Notes: Sub-10ms Semantic Search & Hybrid Scoring

## Abstract
Traditional retrieval-augmented generation (RAG) suffers from cumulative latency bottlenecks. Typical RAG pipelines incur 150ms–400ms for network embedding calls, 80ms–200ms for vector DB searches, and additional overhead before token generation begins.

## Hybrid Retrieval Dynamics
Moss combines dense vector representations with BM25 lexical term matching:
- **Lexical Matching (BM25)**: Exact keyword matches, identifier lookups (e.g., function names, document titles, numerical constants) are preserved with high precision.
- **Dense Semantic Retrieval**: Synonyms and conceptual parallels are retrieved even when exact terminology differs.
- **Dynamic Blending Factor (\(\alpha\))**: Enables balancing between semantic intent (\(\alpha \to 1.0\)) and keyword accuracy (\(\alpha \to 0.0\)).

## Experimental Observations
In benchmarks on knowledge spaces containing 500 to 5,000 document chunks, in-process retrieval completed in 3.4ms to 7.8ms on standard consumer hardware. This demonstrates that eliminating external database hops provides a 10x to 30x retrieval speedup.
