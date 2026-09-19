import os
import uuid
import json
import time
import re
import sqlite3
import logging
from typing import Dict, Any, List, Optional
from app.config import settings

logger = logging.getLogger("veil.storage.file_storage")

def sanitize_filename(filename: str) -> str:
    """Sanitizes filename removing directory traversal characters."""
    clean = os.path.basename(filename)
    clean = re.sub(r'[\\/*?:"<>|]', "_", clean)
    return clean or "uploaded_file"

def get_db():
    conn = sqlite3.connect(settings.DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_file_database():
    conn = get_db()
    cursor = conn.cursor()

    # Files table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        file_ext TEXT NOT NULL,
        preview_type TEXT NOT NULL,
        storage_path TEXT NOT NULL,
        extracted_path TEXT NOT NULL,
        preview_path TEXT,
        processing_status TEXT NOT NULL DEFAULT 'ready',
        index_status TEXT NOT NULL DEFAULT 'indexed',
        chunk_count INTEGER DEFAULT 0,
        is_searchable INTEGER DEFAULT 1,
        created_at REAL NOT NULL
    );
    """)

    # Chunks table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS file_chunks (
        id TEXT PRIMARY KEY,
        file_id TEXT NOT NULL,
        chunk_index INTEGER NOT NULL,
        text TEXT NOT NULL,
        start_char INTEGER NOT NULL,
        end_char INTEGER NOT NULL,
        metadata_json TEXT,
        created_at REAL NOT NULL,
        FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
    );
    """)

    # Queries telemetry table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS queries (
        id TEXT PRIMARY KEY,
        question TEXT NOT NULL,
        intent TEXT NOT NULL DEFAULT 'GENERAL',
        answer TEXT NOT NULL,
        sources_json TEXT NOT NULL,
        retrieval_telemetry_json TEXT NOT NULL DEFAULT '{}',
        reasoning_telemetry_json TEXT NOT NULL DEFAULT '{}',
        created_at REAL NOT NULL
    );
    """)

    # Check and add columns if upgrading from old schema
    cursor.execute("PRAGMA table_info(queries)")
    existing_cols = [row[1] for row in cursor.fetchall()]
    if "intent" not in existing_cols:
        cursor.execute("ALTER TABLE queries ADD COLUMN intent TEXT DEFAULT 'GENERAL'")
    if "retrieval_telemetry_json" not in existing_cols:
        cursor.execute("ALTER TABLE queries ADD COLUMN retrieval_telemetry_json TEXT DEFAULT '{}'")
    if "reasoning_telemetry_json" not in existing_cols:
        cursor.execute("ALTER TABLE queries ADD COLUMN reasoning_telemetry_json TEXT DEFAULT '{}'")

    conn.commit()
    conn.close()

class FileStorage:
    def __init__(self):
        init_file_database()

    def store_file(
        self,
        filename: str,
        file_bytes: bytes,
        extracted_text: str,
        preview_type: str,
        preview_data: Optional[Dict[str, Any]],
        mime_type: str,
        is_searchable: bool
    ) -> Dict[str, Any]:
        """Saves original file to disk, writes extracted text and preview, updates DB."""
        file_id = str(uuid.uuid4())
        safe_name = sanitize_filename(filename)
        ext = os.path.splitext(safe_name)[1].lower()

        # 1. Save original file
        storage_filename = f"{file_id}_{safe_name}"
        storage_path = os.path.join(settings.FILES_DIR, storage_filename)
        with open(storage_path, "wb") as f:
            f.write(file_bytes)

        # 2. Save extracted text
        extracted_filename = f"{file_id}_extracted.txt"
        extracted_path = os.path.join(settings.EXTRACTED_DIR, extracted_filename)
        with open(extracted_path, "w", encoding="utf-8") as f:
            f.write(extracted_text)

        # 3. Save preview data if available
        preview_path = ""
        if preview_data is not None:
            preview_filename = f"{file_id}_preview.json"
            preview_path = os.path.join(settings.PREVIEWS_DIR, preview_filename)
            with open(preview_path, "w", encoding="utf-8") as f:
                json.dump(preview_data, f, indent=2)

        file_size = len(file_bytes)
        now = time.time()

        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO files (
                id, filename, original_name, mime_type, file_size, file_ext,
                preview_type, storage_path, extracted_path, preview_path,
                processing_status, index_status, is_searchable, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            file_id, safe_name, filename, mime_type, file_size, ext,
            preview_type, storage_path, extracted_path, preview_path,
            "ready", "indexed" if is_searchable else "unindexed", 1 if is_searchable else 0, now
        ))
        conn.commit()
        conn.close()

        return {
            "id": file_id,
            "filename": safe_name,
            "original_name": filename,
            "mime_type": mime_type,
            "file_size": file_size,
            "file_ext": ext,
            "preview_type": preview_type,
            "processing_status": "ready",
            "index_status": "indexed" if is_searchable else "unindexed",
            "is_searchable": is_searchable,
            "created_at": now
        }

    def save_file_chunks(self, file_id: str, chunks: List[Dict[str, Any]]):
        conn = get_db()
        cursor = conn.cursor()
        now = time.time()
        for c in chunks:
            cursor.execute("""
                INSERT OR REPLACE INTO file_chunks (
                    id, file_id, chunk_index, text, start_char, end_char, metadata_json, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                c["id"], file_id, c["chunk_index"], c["text"],
                c.get("start_char", 0), c.get("end_char", len(c["text"])),
                json.dumps(c.get("metadata", {})), now
            ))
        cursor.execute("UPDATE files SET chunk_count = ? WHERE id = ?", (len(chunks), file_id))
        conn.commit()
        conn.close()

    def list_files(self) -> List[Dict[str, Any]]:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM files ORDER BY created_at DESC")
        rows = cursor.fetchall()
        files = [dict(r) for r in rows]
        conn.close()
        return files

    def get_file(self, file_id: str) -> Optional[Dict[str, Any]]:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM files WHERE id = ?", (file_id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None

    def get_file_preview(self, file_id: str) -> Optional[Dict[str, Any]]:
        file_info = self.get_file(file_id)
        if not file_info:
            return None

        preview_data = {}
        if file_info["preview_path"] and os.path.exists(file_info["preview_path"]):
            with open(file_info["preview_path"], "r", encoding="utf-8") as f:
                preview_data = json.load(f)

        extracted_text = ""
        if file_info["extracted_path"] and os.path.exists(file_info["extracted_path"]):
            with open(file_info["extracted_path"], "r", encoding="utf-8") as f:
                extracted_text = f.read()

        return {
            "file": file_info,
            "preview_type": file_info["preview_type"],
            "preview_data": preview_data,
            "extracted_text_preview": extracted_text[:4000]
        }

    def delete_file(self, file_id: str) -> bool:
        file_info = self.get_file(file_id)
        if not file_info:
            return False

        # Remove physical files
        for p in [file_info["storage_path"], file_info["extracted_path"], file_info["preview_path"]]:
            if p and os.path.exists(p):
                try:
                    os.remove(p)
                except Exception as e:
                    logger.warning(f"Could not remove file {p}: {e}")

        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM file_chunks WHERE file_id = ?", (file_id,))
        cursor.execute("DELETE FROM files WHERE id = ?", (file_id,))
        conn.commit()
        conn.close()
        return True

    def get_all_chunks(self) -> List[Dict[str, Any]]:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM file_chunks ORDER BY file_id, chunk_index ASC")
        rows = cursor.fetchall()
        chunks = []
        for r in rows:
            d = dict(r)
            if d.get("metadata_json"):
                d["metadata"] = json.loads(d["metadata_json"])
            chunks.append(d)
        conn.close()
        return chunks

    def get_file_chunks(self, file_id: str) -> List[Dict[str, Any]]:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM file_chunks WHERE file_id = ? ORDER BY chunk_index ASC", (file_id,))
        rows = cursor.fetchall()
        chunks = []
        for r in rows:
            d = dict(r)
            if d.get("metadata_json"):
                d["metadata"] = json.loads(d["metadata_json"])
            chunks.append(d)
        conn.close()
        return chunks

    def update_file_status(self, file_id: str, processing_status: str, index_status: str):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("UPDATE files SET processing_status = ?, index_status = ? WHERE id = ?", (processing_status, index_status, file_id))
        conn.commit()
        conn.close()

    def save_query_telemetry(self, query_id: str, question: str, intent: str, answer: str, sources: list, retrieval: dict, reasoning: dict):
        conn = get_db()
        cursor = conn.cursor()
        retrieval_ms = float(retrieval.get("latencyMs", 0.0))
        reasoning_ms = float(reasoning.get("latencyMs", 0.0))
        cursor.execute("""
            INSERT INTO queries (
                id, question, intent, answer, sources_json,
                retrieval_telemetry_json, reasoning_telemetry_json,
                retrieval_time_ms, llm_time_ms, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            query_id, question, intent, answer, json.dumps(sources),
            json.dumps(retrieval), json.dumps(reasoning),
            retrieval_ms, reasoning_ms, time.time()
        ))
        conn.commit()
        conn.close()

    def get_recent_queries(self, limit: int = 8) -> List[Dict[str, Any]]:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM queries ORDER BY created_at DESC LIMIT ?", (limit,))
        rows = cursor.fetchall()
        items = []
        for r in rows:
            d = dict(r)
            d["sources"] = json.loads(d["sources_json"])
            d["retrieval"] = json.loads(d["retrieval_telemetry_json"])
            d["reasoning"] = json.loads(d["reasoning_telemetry_json"])
            items.append(d)
        conn.close()
        return items

file_storage = FileStorage()
