import os
import sys
import uvicorn

# Add backend directory to sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

if __name__ == "__main__":
    from app.config import settings
    port = int(os.environ.get("PORT", settings.PORT))
    host = os.environ.get("HOST", settings.HOST)
    reload = settings.DEBUG and os.environ.get("ENVIRONMENT", "").lower() != "production"
    logger_msg = f"Starting VEIL backend server on {host}:{port} (reload={reload})"
    print(logger_msg)
    uvicorn.run("app.main:app", host=host, port=port, reload=reload)
