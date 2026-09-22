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

    # Primary AI Inference Engine: Google Gemini API
    LLM_PROVIDER: str = "GEMINI"
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.5-flash"

    # Optional Generic Cloud LLM (OpenAI-compatible)
    LLM_API_KEY: str = ""
    LLM_BASE_URL: str = "https://api.groq.com/openai/v1"
    LLM_MODEL: str = "llama-3.1-8b-instant"

    # Inference Limits & Resilience
    LLM_MAX_TOKENS: int = 1024
    LLM_TIMEOUT: float = 60.0

    # Aliases for backward compatibility
    @property
    def LOCAL_AI_PROVIDER(self) -> str:
        return self.LLM_PROVIDER

    @property
    def LOCAL_AI_BASE_URL(self) -> str:
        return "https://generativelanguage.googleapis.com"

    @property
    def LOCAL_AI_MODEL(self) -> str:
        return self.GEMINI_MODEL

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
