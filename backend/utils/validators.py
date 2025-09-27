import os
import re
from typing import Dict, Any, Optional, List
from werkzeug.datastructures import FileStorage
import logging

# Try to import magic, but provide fallback if not available
try:
    import magic

    HAS_MAGIC = True
except ImportError:
    HAS_MAGIC = False

logger = logging.getLogger(__name__)


def validate_file(file: FileStorage, file_type: Optional[str] = None) -> Dict[str, Any]:
    """
    Validate uploaded file for security and format compliance

    Args:
        file: Uploaded file object
        file_type: Expected file type ('image', 'document', 'audio')

    Returns:
        Dictionary with validation results
    """
    try:
        # Basic file validation
        if not file or not file.filename:
            return {"valid": False, "error": "No file provided"}

        filename = file.filename
        file_size = _get_file_size(file)

        # File size validation
        max_size = int(os.getenv("MAX_CONTENT_LENGTH", 16 * 1024 * 1024))  # 16MB
        if file_size > max_size:
            return {
                "valid": False,
                "error": f"File size ({file_size} bytes) exceeds maximum allowed size ({max_size} bytes)",
            }

        # Filename validation
        filename_validation = _validate_filename(filename)
        if not filename_validation["valid"]:
            return filename_validation

        # Extension validation
        extension_validation = _validate_file_extension(filename, file_type)
        if not extension_validation["valid"]:
            return extension_validation

        # MIME type validation
        mime_validation = _validate_mime_type(file, file_type)
        if not mime_validation["valid"]:
            return mime_validation

        # Malicious content check
        security_validation = _validate_file_security(file)
        if not security_validation["valid"]:
            return security_validation

        return {
            "valid": True,
            "filename": filename,
            "size": file_size,
            "extension": filename.rsplit(".", 1)[1].lower(),
            "mime_type": mime_validation.get("mime_type", "unknown"),
            "file_type": _determine_file_type(
                filename, mime_validation.get("mime_type", "")
            ),
        }

    except Exception as e:
        logger.error(f"File validation failed: {e}")
        return {"valid": False, "error": f"Validation error: {str(e)}"}


def validate_text_input(
    text: str, min_length: int = 10, max_length: int = 10000
) -> Dict[str, Any]:
    """
    Validate text input for business case submission

    Args:
        text: Input text to validate
        min_length: Minimum required length
        max_length: Maximum allowed length

    Returns:
        Dictionary with validation results
    """
    try:
        if not text or not isinstance(text, str):
            return {"valid": False, "error": "Text input is required"}

        text = text.strip()

        # Length validation
        if len(text) < min_length:
            return {
                "valid": False,
                "error": f"Text must be at least {min_length} characters long",
            }

        if len(text) > max_length:
            return {
                "valid": False,
                "error": f"Text cannot exceed {max_length} characters",
            }

        # Content validation
        if _contains_suspicious_content(text):
            return {
                "valid": False,
                "error": "Text contains suspicious or potentially harmful content",
            }

        # Check for minimum meaningful content
        word_count = len(text.split())
        if word_count < 3:
            return {"valid": False, "error": "Text must contain at least 3 words"}

        return {
            "valid": True,
            "text": text,
            "length": len(text),
            "word_count": word_count,
            "language_detected": _simple_language_detection(text),
        }

    except Exception as e:
        logger.error(f"Text validation failed: {e}")
        return {"valid": False, "error": f"Validation error: {str(e)}"}


def validate_audio_file(file: FileStorage) -> Dict[str, Any]:
    """
    Validate audio file for speech-to-text processing

    Args:
        file: Uploaded audio file

    Returns:
        Dictionary with validation results
    """
    try:
        # Use general file validation first
        general_validation = validate_file(file, "audio")
        if not general_validation["valid"]:
            return general_validation

        # Audio-specific validation
        file_size = general_validation["size"]
        duration_estimate = _estimate_audio_duration(file_size)

        # Duration limits (assuming average bitrate)
        max_duration = 600  # 10 minutes
        if duration_estimate > max_duration:
            return {
                "valid": False,
                "error": f"Audio duration ({duration_estimate}s) exceeds maximum allowed duration ({max_duration}s)",
            }

        min_duration = 1  # 1 second
        if duration_estimate < min_duration:
            return {
                "valid": False,
                "error": f"Audio too short (minimum {min_duration} second required)",
            }

        return {
            "valid": True,
            "filename": general_validation["filename"],
            "size": file_size,
            "extension": general_validation["extension"],
            "mime_type": general_validation["mime_type"],
            "estimated_duration": duration_estimate,
        }

    except Exception as e:
        logger.error(f"Audio validation failed: {e}")
        return {"valid": False, "error": f"Audio validation error: {str(e)}"}


def _get_file_size(file: FileStorage) -> int:
    """Get file size by seeking to end"""
    try:
        file.seek(0, 2)  # Seek to end
        size = file.tell()
        file.seek(0)  # Reset to beginning
        return size
    except Exception:
        return 0


