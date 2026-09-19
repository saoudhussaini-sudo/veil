import io
import os
import logging
from typing import Tuple

logger = logging.getLogger("veil.ingestion.parser")

def parse_file_content(filename: str, file_bytes: bytes) -> Tuple[str, str]:
    """
    Extracts text content from file bytes based on file extension.
    Returns: (extracted_text, detected_type)
    """
    ext = os.path.splitext(filename)[1].lower()
    
    if ext == ".pdf":
        return parse_pdf(file_bytes), "pdf"
    elif ext in [".md", ".markdown"]:
        return parse_text(file_bytes), "markdown"
    elif ext == ".txt":
        return parse_text(file_bytes), "txt"
    elif ext in [".py", ".ts", ".js", ".jsx", ".tsx", ".json", ".yaml", ".yml", ".toml", ".csv", ".html", ".css", ".sh"]:
        return parse_text(file_bytes), "code"
    else:
        # Fallback to general text attempt
        try:
            return parse_text(file_bytes), "text"
        except Exception as e:
            raise ValueError(f"Unsupported file format '{ext}' for file {filename}: {str(e)}")

def parse_pdf(file_bytes: bytes) -> str:
    """Extracts text from PDF bytes using pypdf."""
    try:
        import pypdf
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        pages_text = []
        for idx, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                pages_text.append(f"--- Page {idx + 1} ---\n{text.strip()}")
        full_text = "\n\n".join(pages_text)
        if not full_text.strip():
            raise ValueError("PDF contains no extractable text (it may be scanned/image-only).")
        return full_text
    except Exception as e:
        logger.error(f"Failed to parse PDF: {e}")
        raise ValueError(f"Failed to parse PDF document: {str(e)}")

def parse_text(file_bytes: bytes) -> str:
    """Decodes text bytes trying utf-8, utf-8-sig, and latin-1."""
    encodings = ["utf-8", "utf-8-sig", "latin-1", "cp1252"]
    for enc in encodings:
        try:
            text = file_bytes.decode(enc)
            return text.replace("\r\n", "\n").replace("\r", "\n")
        except UnicodeDecodeError:
            continue
    raise ValueError("Unable to decode file text with supported character encodings.")
