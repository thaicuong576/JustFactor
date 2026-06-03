from supabase import Client, create_client

from app.core.config import settings
from app.core.storage_backend import LocalStorageBackend


class SupabaseStorage(LocalStorageBackend):
    def __init__(self):
        super().__init__()
        self.supabase: Client | None = None
        self.bucket_name = "factoring-assets"
        if settings.SUPABASE_URL and settings.SUPABASE_KEY:
            print(f"DEBUG: Supabase Configuration URL: {settings.SUPABASE_URL}")
            self.supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        else:
            print("DEBUG: Supabase not configured, using local file storage")

    def upload_file(self, file_content: bytes, destination_path: str, content_type: str) -> str:
        if not self.supabase:
            return super().upload_file(file_content, destination_path, content_type)
        self.supabase.storage.from_(self.bucket_name).upload(
            file=file_content,
            path=destination_path,
            file_options={"content-type": content_type, "upsert": "false"},
        )
        return destination_path.replace("\\", "/")

    def get_public_url(self, path: str) -> str:
        if not self.supabase:
            return super().get_public_url(path)
        return self.supabase.storage.from_(self.bucket_name).get_public_url(path)

    def delete_file(self, path: str):
        if not self.supabase:
            return super().delete_file(path)
        self.supabase.storage.from_(self.bucket_name).remove([path])

supabase_storage = SupabaseStorage()
