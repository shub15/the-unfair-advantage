"""
Upload routes for handling various file types
"""

from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
import os
import uuid

from services.ocr_service import OCRService
from services.speech_service import SpeechService
from utils.validators import validate_file_type, validate_file_size

upload_bp = Blueprint("upload", __name__)


@upload_bp.route("/text", methods=["POST"])
def upload_text():
    """Handle direct text input"""
    try:
        data = request.get_json()
        if not data or "text" not in data:
            return jsonify({"error": "Text content required"}), 400

        # Generate unique ID for this submission
        submission_id = str(uuid.uuid4())

        return (
            jsonify(
                {
                    "submission_id": submission_id,
                    "text": data["text"],
                    "language": data.get("language", "en"),
                    "status": "ready_for_evaluation",
                }
            ),
            200,
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@upload_bp.route("/image", methods=["POST"])
def upload_image():
    """Handle image upload for OCR processing"""
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file = request.files["file"]
        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400

        if not validate_file_type(file.filename, ["png", "jpg", "jpeg"]):
            return jsonify({"error": "Invalid file type"}), 400

        # Save file
        filename = secure_filename(file.filename)
        file_path = os.path.join(current_app.config["UPLOAD_FOLDER"], filename)
        file.save(file_path)

        # Process with OCR
        ocr_service = OCRService()
        ocr_result = ocr_service.extract_text_from_image(file_path)

        # Clean up file
        os.remove(file_path)

        if "error" in ocr_result:
            return jsonify(ocr_result), 500

        submission_id = str(uuid.uuid4())

        return (
            jsonify(
                {
                    "submission_id": submission_id,
                    "extracted_text": ocr_result["full_text"],
                    "confidence": ocr_result["confidence"],
                    "status": "ready_for_evaluation",
                }
            ),
            200,
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@upload_bp.route("/audio", methods=["POST"])
def upload_audio():
    """Handle audio upload for speech-to-text processing"""
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file = request.files["file"]
        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400

        if not validate_file_type(file.filename, ["mp3", "wav", "ogg", "m4a"]):
            return jsonify({"error": "Invalid audio file type"}), 400

        # Save file
        filename = secure_filename(file.filename)
        file_path = os.path.join(current_app.config["UPLOAD_FOLDER"], filename)
        file.save(file_path)

        # Process with Speech-to-Text
        speech_service = SpeechService()
        language_code = request.form.get("language", "en-IN")
        transcription_result = speech_service.transcribe_audio(file_path, language_code)

        # Clean up file
        os.remove(file_path)

        if "error" in transcription_result:
            return jsonify(transcription_result), 500

        submission_id = str(uuid.uuid4())

        return (
            jsonify(
                {
                    "submission_id": submission_id,
                    "transcript": transcription_result["full_transcript"],
                    "detected_language": transcription_result["detected_language"],
                    "confidence": (
                        transcription_result["transcriptions"][0]["confidence"]
                        if transcription_result["transcriptions"]
                        else 0
                    ),
                    "status": "ready_for_evaluation",
                }
            ),
            200,
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@upload_bp.route("/pdf", methods=["POST"])
def upload_pdf():
    """Handle PDF upload for OCR processing and structured data extraction"""
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file = request.files["file"]
        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400

        if not validate_file_type(file.filename, ["pdf"]):
            return (
                jsonify({"error": "Invalid file type. Only PDF files are allowed."}),
                400,
            )

        # Check file size (optional)
        if not validate_file_size(file):
            return jsonify({"error": "File size too large"}), 400

        # Save file temporarily
        filename = secure_filename(file.filename)
        file_path = os.path.join(current_app.config["UPLOAD_FOLDER"], filename)
        file.save(file_path)

        # Process with OCR
        ocr_service = OCRService()
        ocr_result = ocr_service.extract_text_from_pdf(file_path)

        if "error" in ocr_result:
            # Clean up file before returning error
            if os.path.exists(file_path):
                os.remove(file_path)
            return jsonify(ocr_result), 500

        # Extract structured data from OCR text
        structured_data = ocr_service.extract_structured_data(ocr_result["full_text"])

        # Clean up file
        if os.path.exists(file_path):
            os.remove(file_path)

        submission_id = str(uuid.uuid4())

        return (
            jsonify(
                {
                    "submission_id": submission_id,
                    "raw_text": ocr_result["full_text"],
                    "structured_data": structured_data,
                    "pages_processed": ocr_result.get("pages_processed", 0),
                    "confidence": ocr_result.get("confidence", 0),
                    "status": "ready_for_evaluation",
                }
            ),
            200,
        )

    except Exception as e:
        # Ensure cleanup on any error
        try:
            if "file_path" in locals() and os.path.exists(file_path):
                os.remove(file_path)
        except:
            pass
        return jsonify({"error": str(e)}), 500


@upload_bp.route("/image/structured", methods=["POST"])
def upload_image_structured():
    """Handle image upload for OCR processing with structured data extraction"""
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file = request.files["file"]
        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400

        if not validate_file_type(file.filename, ["png", "jpg", "jpeg"]):
            return jsonify({"error": "Invalid file type"}), 400

        # Save file
        filename = secure_filename(file.filename)
        file_path = os.path.join(current_app.config["UPLOAD_FOLDER"], filename)
        file.save(file_path)

        # Process with OCR (using Gemini by default)
        ocr_service = OCRService()
        use_gemini = request.form.get("use_gemini", "true").lower() == "true"
        ocr_result = ocr_service.extract_text_from_image(
            file_path, use_gemini=use_gemini
        )

        if "error" in ocr_result:
            # Clean up file before returning error
            if os.path.exists(file_path):
                os.remove(file_path)
            return jsonify(ocr_result), 500

        # Extract structured data from OCR text
        structured_data = ocr_service.extract_structured_data(ocr_result["full_text"])

        # Clean up file
        if os.path.exists(file_path):
            os.remove(file_path)

        submission_id = str(uuid.uuid4())

        return (
            jsonify(
                {
                    "submission_id": submission_id,
                    "raw_text": ocr_result["full_text"],
                    "structured_data": structured_data,
                    "confidence": ocr_result["confidence"],
                    "ocr_method": "gemini" if use_gemini else "google_vision",
                    "status": "ready_for_evaluation",
                }
            ),
            200,
        )

    except Exception as e:
        # Ensure cleanup on any error
        try:
            if "file_path" in locals() and os.path.exists(file_path):
                os.remove(file_path)
        except:
            pass
        return jsonify({"error": str(e)}), 500
