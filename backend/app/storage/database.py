import sqlite3
import json
import os
import time
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from app.config import settings

def get_db():
    conn = sqlite3.connect(settings.DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_database():
    conn = get_db()
    cursor = conn.cursor()

    # Access Events table (Section 28-30: DATA ACCESSED OFFLINE)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS access_events (
        id TEXT PRIMARY KEY,
        timestamp REAL NOT NULL,
        file_id TEXT NOT NULL,
        action TEXT NOT NULL,
        query_id TEXT,
        chunks_retrieved INTEGER DEFAULT 0
    );
    """)

    # Queries table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS queries (
        id TEXT PRIMARY KEY,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        routing_mode TEXT DEFAULT 'DIRECT',
        moss_used INTEGER DEFAULT 0,
        moss_passages INTEGER DEFAULT 0,
        moss_latency_ms REAL,
        ai_provider TEXT DEFAULT 'ollama',
        ai_model TEXT DEFAULT 'llama3',
        ai_latency_ms REAL DEFAULT 0.0,
        sources_json TEXT,
        created_at REAL NOT NULL,
        intent TEXT,
        retrieval_telemetry_json TEXT,
        reasoning_telemetry_json TEXT,
        retrieval_time_ms REAL DEFAULT 0.0,
        llm_time_ms REAL DEFAULT 0.0
    );
    """)

    # Migrate columns if needed
    try:
        cursor.execute("ALTER TABLE files ADD COLUMN last_accessed_at REAL")
    except Exception:
        pass

    try:
        cursor.execute("ALTER TABLE files ADD COLUMN updated_at REAL")
    except Exception:
        pass

    try:
        cursor.execute("ALTER TABLE queries ADD COLUMN routing_mode TEXT DEFAULT 'DIRECT'")
    except Exception:
        pass

    try:
        cursor.execute("ALTER TABLE queries ADD COLUMN moss_used INTEGER DEFAULT 0")
    except Exception:
        pass

    try:
        cursor.execute("ALTER TABLE queries ADD COLUMN moss_passages INTEGER DEFAULT 0")
    except Exception:
        pass

    try:
        cursor.execute("ALTER TABLE queries ADD COLUMN moss_latency_ms REAL")
    except Exception:
        pass

    try:
        cursor.execute("ALTER TABLE queries ADD COLUMN ai_provider TEXT DEFAULT 'ollama'")
    except Exception:
        pass

    try:
        cursor.execute("ALTER TABLE queries ADD COLUMN ai_model TEXT DEFAULT 'llama3'")
    except Exception:
        pass

    try:
        cursor.execute("ALTER TABLE queries ADD COLUMN ai_latency_ms REAL DEFAULT 0.0")
    except Exception:
        pass

    conn.commit()
    conn.close()

