from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class InputType(Enum):
    """Types of input methods for business cases"""

    TEXT = "text"
    VOICE = "voice"
    IMAGE = "image"
    DOCUMENT = "document"


class BusinessCaseStatus(Enum):
    """Status of business case processing"""

    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class BusinessCaseInput:
    """Input data for a business case submission"""

    content: str
    input_type: InputType
    language: str = "en"
    file_path: Optional[str] = None
    file_name: Optional[str] = None
    extracted_text: Optional[str] = None
    confidence_score: Optional[float] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class BusinessCase:
    """Complete business case data model"""

    id: str
    title: str
    description: str
    input_data: BusinessCaseInput
    status: BusinessCaseStatus = BusinessCaseStatus.PENDING
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    user_id: Optional[str] = None

    # Processed content
    cleaned_content: Optional[str] = None
    translated_content: Optional[str] = None
    keywords: List[str] = field(default_factory=list)

    # Analysis results
    market_analysis: Optional[Dict[str, Any]] = None
    competitive_analysis: Optional[Dict[str, Any]] = None
    feasibility_analysis: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert business case to dictionary"""
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "status": self.status.value,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "user_id": self.user_id,
            "input_type": self.input_data.input_type.value,
            "language": self.input_data.language,
            "cleaned_content": self.cleaned_content,
            "keywords": self.keywords,
            "market_analysis": self.market_analysis,
            "competitive_analysis": self.competitive_analysis,
            "feasibility_analysis": self.feasibility_analysis,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "BusinessCase":
        """Create business case from dictionary"""
        input_data = BusinessCaseInput(
            content=data.get("content", ""),
            input_type=InputType(data.get("input_type", "text")),
            language=data.get("language", "en"),
            file_path=data.get("file_path"),
            file_name=data.get("file_name"),
            extracted_text=data.get("extracted_text"),
            confidence_score=data.get("confidence_score"),
            metadata=data.get("metadata", {}),
        )

        return cls(
            id=data["id"],
            title=data["title"],
            description=data["description"],
            input_data=input_data,
            status=BusinessCaseStatus(data.get("status", "pending")),
            created_at=(
                datetime.fromisoformat(data["created_at"])
                if "created_at" in data
                else datetime.now()
            ),
            updated_at=(
                datetime.fromisoformat(data["updated_at"])
                if "updated_at" in data
                else datetime.now()
            ),
            user_id=data.get("user_id"),
            cleaned_content=data.get("cleaned_content"),
            translated_content=data.get("translated_content"),
            keywords=data.get("keywords", []),
            market_analysis=data.get("market_analysis"),
            competitive_analysis=data.get("competitive_analysis"),
            feasibility_analysis=data.get("feasibility_analysis"),
        )
