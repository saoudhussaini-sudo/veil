# Backward compatibility wrapper for database.py
from app.storage.database import (
    get_db,
    init_database as init_db,
    save_document,
    save_chunks,
    list_documents,
    get_document,
    delete_document,
    log_access_event,
    get_recent_access_events,
    get_most_accessed_files,
    get_access_over_time,
    get_analytics_summary,
    save_query,
    get_recent_queries,
    update_document_last_accessed
)
