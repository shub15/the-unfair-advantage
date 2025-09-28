import os
import uuid
import hashlib
import mimetypes
from datetime import datetime
from werkzeug.utils import secure_filename
from werkzeug.datastructures import FileStorage
from typing import Dict, Any, Optional
import shutil
import logging

# Try to import magic, but provide fallback if not available
try:
    import magic

    HAS_MAGIC = True
except ImportError:
    HAS_MAGIC = False

logger = logging.getLogger(__name__)

# Log warning if magic is not available
if not HAS_MAGIC:
    logger.warning(
        "python-magic not available, using mimetypes fallback for file type detection"
    )


class FileHandler:
    """Handler for file upload, processing, and management"""

    def __init__(self):
        self.upload_folder = os.getenv("UPLOAD_FOLDER", "static/uploads")
        self.max_file_size = int(
            os.getenv("MAX_CONTENT_LENGTH", 16 * 1024 * 1024)
        )  # 16MB
        self.allowed_extensions = {
            "image": {"jpg", "jpeg", "png", "bmp", "tiff", "gif"},
            "document": {"pdf", "txt", "doc", "docx"},
            "audio": {"mp3", "wav", "ogg", "m4a", "flac", "aac"},
        }

        # Ensure upload directory exists
        os.makedirs(self.upload_folder, exist_ok=True)

    def save_uploaded_file(
        self, file: FileStorage, subfolder: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Save uploaded file to the upload directory

        Args:
            file: Uploaded file object
            subfolder: Optional subfolder to organize files

        Returns:
            Dictionary containing file information
        """
        try:
            # Generate secure filename
            original_filename = file.filename
            secure_name = secure_filename(original_filename)

            # Generate unique filename to avoid conflicts
            file_extension = (
                secure_name.rsplit(".", 1)[1].lower() if "." in secure_name else ""
            )
            unique_filename = f"{uuid.uuid4().hex}.{file_extension}"

            # Determine save path
            if subfolder:
                save_directory = os.path.join(self.upload_folder, subfolder)
                os.makedirs(save_directory, exist_ok=True)
            else:
                save_directory = self.upload_folder

            file_path = os.path.join(save_directory, unique_filename)

            # Save file
            file.save(file_path)

            # Get file information
            file_info = self._get_file_info(
                file_path, original_filename, unique_filename
            )

            logger.info(f"File saved successfully: {file_path}")

            return file_info

        except Exception as e:
            logger.error(f"File save failed: {e}")
            raise

    def _get_file_info(
        self, file_path: str, original_filename: str, saved_filename: str
    ) -> Dict[str, Any]:
        """Get detailed information about the saved file"""
        try:
            file_stats = os.stat(file_path)
            file_extension = (
                saved_filename.rsplit(".", 1)[1].lower()
                if "." in saved_filename
                else ""
            )

            # Get MIME type
            mime_type = self._get_mime_type(file_path)

            # Calculate file hash for integrity checking
            file_hash = self._calculate_file_hash(file_path)

            return {
                "filename": saved_filename,
                "original_filename": original_filename,
                "file_path": file_path,
                "size": file_stats.st_size,
                "extension": file_extension,
                "mime_type": mime_type,
                "hash": file_hash,
                "uploaded_at": datetime.now().isoformat(),
                "file_type": self._determine_file_type(file_extension, mime_type),
            }

        except Exception as e:
            logger.error(f"File info extraction failed: {e}")
            return {
                "filename": saved_filename,
                "original_filename": original_filename,
                "file_path": file_path,
                "error": str(e),
            }

    def _get_mime_type(self, file_path: str) -> str:
        """Get MIME type of the file"""
        try:
            # Try magic first if available
            if HAS_MAGIC:
                mime_type = magic.from_file(file_path, mime=True)
                return mime_type
            else:
                # Use mimetypes as fallback
                mime_type, _ = mimetypes.guess_type(file_path)
                if mime_type:
                    return mime_type
        except Exception as e:
            logger.warning(f"MIME type detection failed: {e}")

        # Final fallback to extension-based detection
        extension = file_path.rsplit(".", 1)[1].lower() if "." in file_path else ""
        mime_map = {
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "png": "image/png",
            "gif": "image/gif",
            "bmp": "image/bmp",
            "tiff": "image/tiff",
            "pdf": "application/pdf",
            "doc": "application/msword",
            "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "txt": "text/plain",
            "mp3": "audio/mpeg",
            "wav": "audio/wav",
            "ogg": "audio/ogg",
            "m4a": "audio/mp4",
            "flac": "audio/flac",
            "aac": "audio/aac",
        }
        return mime_map.get(extension, "application/octet-stream")

    def _calculate_file_hash(self, file_path: str) -> str:
        """Calculate SHA-256 hash of the file"""
        try:
            hash_sha256 = hashlib.sha256()
            with open(file_path, "rb") as f:
                for chunk in iter(lambda: f.read(4096), b""):
                    hash_sha256.update(chunk)
            return hash_sha256.hexdigest()
        except Exception as e:
            logger.warning(f"File hash calculation failed: {e}")
            return ""

    def _determine_file_type(self, extension: str, mime_type: str) -> str:
        """Determine file type category"""
        if extension in self.allowed_extensions["image"] or mime_type.startswith(
            "image/"
        ):
            return "image"
        elif (
            extension in self.allowed_extensions["document"]
            or mime_type.startswith("application/")
            or mime_type.startswith("text/")
        ):
            return "document"
        elif extension in self.allowed_extensions["audio"] or mime_type.startswith(
            "audio/"
        ):
            return "audio"
        else:
            return "unknown"

    def delete_file(self, file_path: str) -> bool:
        """
        Delete a file from the filesystem

        Args:
            file_path: Path to the file to delete

        Returns:
            True if successful, False otherwise
        """
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"File deleted: {file_path}")
                return True
            else:
                logger.warning(f"File not found for deletion: {file_path}")
                return False
        except Exception as e:
            logger.error(f"File deletion failed: {e}")
            return False

    def cleanup_old_files(self, max_age_hours: int = 24) -> int:
        """
        Clean up old files from the upload directory

        Args:
            max_age_hours: Maximum age in hours before files are deleted

        Returns:
            Number of files deleted
        """
        deleted_count = 0
        current_time = datetime.now().timestamp()
        max_age_seconds = max_age_hours * 3600

        try:
            for root, dirs, files in os.walk(self.upload_folder):
                for file in files:
                    file_path = os.path.join(root, file)
                    file_age = current_time - os.path.getctime(file_path)

                    if file_age > max_age_seconds:
                        if self.delete_file(file_path):
                            deleted_count += 1

            logger.info(f"Cleanup completed: {deleted_count} files deleted")
            return deleted_count

        except Exception as e:
            logger.error(f"File cleanup failed: {e}")
            return deleted_count

    def get_file_stats(self) -> Dict[str, Any]:
        """Get statistics about uploaded files"""
        try:
            total_files = 0
            total_size = 0
            file_types = {"image": 0, "document": 0, "audio": 0, "other": 0}

            for root, dirs, files in os.walk(self.upload_folder):
                for file in files:
                    file_path = os.path.join(root, file)
                    file_size = os.path.getsize(file_path)
                    extension = file.rsplit(".", 1)[1].lower() if "." in file else ""

                    total_files += 1
                    total_size += file_size

                    # Categorize file type
                    if extension in self.allowed_extensions["image"]:
                        file_types["image"] += 1
                    elif extension in self.allowed_extensions["document"]:
                        file_types["document"] += 1
                    elif extension in self.allowed_extensions["audio"]:
                        file_types["audio"] += 1
                    else:
                        file_types["other"] += 1

            return {
                "total_files": total_files,
                "total_size_bytes": total_size,
                "total_size_mb": round(total_size / (1024 * 1024), 2),
                "file_types": file_types,
                "upload_folder": self.upload_folder,
            }

        except Exception as e:
            logger.error(f"File stats calculation failed: {e}")
            return {"error": str(e)}

    def is_file_type_allowed(self, filename: str, file_type: str = None) -> bool:
        """Check if file type is allowed"""
        if not filename:
            return False

        extension = filename.rsplit(".", 1)[1].lower() if "." in filename else ""

        if file_type:
            return extension in self.allowed_extensions.get(file_type, set())
        else:
            # Check against all allowed extensions
            all_extensions = set()
            for extensions in self.allowed_extensions.values():
                all_extensions.update(extensions)
            return extension in all_extensions

    def validate_file_size(self, file_size: int) -> bool:
        """Check if file size is within limits"""
        return file_size <= self.max_file_size

    def get_allowed_extensions(self, file_type: str = None) -> set:
        """Get allowed extensions for a specific file type or all"""
        if file_type and file_type in self.allowed_extensions:
            return self.allowed_extensions[file_type]
        else:
            all_extensions = set()
            for extensions in self.allowed_extensions.values():
                all_extensions.update(extensions)
            return all_extensions

    def move_file(self, source_path: str, destination_path: str) -> bool:
        """Move file from source to destination"""
        try:
            # Ensure destination directory exists
            os.makedirs(os.path.dirname(destination_path), exist_ok=True)

            shutil.move(source_path, destination_path)
            logger.info(f"File moved from {source_path} to {destination_path}")
            return True

        except Exception as e:
            logger.error(f"File move failed: {e}")
            return False

    def copy_file(self, source_path: str, destination_path: str) -> bool:
        """Copy file from source to destination"""
        try:
            # Ensure destination directory exists
            os.makedirs(os.path.dirname(destination_path), exist_ok=True)

            shutil.copy2(source_path, destination_path)
            logger.info(f"File copied from {source_path} to {destination_path}")
            return True

        except Exception as e:
            logger.error(f"File copy failed: {e}")
            return False
