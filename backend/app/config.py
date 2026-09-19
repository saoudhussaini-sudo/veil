import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    PROJECT_NAME: str = "VEIL"
    VERSION: str = "3.0.0"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "127.0.0.1"

    # Storage Paths
    BASE_DIR: str = str(Path(__file__).resolve().parent.parent)
    DATA_DIR: str = str(Path(__file__).resolve().parent.parent / "data")
    FILES_DIR: str = str(Path(__file__).resolve().parent.parent / "data" / "files")
    EXTRACTED_DIR: str = str(Path(__file__).resolve().parent.parent / "data" / "extracted")
    PREVIEWS_DIR: str = str(Path(__file__).resolve().parent.parent / "data" / "previews")
    ANALYTICS_DIR: str = str(Path(__file__).resolve().parent.parent / "data" / "analytics")
    DB_PATH: str = ""

    # Moss Settings
    MOSS_PROJECT_ID: str = ""
    MOSS_PROJECT_KEY: str = ""
    MOSS_INDEX_NAME: str = "veil-knowledge"
    MOSS_DEFAULT_INDEX: str = "veil-knowledge"
    MOSS_MODEL_ID: str = "moss-minilm"

    # Local AI Runtime Configuration
    LOCAL_AI_PROVIDER: str = "ollama"  # ollama, local-analytical
    LOCAL_AI_BASE_URL: str = "http://127.0.0.1:11434"
    LOCAL_AI_MODEL: str = "qwen2.5:0.5b"

settings = Settings()

# Ensure directories exist
for p in [settings.DATA_DIR, settings.FILES_DIR, settings.EXTRACTED_DIR, settings.PREVIEWS_DIR, settings.ANALYTICS_DIR]:
    os.makedirs(p, exist_ok=True)

if not settings.DB_PATH:
    settings.DB_PATH = os.path.join(settings.DATA_DIR, "veil.db")
