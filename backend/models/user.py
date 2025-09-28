"""
User model for MongoDB integration with Supabase authentication
"""

from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
import uuid


class UserStatus(Enum):
    """User account status"""

    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"


@dataclass
class ProcessedDocument:
    """Document processing result storage"""

    id: str
    original_filename: str
    file_type: str  # pdf, image, audio
    upload_timestamp: datetime
    processing_method: str  # gemini, google_vision, etc.
    raw_text: str
    structured_data: Dict[str, Any]
    confidence: float
    pages_processed: Optional[int] = None
    file_size: Optional[int] = None
    processing_time: Optional[float] = None
    ocr_metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class UserProfile:
    """User profile data from Supabase"""

    supabase_user_id: str
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)
    last_sign_in: Optional[datetime] = None
    email_verified: bool = False
    phone_verified: bool = False
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class User:
    """Main user model for MongoDB storage"""

    _id: str  # MongoDB ObjectId as string
    supabase_user_id: str  # Supabase user UUID
    profile: UserProfile
    status: UserStatus = UserStatus.ACTIVE

    # Document processing history
    processed_documents: List[ProcessedDocument] = field(default_factory=list)

    # Usage statistics
    total_documents_processed: int = 0
    total_pages_processed: int = 0
    storage_used_bytes: int = 0

    # Timestamps
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    last_activity: Optional[datetime] = None

    # Settings and preferences
    preferences: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert user to dictionary for MongoDB storage"""
        return {
            "_id": self._id,
            "supabase_user_id": self.supabase_user_id,
            "profile": {
                "supabase_user_id": self.profile.supabase_user_id,
                "email": self.profile.email,
                "full_name": self.profile.full_name,
                "avatar_url": self.profile.avatar_url,
                "phone": self.profile.phone,
                "created_at": self.profile.created_at,
                "last_sign_in": self.profile.last_sign_in,
                "email_verified": self.profile.email_verified,
                "phone_verified": self.profile.phone_verified,
                "metadata": self.profile.metadata,
            },
            "status": self.status.value,
            "processed_documents": [
                {
                    "id": doc.id,
                    "original_filename": doc.original_filename,
                    "file_type": doc.file_type,
                    "upload_timestamp": doc.upload_timestamp,
                    "processing_method": doc.processing_method,
                    "raw_text": doc.raw_text,
                    "structured_data": doc.structured_data,
                    "confidence": doc.confidence,
                    "pages_processed": doc.pages_processed,
                    "file_size": doc.file_size,
                    "processing_time": doc.processing_time,
                    "ocr_metadata": doc.ocr_metadata,
                }
                for doc in self.processed_documents
            ],
            "total_documents_processed": self.total_documents_processed,
            "total_pages_processed": self.total_pages_processed,
            "storage_used_bytes": self.storage_used_bytes,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "last_activity": self.last_activity,
            "preferences": self.preferences,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "User":
        """Create User instance from MongoDB document"""
        profile_data = data.get("profile", {})
        profile = UserProfile(
            supabase_user_id=profile_data.get("supabase_user_id"),
            email=profile_data.get("email"),
            full_name=profile_data.get("full_name"),
            avatar_url=profile_data.get("avatar_url"),
            phone=profile_data.get("phone"),
            created_at=profile_data.get("created_at", datetime.now()),
            last_sign_in=profile_data.get("last_sign_in"),
            email_verified=profile_data.get("email_verified", False),
            phone_verified=profile_data.get("phone_verified", False),
            metadata=profile_data.get("metadata", {}),
        )

        processed_docs = []
        for doc_data in data.get("processed_documents", []):
            doc = ProcessedDocument(
                id=doc_data.get("id"),
                original_filename=doc_data.get("original_filename"),
                file_type=doc_data.get("file_type"),
                upload_timestamp=doc_data.get("upload_timestamp"),
                processing_method=doc_data.get("processing_method"),
                raw_text=doc_data.get("raw_text"),
                structured_data=doc_data.get("structured_data", {}),
                confidence=doc_data.get("confidence", 0.0),
                pages_processed=doc_data.get("pages_processed"),
                file_size=doc_data.get("file_size"),
                processing_time=doc_data.get("processing_time"),
                ocr_metadata=doc_data.get("ocr_metadata", {}),
            )
            processed_docs.append(doc)

        return cls(
            _id=data.get("_id"),
            supabase_user_id=data.get("supabase_user_id"),
            profile=profile,
            status=UserStatus(data.get("status", "active")),
            processed_documents=processed_docs,
            total_documents_processed=data.get("total_documents_processed", 0),
            total_pages_processed=data.get("total_pages_processed", 0),
            storage_used_bytes=data.get("storage_used_bytes", 0),
            created_at=data.get("created_at", datetime.now()),
            updated_at=data.get("updated_at", datetime.now()),
            last_activity=data.get("last_activity"),
            preferences=data.get("preferences", {}),
        )

    def add_processed_document(self, document: ProcessedDocument):
        """Add a processed document to user's history"""
        self.processed_documents.append(document)
        self.total_documents_processed += 1
        if document.pages_processed:
            self.total_pages_processed += document.pages_processed
        if document.file_size:
            self.storage_used_bytes += document.file_size
        self.updated_at = datetime.now()
        self.last_activity = datetime.now()