def _validate_filename(filename: str) -> Dict[str, Any]:
    """Validate filename for security and format"""
    try:
        # Check for empty filename
        if not filename or filename.strip() == "":
            return {"valid": False, "error": "Filename cannot be empty"}

        # Check filename length
        if len(filename) > 255:
            return {"valid": False, "error": "Filename too long (max 255 characters)"}

        # Check for suspicious characters/patterns
        suspicious_patterns = [
            r"\.\./",  # Directory traversal
            r'[<>:"|?*]',  # Invalid characters for most filesystems
            r"^\.",  # Hidden files starting with dot
            r"\.exe$",  # Executable files
            r"\.bat$",  # Batch files
            r"\.cmd$",  # Command files
            r"\.scr$",  # Screen saver files
            r"\.vbs$",  # VB Script files
            r"\.js$",  # JavaScript files (in upload context)
            r"\.php$",  # PHP files
            r"\.asp$",  # ASP files
            r"\.jsp$",  # JSP files
        ]

        for pattern in suspicious_patterns:
            if re.search(pattern, filename, re.IGNORECASE):
                return {
                    "valid": False,
                    "error": f"Filename contains suspicious pattern: {pattern}",
                }

        # Check for valid extension
        if "." not in filename:
            return {"valid": False, "error": "Filename must have an extension"}

        return {"valid": True}

    except Exception as e:
        return {"valid": False, "error": f"Filename validation error: {str(e)}"}


def _validate_file_extension(
    filename: str, expected_type: Optional[str] = None
) -> Dict[str, Any]:
    """Validate file extension"""
    try:
        allowed_extensions = {
            "image": {"jpg", "jpeg", "png", "bmp", "tiff", "gif"},
            "document": {"pdf", "txt", "doc", "docx"},
            "audio": {"mp3", "wav", "ogg", "m4a", "flac", "aac"},
        }

        extension = filename.rsplit(".", 1)[1].lower() if "." in filename else ""

        if not extension:
            return {"valid": False, "error": "File must have an extension"}

        if expected_type:
            if expected_type not in allowed_extensions:
                return {"valid": False, "error": f"Unknown file type: {expected_type}"}

            if extension not in allowed_extensions[expected_type]:
                return {
                    "valid": False,
                    "error": f"Extension .{extension} not allowed for {expected_type} files",
                }
        else:
            # Check against all allowed extensions
            all_allowed = set()
            for exts in allowed_extensions.values():
                all_allowed.update(exts)

            if extension not in all_allowed:
                return {"valid": False, "error": f"Extension .{extension} not allowed"}

        return {"valid": True, "extension": extension}

    except Exception as e:
        return {"valid": False, "error": f"Extension validation error: {str(e)}"}


def _validate_mime_type(
    file: FileStorage, expected_type: Optional[str] = None
) -> Dict[str, Any]:
    """Validate MIME type of uploaded file"""
    try:
        # Read file header to determine MIME type
        file.seek(0)
        file_header = file.read(1024)  # Read first 1KB
        file.seek(0)  # Reset file pointer

        # Use python-magic to detect MIME type if available
        try:
            if HAS_MAGIC:
                mime_type = magic.from_buffer(file_header, mime=True)
            else:
                # Fallback to extension-based detection
                extension = (
                    file.filename.rsplit(".", 1)[1].lower()
                    if "." in file.filename
                    else ""
                )
                mime_type = _get_mime_type_by_extension(extension)
        except Exception:
            # Final fallback to basic detection
            extension = (
                file.filename.rsplit(".", 1)[1].lower() if "." in file.filename else ""
            )
            mime_type = _get_mime_type_by_extension(extension)

        # Validate MIME type against expected type
        allowed_mime_types = {
            "image": [
                "image/jpeg",
                "image/png",
                "image/bmp",
                "image/tiff",
                "image/gif",
            ],
            "document": [
                "application/pdf",
                "text/plain",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ],
            "audio": [
                "audio/mpeg",
                "audio/wav",
                "audio/ogg",
                "audio/mp4",
                "audio/flac",
                "audio/aac",
            ],
        }

        if expected_type and expected_type in allowed_mime_types:
            if mime_type not in allowed_mime_types[expected_type]:
                return {
                    "valid": False,
                    "error": f"MIME type {mime_type} not allowed for {expected_type} files",
                }
        else:
            # Check against all allowed MIME types
            all_allowed_mimes = set()
            for mimes in allowed_mime_types.values():
                all_allowed_mimes.update(mimes)

            if mime_type not in all_allowed_mimes:
                return {"valid": False, "error": f"MIME type {mime_type} not allowed"}

        return {"valid": True, "mime_type": mime_type}

    except Exception as e:
        logger.warning(f"MIME type validation failed: {e}")
        return {
            "valid": True,
            "mime_type": "unknown",
        }  # Don't fail validation on MIME detection issues


