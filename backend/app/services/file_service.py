import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from app.storage.file_storage import file_storage
from app.storage.database import log_access_event, update_document_last_accessed
from app.services.extraction_service import extract_and_preview_file
from app.ingestion.chunker import chunk_document
from app.services.moss_service import moss_service
from app.config import settings

logger = logging.getLogger("veil.services.file_service")

class FileService:
    def __init__(self):
        self.index_name = settings.MOSS_INDEX_NAME

    async def ingest_file(self, filename: str, file_bytes: bytes) -> Dict[str, Any]:
        """
        Processes an uploaded file:
        1. Extracts text & generates preview data (preserving 1-indexed pages for PDFs)
        2. Detects scanned PDFs requiring OCR
        3. Preserves original file, extracted text, and preview in storage
        4. Chunks text page-by-page preserving document_id, filename, page, and chunk index
        5. Indexes all chunks into Moss
        6. Logs INDEXED event in SQLite
        """
        # 1. Extraction & Preview
        extract_result = extract_and_preview_file(filename, file_bytes)

        # 2. Store original, extracted, and preview
        file_info = file_storage.store_file(
            filename=filename,
            file_bytes=file_bytes,
            extracted_text=extract_result["extracted_text"],
            preview_type=extract_result["preview_type"],
            preview_data=extract_result["preview_data"],
            mime_type=extract_result["mime_type"],
            is_searchable=extract_result["is_searchable"]
        )

        file_id = file_info["id"]

        # PART 7: Handle scanned PDF
        if extract_result.get("is_scanned"):
            file_storage.update_file_status(
                file_id,
                processing_status="Scanned PDF detected — text extraction requires OCR.",
                index_status="scanned"
            )
            file_info["processing_status"] = "Scanned PDF detected — text extraction requires OCR."
            file_info["index_status"] = "scanned"
            file_info["document_id"] = file_id
            file_info["type"] = file_info["file_ext"].lstrip(".")
            file_info["status"] = "scanned"
            file_info["pages"] = extract_result.get("preview_data", {}).get("page_count", 0)
            file_info["characters_extracted"] = 0
            file_info["chunks"] = 0
            return file_info

        # 3. Chunk if searchable
        chunk_count = 0
        if extract_result["is_searchable"] and extract_result["extracted_text"].strip():
            chunks = chunk_document(
                doc_id=file_id,
                filename=filename,
                text=extract_result["extracted_text"],
                pages=extract_result.get("pages"),
                chunk_size=700,
                chunk_overlap=100
            )
            file_storage.save_file_chunks(file_id, chunks)
            chunk_count = len(chunks)

            # 4. Sync all chunks to Moss
            await self.sync_all_to_moss()

        # 5. Log INDEXED event
        log_access_event(
            file_id=file_id,
            action="INDEXED",
            chunks_retrieved=chunk_count
        )

        file_info["document_id"] = file_id
        file_info["type"] = file_info["file_ext"].lstrip(".")
        file_info["pages"] = extract_result.get("preview_data", {}).get("page_count", 1) if extract_result.get("preview_data") else 1
        file_info["characters_extracted"] = extract_result.get("char_count", len(extract_result["extracted_text"]))
        file_info["chunks"] = chunk_count
        file_info["status"] = "indexed" if chunk_count > 0 else "uploaded"

        return file_info

    async def sync_all_to_moss(self):
        """Indexes all active file chunks into the persistent Moss index."""
        all_chunks = file_storage.get_all_chunks()
        docs = []
        for c in all_chunks:
            meta = c.get("metadata", {})
            fname = meta.get("filename") or c.get("filename", "")
            fid = meta.get("document_id") or c.get("file_id") or c.get("doc_id", "")
            page = meta.get("page")
            chunk_idx = meta.get("chunk") or c.get("chunk_index", 0)

            docs.append({
                "id": c["id"],
                "text": c.get("text") or c.get("chunk_text", ""),
                "metadata": {
                    "document_id": fid,
                    "fileId": fid,
                    "filename": fname,
                    "page": page,
                    "chunk": chunk_idx,
                    "chunkIndex": chunk_idx,
                    "sourceType": "local_file"
                }
            })
        if docs:
            await moss_service.replace_docs(docs)
            logger.info(f"Synced {len(docs)} file chunks to Moss index '{self.index_name}'")
        else:
            await moss_service.clear_index()

    async def delete_file(self, file_id: str) -> bool:
        success = file_storage.delete_file(file_id)
        if success:
            await self.sync_all_to_moss()
        return success

    async def load_demo_files(self) -> Dict[str, Any]:
        """Loads and indexes bundled demo documents."""
        demo_dir = Path(settings.BASE_DIR) / "demo_data"
        loaded = []
        if demo_dir.exists():
            for fpath in demo_dir.glob("*.md"):
                with open(fpath, "rb") as f:
                    data = f.read()
                info = await self.ingest_file(fpath.name, data)
                loaded.append(info)
        return {
            "status": "SUCCESS",
            "message": f"Loaded and indexed {len(loaded)} demo files into VEIL.",
            "files": loaded
        }

    def list_files(self) -> List[Dict[str, Any]]:
        return file_storage.list_files()

    def get_file(self, file_id: str) -> Optional[Dict[str, Any]]:
        return file_storage.get_file(file_id)

    def get_file_preview(self, file_id: str) -> Optional[Dict[str, Any]]:
        # Log VIEWED event when user inspects a file preview
        log_access_event(file_id=file_id, action="VIEWED")
        return file_storage.get_file_preview(file_id)

    def get_file_content(self, file_id: str) -> Optional[bytes]:
        # Log VIEWED event when file content is requested
        log_access_event(file_id=file_id, action="VIEWED")
        return file_storage.get_file_content(file_id)

file_service = FileService()
