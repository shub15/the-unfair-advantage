"""
Configuration settings for The Unfair Advantage project
Multi-modal business idea evaluation platform
"""

import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Config:
    # Basic Flask configuration
    SECRET_KEY = os.environ.get("SECRET_KEY") or "unfair-advantage-secret-key-2024"

    # File upload configuration
    UPLOAD_FOLDER = os.path.join(os.getcwd(), "static", "uploads")
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    ALLOWED_EXTENSIONS = {
        "txt",
        "pdf",
        "png",
        "jpg",
        "jpeg",
        "gif",
        "mp3",
        "wav",
        "ogg",
        "m4a",
    }

    # PDF processing configuration
    PDF_ALLOWED_EXTENSIONS = {"pdf"}
    IMAGE_ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}

    # Google Cloud Platform configuration
    GCP_PROJECT_ID = os.environ.get("GCP_PROJECT_ID")
    GOOGLE_APPLICATION_CREDENTIALS = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")

    # Gemini API configuration
    GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

    # Poppler configuration for PDF processing
    POPPLER_PATH = os.environ.get("POPPLER_PATH")  # Path to Poppler binaries

    # Supabase configuration
    SUPABASE_URL = os.environ.get("SUPABASE_URL")
    SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
    SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")

    # MongoDB configuration
    MONGODB_URI = os.environ.get("MONGODB_URI", "mongodb://localhost:27017/")
    MONGODB_DATABASE = os.environ.get("MONGODB_DATABASE", "unfair_advantage")

    # Google Cloud Speech-to-Text
    SPEECH_TO_TEXT_LANGUAGE_CODES = [
        "en-IN",  # English (India)
        "hi-IN",  # Hindi
        "bn-IN",  # Bengali
        "ta-IN",  # Tamil
        "te-IN",  # Telugu
        "mr-IN",  # Marathi
        "gu-IN",  # Gujarati
        "kn-IN",  # Kannada
        "ml-IN",  # Malayalam
        "pa-IN",  # Punjabi
    ]

    # LLM Configuration (using Vertex AI)
    VERTEX_AI_MODEL = "gemini-1.5-pro"
    VERTEX_AI_LOCATION = "us-central1"

    # Business evaluation parameters - aligned with Indian startup ecosystem
    EVALUATION_CRITERIA = {
        "market_potential": 0.25,  # Size of Indian/global market opportunity
        "feasibility": 0.25,  # Technical and operational feasibility
        "innovation": 0.20,  # Novelty and differentiation
        "scalability": 0.15,  # Growth potential across regions
        "financial_viability": 0.15,  # Revenue model and profitability
    }

    # Industry-specific evaluation weights (can be customized based on sector)
    INDUSTRY_WEIGHTS = {
        "technology": {
            "innovation": 0.30,
            "scalability": 0.25,
            "market_potential": 0.20,
            "feasibility": 0.15,
            "financial_viability": 0.10,
        },
        "healthcare": {
            "market_potential": 0.30,
            "feasibility": 0.25,
            "innovation": 0.20,
            "financial_viability": 0.15,
            "scalability": 0.10,
        },
        "fintech": {
            "financial_viability": 0.30,
            "market_potential": 0.25,
            "feasibility": 0.20,
            "scalability": 0.15,
            "innovation": 0.10,
        },
        "social_impact": {
            "market_potential": 0.35,
            "feasibility": 0.25,
            "scalability": 0.20,
            "innovation": 0.10,
            "financial_viability": 0.10,
        },
    }

    # Target markets for evaluation context
    TARGET_MARKETS = [
        "india_tier1",  # Metro cities
        "india_tier2",  # Tier 2 cities
        "india_rural",  # Rural India
        "south_asia",  # Regional expansion
        "global",  # Global market
    ]

    # Supported languages for feedback
    SUPPORTED_LANGUAGES = {
        "en": "English",
        "hi": "Hindi",
        "mr": "Marathi",
        "gu": "Gujarati",
        "od": "Odia",
    }
