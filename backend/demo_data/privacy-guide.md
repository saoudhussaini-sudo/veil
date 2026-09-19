# VEIL Privacy & Local-First Retrieval Architecture

## Overview
VEIL is built upon the architectural thesis of the "Small Cloud" and local-first AI. Rather than transferring gigabytes of raw user documentation to remote cloud providers, VEIL operates by decoupling the retrieval layer from the inference layer.

## The Retrieval Boundary
1. **Local Ingestion**: When documents (PDF, Markdown, code, plain text) are added to VEIL, text extraction and semantic chunking occur on the local machine.
2. **Sub-10ms Retrieval with Moss**: Searching across the index is performed locally using the Moss runtime. Only the top-k highest scoring semantic passages are retrieved.
3. **Context Minimization**: Only the specific relevant passages (often less than 1,000 words total) are provided to the language model.
4. **Data Leakage Mitigation**: The bulk of private notes, proprietary algorithms, and sensitive internal records never transit over the network or enter model context windows unnecessarily.

## Real Latency vs Synthesized Metrics
Unlike legacy vector databases that require 80ms–350ms network round-trips to remote cloud clusters, Moss compiles semantic indexes directly into an in-process runtime capable of 2ms to 8ms retrieval operations. VEIL reports genuine microsecond-calibrated latency measured during every query.