# Document Operations
def list_documents() -> List[Dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, filename, original_name, file_ext as file_type, file_size, processing_status as status,
               chunk_count, created_at, COALESCE(last_accessed_at, created_at) as last_accessed_at
        FROM files
        ORDER BY created_at DESC
    """)
    rows = cursor.fetchall()
    docs = [dict(row) for row in rows]
    conn.close()
    return docs

def get_document(doc_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM files WHERE id = ?", (doc_id,))
    row = cursor.fetchone()
    if not row:
        cursor.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
        row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def update_document_last_accessed(doc_id: str):
    conn = get_db()
    cursor = conn.cursor()
    now = time.time()
    cursor.execute("UPDATE files SET last_accessed_at = ?, updated_at = ? WHERE id = ?", (now, now, doc_id))
    conn.commit()
    conn.close()

def delete_document(doc_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM access_events WHERE file_id = ?", (doc_id,))
    cursor.execute("DELETE FROM file_chunks WHERE file_id = ?", (doc_id,))
    cursor.execute("DELETE FROM files WHERE id = ?", (doc_id,))
    conn.commit()
    conn.close()

# Access Event Logging Operations (Section 29-30)
def log_access_event(
    file_id: str,
    action: str,
    query_id: Optional[str] = None,
    chunks_retrieved: int = 0
) -> str:
    """
    Logs an offline file access event.
    Actions: VIEWED, RETRIEVED, ANALYZED, COMPARED, INDEXED
    Never logs file contents, only metadata.
    """
    event_id = str(uuid.uuid4())
    now = time.time()
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO access_events (id, timestamp, file_id, action, query_id, chunks_retrieved)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (event_id, now, file_id, action.upper(), query_id, chunks_retrieved))
    cursor.execute("UPDATE files SET last_accessed_at = ? WHERE id = ?", (now, file_id))
    conn.commit()
    conn.close()
    return event_id

def get_recent_access_events(limit: int = 20) -> List[Dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT e.id as eventId, e.timestamp, e.file_id as fileId, e.action, e.query_id as queryId, e.chunks_retrieved as chunksRetrieved,
               COALESCE(f.original_name, f.filename, 'Unknown File') as filename
        FROM access_events e
        LEFT JOIN files f ON e.file_id = f.id
        ORDER BY e.timestamp DESC
        LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    now = time.time()
    events = []
    for r in rows:
        d = dict(r)
        elapsed = max(0, int(now - d["timestamp"]))
        if elapsed < 60:
            time_ago = f"{elapsed}s ago"
        elif elapsed < 3600:
            time_ago = f"{elapsed // 60}m ago"
        elif elapsed < 86400:
            time_ago = f"{elapsed // 3600}h ago"
        else:
            time_ago = f"{elapsed // 86400}d ago"
        d["timeAgo"] = time_ago
        events.append(d)
    conn.close()
    return events

def get_most_accessed_files(limit: int = 10) -> List[Dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT e.file_id as fileId,
               COALESCE(f.original_name, f.filename, 'Unknown File') as filename,
               COUNT(e.id) as accessCount,
               MAX(e.action) as lastAction,
               MAX(e.timestamp) as lastAccessedAt
        FROM access_events e
        LEFT JOIN files f ON e.file_id = f.id
        WHERE e.action != 'INDEXED'
        GROUP BY e.file_id
        ORDER BY accessCount DESC
        LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_access_over_time(days: int = 7) -> List[Dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    start_time = time.time() - (days * 86400)
    cursor.execute("""
        SELECT timestamp FROM access_events
        WHERE timestamp >= ? AND action != 'INDEXED'
        ORDER BY timestamp ASC
    """, (start_time,))
    rows = cursor.fetchall()
    conn.close()

    # Bucket by day name (e.g. Mon, Tue, Wed)
    day_counts: Dict[str, int] = {}
    for i in range(days - 1, -1, -1):
        d_date = datetime.now() - timedelta(days=i)
        day_label = d_date.strftime("%a")
        day_counts[day_label] = 0

    for r in rows:
        ts = r["timestamp"]
        day_label = datetime.fromtimestamp(ts).strftime("%a")
        if day_label in day_counts:
            day_counts[day_label] += 1
        else:
            day_counts[day_label] = 1

    return [{"date": k, "count": v} for k, v in day_counts.items()]

def get_analytics_summary() -> Dict[str, Any]:
    conn = get_db()
    cursor = conn.cursor()

    # Distinct files accessed (excluding INDEXED)
    cursor.execute("SELECT COUNT(DISTINCT file_id) FROM access_events WHERE action != 'INDEXED'")
    files_accessed = cursor.fetchone()[0] or 0

    # Offline queries count
    cursor.execute("SELECT COUNT(*) FROM queries")
    offline_queries = cursor.fetchone()[0] or 0

    # Moss retrievals count
    cursor.execute("SELECT COUNT(*) FROM access_events WHERE action = 'RETRIEVED'")
    moss_retrievals = cursor.fetchone()[0] or 0

    # Local analyses count (ANALYZED or COMPARED)
    cursor.execute("SELECT COUNT(*) FROM access_events WHERE action IN ('ANALYZED', 'COMPARED')")
    local_analyses = cursor.fetchone()[0] or 0

    # Total files & chunks
    cursor.execute("SELECT COUNT(*) FROM files")
    total_files = cursor.fetchone()[0] or 0
    cursor.execute("SELECT COUNT(*) FROM file_chunks")
    total_chunks = cursor.fetchone()[0] or 0

    conn.close()

    return {
        "files_accessed": files_accessed,
        "offline_queries": offline_queries,
        "moss_retrievals": moss_retrievals,
        "local_analyses": local_analyses,
        "total_files": total_files,
        "total_chunks": total_chunks,
        "recent_access": get_recent_access_events(15),
        "most_accessed": get_most_accessed_files(10),
        "access_over_time": get_access_over_time(7)
    }

# Query Logging
def save_query(
    query_id: str,
    question: str,
    answer: str,
    routing_mode: str,
    moss_used: bool,
    moss_passages: int,
    moss_latency_ms: Optional[float],
    ai_provider: str,
    ai_model: str,
    ai_latency_ms: float,
    sources: List[Dict[str, Any]]
):
    conn = get_db()
    cursor = conn.cursor()
    now = time.time()
    cursor.execute("""
        INSERT INTO queries (
            id, question, answer, routing_mode, moss_used, moss_passages, moss_latency_ms,
            ai_provider, ai_model, ai_latency_ms, sources_json, created_at,
            retrieval_time_ms, llm_time_ms
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        query_id,
        question,
        answer,
        routing_mode,
        1 if moss_used else 0,
        moss_passages,
        moss_latency_ms,
        ai_provider,
        ai_model,
        ai_latency_ms,
        json.dumps(sources),
        now,
        moss_latency_ms or 0.0,
        ai_latency_ms
    ))
    conn.commit()
    conn.close()

def get_recent_queries(limit: int = 15) -> List[Dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM queries ORDER BY created_at DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]
