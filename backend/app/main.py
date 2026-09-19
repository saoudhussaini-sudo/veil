import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.storage.database import init_database
from app.storage.file_storage import init_file_database
from app.api.health import router as health_router
from app.api.files import router as files_router
from app.api.query import router as query_router
from app.api.analytics import router as analytics_router
from app.api.ai import router as ai_router
from app.api.debug import router as debug_router

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("veil")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing VEIL local SQLite database and directories...")
    init_database()
    init_file_database()
    logger.info(f"Syncing local file chunks to Moss index '{settings.MOSS_INDEX_NAME}'...")
    from app.services.file_service import file_service
    await file_service.sync_all_to_moss()
    yield
    logger.info("VEIL local intelligence backend shutting down.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="VEIL: Privacy-First, Local-First AI Workspace with Moss Semantic Retrieval Layer",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes (No web search)
app.include_router(health_router)
app.include_router(files_router)
app.include_router(query_router)
app.include_router(analytics_router)
app.include_router(ai_router)
app.include_router(debug_router)

@app.get("/")
def root():
    return {
        "app": "VEIL",
        "tagline": "A general-purpose local AI assistant with a private semantic memory layer.",
        "mode": "LOCAL_FIRST",
        "retrieval_layer": "Moss",
        "status": "online",
        "docs_url": "/docs"
    }
