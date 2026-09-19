import os
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.knowledge_service import knowledge_service

router = APIRouter(prefix="/api/knowledge", tags=["Knowledge Ingestion"])

@router.get("")
def list_knowledge():
    return knowledge_service.list_knowledge()

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename missing.")
    
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        doc = await knowledge_service.ingest_file(file.filename, file_bytes)
        return {"status": "SUCCESS", "document": doc}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")

@router.post("/demo")
async def load_demo_knowledge():
    try:
        res = await knowledge_service.load_demo_knowledge()
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load demo documents: {str(e)}")

@router.post("/index")
async def trigger_indexing():
    try:
        res = await knowledge_service.sync_all_chunks_to_moss()
        return {"status": "SUCCESS", "details": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Indexing error: {str(e)}")

@router.get("/sources/{doc_id}")
def get_source_detail(doc_id: str):
    doc = knowledge_service.get_document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    return doc

@router.delete("/{doc_id}")
async def delete_document(doc_id: str):
    doc = knowledge_service.get_document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    await knowledge_service.remove_document(doc_id)
    return {"status": "DELETED", "id": doc_id}
