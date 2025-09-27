import os
from typing import Dict, Any, Optional
from google.cloud import translate_v2 as translate
import logging

logger = logging.getLogger(__name__)


class TranslationService:
    """Service for multi-language support and translation"""

    def __init__(self):
        self.google_credentials = os.getenv("GOOGLE_CLOUD_CREDENTIALS")
        self.supported_languages = {
            "en": "English",
            "es": "Spanish",
            "fr": "French",
            "de": "German",
            "it": "Italian",
            "pt": "Portuguese",
            "hi": "Hindi",
            "zh": "Chinese",
            "ja": "Japanese",
            "ko": "Korean",
            "ar": "Arabic",
            "ru": "Russian",
            "nl": "Dutch",
            "sv": "Swedish",
            "no": "Norwegian",
            "da": "Danish",
            "fi": "Finnish",
            "pl": "Polish",
            "tr": "Turkish",
            "th": "Thai",
        }

        # Initialize Google Translate client if credentials are available
        self.translate_client = None
        if self.google_credentials:
            try:
                self.translate_client = translate.Client()
                logger.info("Google Translate API initialized successfully")
            except Exception as e:
                logger.warning(f"Failed to initialize Google Translate API: {e}")

    def detect_language(self, text: str) -> Dict[str, Any]:
        """
        Detect the language of input text

        Args:
            text: Text to analyze

        Returns:
            Dictionary containing detected language and confidence
        """
        try:
            if self.translate_client and len(text.strip()) > 10:
                result = self.translate_client.detect_language(text)

                return {
                    "language": result["language"],
                    "confidence": result["confidence"],
                    "language_name": self.supported_languages.get(
                        result["language"], result["language"].upper()
                    ),
                    "method": "google_translate",
                }
            else:
                # Fallback to simple detection
                return self._simple_language_detection(text)

        except Exception as e:
            logger.error(f"Language detection failed: {e}")
            return self._simple_language_detection(text)

    def _simple_language_detection(self, text: str) -> Dict[str, Any]:
        """Simple language detection fallback"""
        try:
            from langdetect import detect, detect_langs

            if len(text.strip()) < 10:
                return {
                    "language": "en",
                    "confidence": 0.5,
                    "language_name": "English",
                    "method": "default",
                    "note": "Text too short for reliable detection",
                }

            # Get most likely language
            detected_lang = detect(text)

            # Get confidence scores
            lang_probs = detect_langs(text)
            confidence = 0.0

            for lang_prob in lang_probs:
                if lang_prob.lang == detected_lang:
                    confidence = lang_prob.prob
                    break

            return {
                "language": detected_lang,
                "confidence": confidence,
                "language_name": self.supported_languages.get(
                    detected_lang, detected_lang.upper()
                ),
                "method": "langdetect",
            }

        except Exception as e:
            logger.warning(f"Simple language detection failed: {e}")
            return {
                "language": "en",
                "confidence": 0.5,
                "language_name": "English",
                "method": "default",
            }

    def translate_text(
        self,
        text: str,
        target_language: str = "en",
        source_language: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Translate text to target language

        Args:
            text: Text to translate
            target_language: Target language code
            source_language: Source language code (auto-detect if None)

        Returns:
            Dictionary containing translated text and metadata
        """
        try:
            # Skip translation if target is same as source
            if source_language and source_language == target_language:
                return {
                    "translated_text": text,
                    "source_language": source_language,
                    "target_language": target_language,
                    "confidence": 1.0,
                    "method": "no_translation_needed",
                }

            if self.translate_client:
                return self._translate_with_google(
                    text, target_language, source_language
                )
            else:
                return self._mock_translation(text, target_language, source_language)

        except Exception as e:
            logger.error(f"Translation failed: {e}")
            return {
                "translated_text": text,  # Return original text on failure
                "source_language": source_language or "unknown",
                "target_language": target_language,
                "confidence": 0.0,
                "error": str(e),
                "method": "failed",
            }

    def _translate_with_google(
        self, text: str, target_language: str, source_language: Optional[str]
    ) -> Dict[str, Any]:
        """Translate using Google Translate API"""
        try:
            result = self.translate_client.translate(
                text, target_language=target_language, source_language=source_language
            )

            return {
                "translated_text": result["translatedText"],
                "source_language": (
                    result["detectedSourceLanguage"]
                    if source_language is None
                    else source_language
                ),
                "target_language": target_language,
                "confidence": 0.9,  # Google Translate is generally reliable
                "method": "google_translate",
            }

        except Exception as e:
            logger.error(f"Google Translate API failed: {e}")
            raise

    def _mock_translation(
        self, text: str, target_language: str, source_language: Optional[str]
    ) -> Dict[str, Any]:
        """Mock translation when API is not available"""
        logger.info("Using mock translation (API not available)")

        # Simple mock - just return original text with indication
        mock_prefix = ""
        if target_language != "en":
            mock_prefix = f"[Translated to {self.supported_languages.get(target_language, target_language)}] "

        return {
            "translated_text": mock_prefix + text,
            "source_language": source_language or "en",
            "target_language": target_language,
            "confidence": 0.8,
            "method": "mock_translation",
            "note": "Translation API not available - showing original text",
        }

    def is_translation_needed(
        self, detected_language: str, target_language: str = "en"
    ) -> bool:
        """Check if translation is needed"""
        return detected_language != target_language and detected_language != "unknown"

    def get_supported_languages(self) -> Dict[str, str]:
        """Get list of supported languages"""
        return self.supported_languages.copy()

    def is_language_supported(self, language_code: str) -> bool:
        """Check if language is supported"""
        return language_code in self.supported_languages

    def translate_business_content(
        self, content: str, target_language: str = "en"
    ) -> Dict[str, Any]:
        """
        Specialized translation for business content

        Args:
            content: Business content to translate
            target_language: Target language for translation

        Returns:
            Dictionary with translation results and metadata
        """
        try:
            # First detect the language
            detection_result = self.detect_language(content)
            source_language = detection_result["language"]

            # Check if translation is needed
            if not self.is_translation_needed(source_language, target_language):
                return {
                    "original_text": content,
                    "translated_text": content,
                    "source_language": source_language,
                    "target_language": target_language,
                    "translation_needed": False,
                    "detection_confidence": detection_result["confidence"],
                }

            # Perform translation
            translation_result = self.translate_text(
                content, target_language, source_language
            )

            return {
                "original_text": content,
                "translated_text": translation_result["translated_text"],
                "source_language": source_language,
                "target_language": target_language,
                "translation_needed": True,
                "detection_confidence": detection_result["confidence"],
                "translation_confidence": translation_result["confidence"],
                "translation_method": translation_result["method"],
            }

        except Exception as e:
            logger.error(f"Business content translation failed: {e}")
            return {
                "original_text": content,
                "translated_text": content,
                "source_language": "unknown",
                "target_language": target_language,
                "translation_needed": False,
                "error": str(e),
            }
