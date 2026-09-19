import os
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from app.services.file_service import file_service

router = APIRouter(prefix="/api/files", tags=["Files Workspace"])

@router.get("")
def list_files():
    files = file_service.list_files()
    return {
        "total_files": len(files),
        "files": files
    }

@router.post("/upload")
async def upload_files(files: List[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded.")

    results = []
    errors = []
    for f in files:
        if not f.filename:
            continue
        try:
            content = await f.read()
            info = await file_service.ingest_file(f.filename, content)
            results.append(info)
        except Exception as e:
            errors.append({"filename": f.filename, "error": str(e)})

    return {
        "status": "SUCCESS" if results else "FAILED",
        "uploaded_count": len(results),
        "files": results,
        "errors": errors
    }

@router.post("/demo")
async def load_demo_files():
    try:
        return await file_service.load_demo_files()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load demo files: {str(e)}")

@router.get("/{file_id}")
def get_file(file_id: str):
    info = file_service.get_file(file_id)
    if not info:
        raise HTTPException(status_code=404, detail="File not found.")
    return info

@router.get("/{file_id}/preview")
def get_file_preview(file_id: str):
    preview = file_service.get_file_preview(file_id)
    if not preview:
        raise HTTPException(status_code=404, detail="File not found.")
    return preview

@router.get("/{file_id}/content")
def get_raw_file(file_id: str):
    info = file_service.get_file(file_id)
    if not info or not os.path.exists(info["storage_path"]):
        raise HTTPException(status_code=404, detail="Physical file not found.")
    return FileResponse(
        path=info["storage_path"],
        filename=info["filename"],
        media_type=info["mime_type"]
    )

@router.delete("/{file_id}")
async def delete_file(file_id: str):
    success = await file_service.delete_file(file_id)
    if not success:
        raise HTTPException(status_code=404, detail="File not found.")
    return {"status": "DELETED", "id": file_id}

@router.post("/{file_id}/index")
async def reindex_file(file_id: str):
    info = file_service.get_file(file_id)
    if not info:
        raise HTTPException(status_code=404, detail="File not found.")
    await file_service.sync_all_to_moss()
    return {"status": "REINDEXED", "id": file_id}