def _validate_file_security(file: FileStorage) -> Dict[str, Any]:
    """Basic security validation for uploaded files"""
    try:
        file.seek(0)
        file_content = file.read(2048)  # Read first 2KB for analysis
        file.seek(0)  # Reset file pointer

        # Check for suspicious file signatures/magic bytes
        suspicious_signatures = [
            b"MZ",  # PE executable
            b"PK",  # ZIP (could contain malicious content)
            b"#!/bin",  # Shell script
            b"<?php",  # PHP script
            b"<script",  # JavaScript/HTML with script
        ]

        for signature in suspicious_signatures:
            if file_content.startswith(signature):
                return {
                    "valid": False,
                    "error": f'File contains suspicious content (signature: {signature.decode("utf-8", errors="ignore")})',
                }

        # Check for embedded scripts in text content
        if b"<script" in file_content.lower() or b"javascript:" in file_content.lower():
            return {"valid": False, "error": "File contains embedded scripts"}

        return {"valid": True}

    except Exception as e:
        logger.warning(f"Security validation failed: {e}")
        return {"valid": True}  # Don't fail validation on security check issues


def _contains_suspicious_content(text: str) -> bool:
    """Check if text contains suspicious or potentially harmful content"""
    try:
        text_lower = text.lower()

        # Check for suspicious patterns
        suspicious_patterns = [
            r"<script[^>]*>",
            r"javascript:",
            r"on\w+\s*=",  # Event handlers like onclick=
            r"eval\s*\(",
            r"document\.",
            r"window\.",
            r"alert\s*\(",
            r"prompt\s*\(",
            r"confirm\s*\(",
            r"<iframe",
            r"<object",
            r"<embed",
        ]

        for pattern in suspicious_patterns:
            if re.search(pattern, text_lower, re.IGNORECASE):
                return True

        return False

    except Exception:
        return False


def _simple_language_detection(text: str) -> str:
    """Simple language detection based on character patterns"""
    try:
        # Very basic language detection
        if re.search(r"[а-я]", text.lower()):
            return "ru"  # Russian
        elif re.search(r"[α-ω]", text.lower()):
            return "el"  # Greek
        elif re.search(r"[א-ת]", text):
            return "he"  # Hebrew
        elif re.search(r"[ا-ي]", text):
            return "ar"  # Arabic
        elif re.search(r"[一-龯]", text):
            return "zh"  # Chinese
        elif re.search(r"[ひらがな]|[カタカナ]", text):
            return "ja"  # Japanese
        elif re.search(r"[가-힣]", text):
            return "ko"  # Korean
        else:
            return "en"  # Default to English

    except Exception:
        return "en"


def _determine_file_type(filename: str, mime_type: str) -> str:
    """Determine file type category"""
    extension = filename.rsplit(".", 1)[1].lower() if "." in filename else ""

    image_extensions = {"jpg", "jpeg", "png", "bmp", "tiff", "gif"}
    document_extensions = {"pdf", "txt", "doc", "docx"}
    audio_extensions = {"mp3", "wav", "ogg", "m4a", "flac", "aac"}

    if extension in image_extensions or mime_type.startswith("image/"):
        return "image"
    elif (
        extension in document_extensions
        or mime_type.startswith("application/")
        or mime_type.startswith("text/")
    ):
        return "document"
    elif extension in audio_extensions or mime_type.startswith("audio/"):
        return "audio"
    else:
        return "unknown"


def _get_mime_type_by_extension(extension: str) -> str:
    """Get MIME type based on file extension"""
    mime_map = {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "bmp": "image/bmp",
        "tiff": "image/tiff",
        "gif": "image/gif",
        "pdf": "application/pdf",
        "txt": "text/plain",
        "doc": "application/msword",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "mp3": "audio/mpeg",
        "wav": "audio/wav",
        "ogg": "audio/ogg",
        "m4a": "audio/mp4",
        "flac": "audio/flac",
        "aac": "audio/aac",
    }

    return mime_map.get(extension.lower(), "application/octet-stream")


def _estimate_audio_duration(file_size: int, bitrate: int = 128) -> float:
    """Estimate audio duration based on file size and assumed bitrate"""
    try:
        # Rough estimation: duration = file_size / (bitrate * 1000 / 8)
        # This is a very rough estimate and may not be accurate for all formats
        estimated_duration = file_size / (bitrate * 125)  # 125 = 1000/8
        return max(0.1, estimated_duration)  # Minimum 0.1 seconds
    except Exception:
        return 60.0  # Default to 1 minute if calculation fails


def validate_file_type(filename: str, allowed_extensions: List[str]) -> bool:
    """
    Validate file type based on extension

    Args:
        filename: Name of the file to validate
        allowed_extensions: List of allowed file extensions (without dots)

    Returns:
        True if file type is allowed, False otherwise
    """
    if not filename or not allowed_extensions:
        return False

    if "." not in filename:
        return False

    file_extension = filename.rsplit(".", 1)[1].lower()
    return file_extension in [ext.lower() for ext in allowed_extensions]


def validate_file_size(file: FileStorage, max_size_mb: int = 16) -> bool:
    """
    Validate file size

    Args:
        file: File object to validate
        max_size_mb: Maximum allowed size in MB

    Returns:
        True if size is acceptable, False otherwise
    """
    if not file:
        return False

    try:
        file_size = _get_file_size(file)
        max_size_bytes = max_size_mb * 1024 * 1024
        return file_size <= max_size_bytes
    except Exception as e:
        logger.error(f"File size validation failed: {e}")
        return False
