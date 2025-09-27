"""
Routes package for API endpoints
"""

from .upload import upload_bp
from .evaluate import evaluate_bp
from .feedback import feedback_bp

__all__ = ["upload_bp", "evaluate_bp", "feedback_bp"]
