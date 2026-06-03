from pathlib import Path

from app.core.config import settings


class LocalStorageBackend:
    def __init__(self) -> None:
        self.root = Path(settings.UPLOAD_DIR)
        self.root.mkdir(parents=True, exist_ok=True)

    def upload_file(self, file_content: bytes, destination_path: str, content_type: str | None) -> str:
        full_path = self.root / destination_path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        full_path.write_bytes(file_content)
        return destination_path.replace("\\", "/")

    def get_public_url(self, path: str) -> str:
        normalized = path.replace("\\", "/").lstrip("/")
        return f"/static/{normalized}"

    def delete_file(self, path: str) -> None:
        full_path = self.root / path
        if full_path.exists():
            full_path.unlink()
