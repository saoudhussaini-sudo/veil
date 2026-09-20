import os
import logging
from abc import ABC, abstractmethod
from typing import Optional
from app.config import settings

logger = logging.getLogger("veil.storage.provider")

class StorageProvider(ABC):
    """
    Abstract interface for file persistence, decoupling storage from local disk.
    Allows S3, Cloudflare R2, Google Cloud Storage, or Azure Blob to be plugged in seamlessly.
    """

    @abstractmethod
    def save_file(self, filename: str, content: bytes) -> str:
        """Saves file to persistent storage and returns the storage reference/path."""
        pass

    @abstractmethod
    def read_file(self, storage_path: str) -> bytes:
        """Reads file bytes from storage."""
        pass

    @abstractmethod
    def delete_file(self, storage_path: str) -> bool:
        """Deletes file from storage."""
        pass

    @abstractmethod
    def file_exists(self, storage_path: str) -> bool:
        """Checks if file exists in storage."""
        pass

    @abstractmethod
    def save_temp_file(self, filename: str, content: bytes) -> str:
        """Saves intermediate/scratch file to temporary processing storage."""
        pass

    @abstractmethod
    def cleanup_temp_file(self, temp_path: str) -> None:
        """Removes temporary processing scratch file."""
        pass


class LocalDiskStorageProvider(StorageProvider):
    """Default on-device / local-disk storage implementation."""

    def __init__(self):
        self.files_dir = settings.FILES_DIR
        self.temp_dir = settings.TEMP_DIR
        os.makedirs(self.files_dir, exist_ok=True)
        os.makedirs(self.temp_dir, exist_ok=True)

    def save_file(self, filename: str, content: bytes) -> str:
        dest_path = os.path.join(self.files_dir, filename)
        with open(dest_path, "wb") as f:
            f.write(content)
        return dest_path

    def read_file(self, storage_path: str) -> bytes:
        if not os.path.exists(storage_path):
            raise FileNotFoundError(f"File not found in storage: {storage_path}")
        with open(storage_path, "rb") as f:
            return f.read()

    def delete_file(self, storage_path: str) -> bool:
        if os.path.exists(storage_path):
            try:
                os.remove(storage_path)
                return True
            except OSError as e:
                logger.error(f"Failed to delete {storage_path}: {e}")
                return False
        return False

    def file_exists(self, storage_path: str) -> bool:
        return os.path.exists(storage_path)

    def save_temp_file(self, filename: str, content: bytes) -> str:
        temp_path = os.path.join(self.temp_dir, f"tmp_{filename}")
        with open(temp_path, "wb") as f:
            f.write(content)
        return temp_path

    def cleanup_temp_file(self, temp_path: str) -> None:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                pass


def get_storage_provider() -> StorageProvider:
    """Factory returning the active storage provider."""
    return LocalDiskStorageProvider()
