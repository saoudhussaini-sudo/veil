import re
import uuid
from typing import List, Dict, Any, Optional

def chunk_text_content(
    text: str,
    doc_id: str,
    filename: str,
    page_num: int,
    start_chunk_idx: int,
    chunk_size: int = 700,
    chunk_overlap: int = 100
) -> List[Dict[str, Any]]:
    """Helper that splits a single page/block of text into chunks."""
    text = text.strip()
    if not text:
        return []

    if len(text) <= chunk_size:
        chunk_id = f"{doc_id}_p{page_num}_c{start_chunk_idx}"
        return [{
            "id": chunk_id,
            "doc_id": doc_id,
            "chunk_index": start_chunk_idx,
            "text": text,
            "start_char": 0,
            "end_char": len(text),
            "metadata": {
                "document_id": doc_id,
                "filename": filename,
                "page": page_num,
                "chunk": start_chunk_idx
            }
        }]

    paragraphs = re.split(r'\n\s*\n', text)
    chunks = []
    current_chunk = []
    current_len = 0
    start_pos = 0
    chunk_idx = start_chunk_idx

    for para in paragraphs:
        para = para.strip()
        if not para:
            continue

        para_len = len(para)
        if para_len > chunk_size:
            sentences = re.split(r'(?<=[.!?])\s+', para)
            for sentence in sentences:
                sentence = sentence.strip()
                if not sentence:
                    continue
                s_len = len(sentence)
                if current_len + s_len > chunk_size and current_chunk:
                    chunk_text = " ".join(current_chunk)
                    end_pos = start_pos + len(chunk_text)
                    chunk_id = f"{doc_id}_p{page_num}_c{chunk_idx}"
                    chunks.append({
                        "id": chunk_id,
                        "doc_id": doc_id,
                        "chunk_index": chunk_idx,
                        "text": chunk_text,
                        "start_char": start_pos,
                        "end_char": end_pos,
                        "metadata": {
                            "document_id": doc_id,
                            "filename": filename,
                            "page": page_num,
                            "chunk": chunk_idx
                        }
                    })
                    chunk_idx += 1

                    overlap_chars = 0
                    new_current = []
                    for item in reversed(current_chunk):
                        if overlap_chars + len(item) <= chunk_overlap:
                            new_current.insert(0, item)
                            overlap_chars += len(item)
                        else:
                            break
                    current_chunk = new_current
                    current_len = sum(len(c) for c in current_chunk)
                    start_pos = end_pos - current_len

                current_chunk.append(sentence)
                current_len += s_len + 1
        else:
            if current_len + para_len > chunk_size and current_chunk:
                chunk_text = "\n\n".join(current_chunk)
                end_pos = start_pos + len(chunk_text)
                chunk_id = f"{doc_id}_p{page_num}_c{chunk_idx}"
                chunks.append({
                    "id": chunk_id,
                    "doc_id": doc_id,
                    "chunk_index": chunk_idx,
                    "text": chunk_text,
                    "start_char": start_pos,
                    "end_char": end_pos,
                    "metadata": {
                        "document_id": doc_id,
                        "filename": filename,
                        "page": page_num,
                        "chunk": chunk_idx
                    }
                })
                chunk_idx += 1

                current_chunk = [current_chunk[-1]] if current_chunk else []
                current_len = len(current_chunk[0]) if current_chunk else 0
                start_pos = end_pos - current_len

            current_chunk.append(para)
            current_len += para_len + 2

    if current_chunk:
        chunk_text = "\n\n".join(current_chunk)
        end_pos = start_pos + len(chunk_text)
        chunk_id = f"{doc_id}_p{page_num}_c{chunk_idx}"
        chunks.append({
            "id": chunk_id,
            "doc_id": doc_id,
            "chunk_index": chunk_idx,
            "text": chunk_text,
            "start_char": start_pos,
            "end_char": end_pos,
            "metadata": {
                "document_id": doc_id,
                "filename": filename,
                "page": page_num,
                "chunk": chunk_idx
            }
        })

    return chunks

def chunk_document(
    doc_id: str,
    filename: str,
    text: str,
    pages: Optional[List[Dict[str, Any]]] = None,
    chunk_size: int = 700,
    chunk_overlap: int = 100
) -> List[Dict[str, Any]]:
    """
    Chunks document text preserving page numbers and paragraph/sentence boundaries.
    Each chunk retains document_id, filename, page, and chunk index.
    """
    if pages and len(pages) > 0:
        all_chunks = []
        global_chunk_idx = 0
        for p in pages:
            p_num = p.get("page", 1)
            p_text = p.get("text", "")
            if not p_text.strip():
                continue
            page_chunks = chunk_text_content(
                text=p_text,
                doc_id=doc_id,
                filename=filename,
                page_num=p_num,
                start_chunk_idx=global_chunk_idx,
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap
            )
            all_chunks.extend(page_chunks)
            global_chunk_idx += len(page_chunks)
        return all_chunks

    # Non-paged documents (default page=1)
    return chunk_text_content(
        text=text,
        doc_id=doc_id,
        filename=filename,
        page_num=1,
        start_chunk_idx=0,
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap
    )
