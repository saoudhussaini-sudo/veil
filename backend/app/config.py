import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    PROJECT_NAME: str = "VEIL"
    VERSION: str = "3.1.0"
    DEBUG: bool = False
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # Frontend CORS
    FRONTEND_URL: str = "http://localhost:3000"

    # Storage Paths
    BASE_DIR: str = str(Path(__file__).resolve().parent.parent)
    DATA_DIR: str = str(Path(__file__).resolve().parent.parent / "data")
    FILES_DIR: str = str(Path(__file__).resolve().parent.parent / "data" / "files")
    TEMP_DIR: str = str(Path(__file__).resolve().parent.parent / "data" / "temp")
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

    # LLM Provider Configuration
    # Supported: OLLAMA_LOCAL, OLLAMA_CLOUD, API
    LLM_PROVIDER: str = "OLLAMA_LOCAL"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "qwen2.5:0.5b"
    OLLAMA_API_KEY: str = ""

    # Generic Cloud LLM (used when LLM_PROVIDER=API)
    LLM_API_KEY: str = ""
    LLM_BASE_URL: str = "https://api.groq.com/openai/v1"
    LLM_MODEL: str = "llama-3.1-8b-instant"

    # Aliases for backward compatibility
    @property
    def LOCAL_AI_PROVIDER(self) -> str:
        return self.LLM_PROVIDER

    @property
    def LOCAL_AI_BASE_URL(self) -> str:
        return self.OLLAMA_BASE_URL

    @property
    def LOCAL_AI_MODEL(self) -> str:
        return self.OLLAMA_MODEL

settings = Settings()

# Ensure all directories exist
for p in [
    settings.DATA_DIR,
    settings.FILES_DIR,
    settings.TEMP_DIR,
    settings.EXTRACTED_DIR,
    settings.PREVIEWS_DIR,
    settings.ANALYTICS_DIR,
]:
    os.makedirs(p, exist_ok=True)

if not settings.DB_PATH:
    settings.DB_PATH = os.path.join(settings.DATA_DIR, "veil.db")
