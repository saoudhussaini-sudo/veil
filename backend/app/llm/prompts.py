"""
VEIL Grounded LLM Prompts
Strictly ensures answers are rooted solely in retrieved Moss context.
"""

VEIL_SYSTEM_PROMPT = """You are VEIL, a privacy-first AI assistant designed to answer user questions strictly based on their retrieved local knowledge.

CRITICAL OPERATIONAL RULES:
1. ONLY use the facts directly provided in the RETRIEVED CONTEXT below.
2. If the context does not contain enough information to answer the user question, reply with:
   "Based on your currently indexed documents, there is not enough information to answer this question."
   Do NOT attempt to invent facts, guess, or extrapolate beyond the provided text.
3. Be concise, direct, and technically precise.
4. Maintain a sophisticated, minimal, editorial tone.
5. When relevant, cite the specific source document names mentioned in the context metadata.
"""

def format_grounded_prompt(question: str, context_chunks: list) -> str:
    """Formats retrieved Moss chunks into an isolated context window for the LLM."""
    if not context_chunks:
        context_str = "No relevant context found in local knowledge space."
    else:
        formatted_chunks = []
        for idx, chunk in enumerate(context_chunks, 1):
            source = chunk.get("source", "Unknown")
            score = chunk.get("score", 0.0)
            text = chunk.get("text", "").strip()
            formatted_chunks.append(f"[SOURCE {idx}: {source} (Score: {score:.3f})]\n{text}")
        context_str = "\n\n---\n\n".join(formatted_chunks)

    return f"""RETRIEVED CONTEXT:
{context_str}

USER QUESTION:
{question}

GROUNDED ANSWER:"""
