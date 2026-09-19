import os
import uuid
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from app.config import settings
from app.storage import db
from app.ingestion.parser import parse_file_content
from app.ingestion.chunker import chunk_document
from app.moss.client import moss_client, MossDocItem

logger = logging.getLogger("veil.services.knowledge")

class KnowledgeService:
    def __init__(self):
        self.index_name = settings.MOSS_DEFAULT_INDEX

    async def ingest_file(self, filename: str, file_bytes: bytes) -> Dict[str, Any]:
        """
        Processes an uploaded file, extracts text, chunks it, saves metadata,
        and adds it to the Moss index.
        """
        # 1. Parse text and detect format
        extracted_text, file_type = parse_file_content(filename, file_bytes)
        file_size = len(file_bytes)
        doc_id = str(uuid.uuid4())

        # 2. Chunk text
        chunks = chunk_document(
            doc_id=doc_id,
            filename=filename,
            text=extracted_text,
            chunk_size=700,
            chunk_overlap=100
        )

        # 3. Store document & chunks in SQLite
        db.save_document(
            doc_id=doc_id,
            filename=filename,
            file_type=file_type,
            file_size=file_size,
            content=extracted_text,
            status="indexed",
            chunk_count=len(chunks)
        )
        db.save_chunks(chunks)

        # 4. Update Moss index with all chunks across all documents
        await self.sync_all_chunks_to_moss()

        return {
            "id": doc_id,
            "filename": filename,
            "file_type": file_type,
            "file_size": file_size,
            "chunk_count": len(chunks),
            "status": "indexed"
        }

    async def sync_all_chunks_to_moss(self) -> Dict[str, Any]:
        """Re-indexes all active chunks into Moss and preloads the index."""
        all_chunks = db.get_all_chunks()
        moss_items = [
            MossDocItem(
                id=c["id"],
                text=c["text"],
                metadata=c.get("metadata", {})
            )
            for c in all_chunks
        ]
        res = await moss_client.create_index(self.index_name, moss_items)
        await moss_client.load_index(self.index_name)
        return res

    async def load_demo_knowledge(self) -> Dict[str, Any]:
        """Loads and indexes the bundled neutral demo documents."""
        demo_dir = Path(__file__).resolve().parent.parent.parent / "demo_data"
        if not demo_dir.exists():
            demo_dir = Path("demo_data")

        loaded_files = []
        if demo_dir.exists():
            for filepath in demo_dir.glob("*.md"):
                filename = filepath.name
                with open(filepath, "rb") as f:
                    file_bytes = f.read()
                doc_info = await self.ingest_file(filename, file_bytes)
                loaded_files.append(doc_info)

        return {
            "status": "SUCCESS",
            "message": f"Successfully loaded {len(loaded_files)} demo documents into VEIL.",
            "documents": loaded_files
        }

    def list_knowledge(self) -> Dict[str, Any]:
        docs = db.list_documents()
        counts = db.count_knowledge()
        return {
            "space_name": self.index_name,
            "total_documents": counts["document_count"],
            "total_chunks": counts["chunk_count"],
            "documents": docs
        }

    def get_document(self, doc_id: str) -> Optional[Dict[str, Any]]:
        return db.get_document_by_id(doc_id)

    async def remove_document(self, doc_id: str) -> bool:
        db.delete_document(doc_id)
        await self.sync_all_chunks_to_moss()
        return True

knowledge_service = KnowledgeService()
