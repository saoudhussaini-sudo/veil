import pytest
from app.ingestion.parser import parse_file_content
from app.ingestion.chunker import chunk_document

def test_markdown_parsing():
    content = b"# Privacy Rules\nVEIL keeps retrieval local and fast."
    text, file_type = parse_file_content("test.md", content)
    assert file_type == "markdown"
    assert "VEIL keeps retrieval" in text

def test_chunking_logic():
    text = "First paragraph about local AI.\n\nSecond paragraph discussing sub-10ms Moss retrieval.\n\nThird paragraph on grounded answers."
    chunks = chunk_document(doc_id="doc1", filename="test.md", text=text, chunk_size=50)
    assert len(chunks) >= 3
    assert all("doc_id" in c for c in chunks)
    assert all("start_char" in c for c in chunks)
