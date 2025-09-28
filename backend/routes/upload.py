"""
Upload routes for handling various file types
"""

from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
import os
import uuid
import time
from datetime import datetime

from services.ocr_service import OCRService
from services.speech_service import SpeechService
from services.user_service import UserService
from services.business_analysis_service import BusinessAnalysisService
from utils.validators import validate_file_type, validate_file_size
from middleware.auth import require_auth, optional_auth, get_current_user
from models.user import ProcessedDocument

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
@optional_auth
def upload_audio():
    """Handle audio upload for speech-to-text processing with structured data extraction"""
    start_time = time.time()
    file_path = None

    try:
        if "file" not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file = request.files["file"]
        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400

        if not validate_file_type(
            file.filename, ["mp3", "wav", "ogg", "mp4", "m4a", "flac"]
        ):
            return jsonify({"error": "Invalid audio file type"}), 400

        # Check file size
        if not validate_file_size(file):
            return jsonify({"error": "File size too large"}), 400

        # Save file
        filename = secure_filename(file.filename)
        file_path = os.path.join(current_app.config["UPLOAD_FOLDER"], filename)
        file.save(file_path)

        # Get file size for storage tracking
        file_size = os.path.getsize(file_path)

        # Process with Speech-to-Text
        speech_service = SpeechService()
        language_code = request.form.get("language", "en-IN")
        transcription_result = speech_service.transcribe_audio(file_path, language_code)

        # Clean up file
        if os.path.exists(file_path):
            os.remove(file_path)

        if "error" in transcription_result:
            return jsonify(transcription_result), 500

        # Extract structured data from transcript using OCR service
        ocr_service = OCRService()
        structured_data = ocr_service.extract_structured_data(
            transcription_result["full_transcript"]
        )

        # Perform comprehensive business analysis
        business_service = BusinessAnalysisService()

        # Transform structured data to comprehensive format for analysis
        comprehensive_business_data = (
            business_service.analyze_business_from_single_source(structured_data)
        )

        # Calculate business score
        business_score = business_service.calculate_comprehensive_business_score(
            comprehensive_business_data
        )

        # Generate comprehensive business case
        business_case = business_service.generate_comprehensive_business_case(
            comprehensive_business_data,
            business_score,
            {},  # No OCR data for audio-only upload
            transcription_result["full_transcript"],
        )

        submission_id = str(uuid.uuid4())
        processing_time = time.time() - start_time

        # Store document in user's history if authenticated
        current_user = get_current_user()
        if current_user:
            user_service = UserService()
            processed_doc = ProcessedDocument(
                id=submission_id,
                original_filename=file.filename,
                file_type="audio",
                upload_timestamp=datetime.now(),
                processing_method=transcription_result.get(
                    "processing_method", "speech_to_text"
                ),
                raw_text=transcription_result["full_transcript"],
                structured_data=structured_data,
                confidence=(
                    transcription_result["transcriptions"][0]["confidence"]
                    if transcription_result["transcriptions"]
                    else 0
                ),
                pages_processed=1,  # Audio as single "page"
                file_size=file_size,
                processing_time=processing_time,
                ocr_metadata={
                    "audio_processing": True,
                    "detected_language": transcription_result["detected_language"],
                    "duration_seconds": transcription_result.get("duration_seconds", 0),
                    "language_code": language_code,
                    "business_score": business_score,
                },
            )

            # Save to user's document history
            user_service.add_processed_document(current_user, processed_doc)

        response_data = {
            "submission_id": submission_id,
            "transcript": transcription_result["full_transcript"],
            "structured_data": structured_data,
            # "comprehensive_business_data": comprehensive_business_data,
            # "business_score": business_score,
            # "business_case": business_case,
            "detected_language": transcription_result["detected_language"],
            "confidence": (
                transcription_result["transcriptions"][0]["confidence"]
                if transcription_result["transcriptions"]
                else 0
            ),
            "processing_method": transcription_result.get(
                "processing_method", "speech_to_text"
            ),
            "duration_seconds": transcription_result.get("duration_seconds", 0),
            "processing_time": f"{processing_time:.2f}s",
            "file_size": file_size,
            "status": "analyzed",
        }

        # Add user info if authenticated
        if current_user:
            response_data["saved_to_history"] = True
            response_data["user_id"] = current_user._id

        return jsonify(response_data), 200

    except Exception as e:
        # Ensure cleanup on any error
        try:
            if file_path and os.path.exists(file_path):
                os.remove(file_path)
        except:
            pass
        return jsonify({"error": str(e)}), 500


@upload_bp.route("/pdf", methods=["POST"])
@optional_auth
def upload_pdf():
    """Handle PDF upload for OCR processing and structured data extraction"""
    start_time = time.time()
    file_path = None

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

        # Check file size
        if not validate_file_size(file):
            return jsonify({"error": "File size too large"}), 400

        # Save file temporarily
        filename = secure_filename(file.filename)
        file_path = os.path.join(current_app.config["UPLOAD_FOLDER"], filename)
        file.save(file_path)

        # Get file size for storage tracking
        file_size = os.path.getsize(file_path)

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

        # Perform comprehensive business analysis
        business_service = BusinessAnalysisService()

        # Transform structured data to comprehensive format for analysis
        comprehensive_business_data = (
            business_service.analyze_business_from_single_source(structured_data)
        )

        # Calculate business score
        business_score = business_service.calculate_comprehensive_business_score(
            comprehensive_business_data
        )

        # Generate comprehensive business case
        business_case = business_service.generate_comprehensive_business_case(
            comprehensive_business_data,
            business_score,
            structured_data,
            "",  # No transcript for PDF-only upload
        )

        # Clean up file
        if os.path.exists(file_path):
            os.remove(file_path)

        submission_id = str(uuid.uuid4())
        processing_time = time.time() - start_time

        # Store document in user's history if authenticated
        current_user = get_current_user()
        if current_user:
            user_service = UserService()
            processed_doc = ProcessedDocument(
                id=submission_id,
                original_filename=file.filename,
                file_type="pdf",
                upload_timestamp=datetime.now(),
                processing_method="gemini_vision_ocr",
                raw_text=ocr_result["full_text"],
                structured_data=structured_data,
                confidence=ocr_result.get("confidence", 0),
                pages_processed=ocr_result.get("pages_processed", 0),
                file_size=file_size,
                processing_time=processing_time,
                ocr_metadata={
                    "pages_processed": ocr_result.get("pages_processed", 0),
                    "processing_method": "gemini_vision_ocr",
                    "file_type": "pdf",
                },
            )

            # Save to user's document history
            user_service.add_processed_document(current_user, processed_doc)

        response_data = {
            "submission_id": submission_id,
            "raw_text": ocr_result["full_text"],
            "structured_data": structured_data,
            # "comprehensive_business_data": comprehensive_business_data,
            # "business_score": business_score,
            # "business_case": business_case,
            "pages_processed": ocr_result.get("pages_processed", 0),
            "confidence": ocr_result.get("confidence", 0),
            "processing_time": f"{processing_time:.2f}s",
            "file_size": file_size,
            "status": "analyzed",
        }

        # Add user info if authenticated
        if current_user:
            response_data["saved_to_history"] = True
            response_data["user_id"] = current_user._id

        return jsonify(response_data), 200

    except Exception as e:
        # Ensure cleanup on any error
        try:
            if file_path and os.path.exists(file_path):
                os.remove(file_path)
        except:
            pass
        return jsonify({"error": str(e)}), 500


@upload_bp.route("/image/structured", methods=["POST"])
@optional_auth
def upload_image_structured():
    """Handle image upload for OCR processing with structured data extraction"""
    start_time = time.time()
    file_path = None

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

        # Get file size for storage tracking
        file_size = os.path.getsize(file_path)

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

        # Perform comprehensive business analysis
        business_service = BusinessAnalysisService()

        # Transform structured data to comprehensive format for analysis
        comprehensive_business_data = (
            business_service.analyze_business_from_single_source(structured_data)
        )

        # Calculate business score
        business_score = business_service.calculate_comprehensive_business_score(
            comprehensive_business_data
        )

        # Generate comprehensive business case
        business_case = business_service.generate_comprehensive_business_case(
            comprehensive_business_data,
            business_score,
            structured_data,
            "",  # No transcript for image-only upload
        )

        # Clean up file
        if os.path.exists(file_path):
            os.remove(file_path)

        submission_id = str(uuid.uuid4())
        processing_time = time.time() - start_time
        ocr_method = "gemini" if use_gemini else "google_vision"

        # Store document in user's history if authenticated
        current_user = get_current_user()
        if current_user:
            user_service = UserService()
            processed_doc = ProcessedDocument(
                id=submission_id,
                original_filename=file.filename,
                file_type="image",
                upload_timestamp=datetime.now(),
                processing_method=ocr_method,
                raw_text=ocr_result["full_text"],
                structured_data=structured_data,
                confidence=ocr_result["confidence"],
                pages_processed=1,  # Single image
                file_size=file_size,
                processing_time=processing_time,
                ocr_metadata={
                    "image_processing": True,
                    "ocr_method": ocr_method,
                    "use_gemini": use_gemini,
                },
            )

            # Save to user's document history
            user_service.add_processed_document(current_user, processed_doc)

        response_data = {
            "submission_id": submission_id,
            "raw_text": ocr_result["full_text"],
            "structured_data": structured_data,
            # "comprehensive_business_data": comprehensive_business_data,
            # "business_score": business_score,
            # "business_case": business_case,
            "confidence": ocr_result["confidence"],
            "ocr_method": ocr_method,
            "processing_time": f"{processing_time:.2f}s",
            "file_size": file_size,
            "status": "analyzed",
        }

        # Add user info if authenticated
        if current_user:
            response_data["saved_to_history"] = True
            response_data["user_id"] = current_user._id

        return jsonify(response_data), 200

    except Exception as e:
        # Ensure cleanup on any error
        try:
            if "file_path" in locals() and os.path.exists(file_path):
                os.remove(file_path)
        except:
            pass
        return jsonify({"error": str(e)}), 500


@upload_bp.route("/comprehensive", methods=["POST"])
@optional_auth
def upload_comprehensive():
    """Handle combined document and audio upload for comprehensive business analysis"""
    start_time = time.time()
    file_paths = []

    try:
        # Initialize services
        ocr_service = OCRService()
        speech_service = SpeechService()
        business_service = BusinessAnalysisService()

        ocr_data = {}
        transcript = ""
        language_code = request.form.get("language", "en-IN")

        # Process document if provided
        if "document" in request.files:
            doc_file = request.files["document"]
            if doc_file.filename != "":
                if not validate_file_type(
                    doc_file.filename, ["pdf", "png", "jpg", "jpeg"]
                ):
                    return jsonify({"error": "Invalid document file type"}), 400

                # Save document temporarily
                doc_filename = secure_filename(doc_file.filename)
                doc_path = os.path.join(
                    current_app.config["UPLOAD_FOLDER"], doc_filename
                )
                doc_file.save(doc_path)
                file_paths.append(doc_path)

                # Process document based on type
                if doc_filename.lower().endswith(".pdf"):
                    ocr_result = ocr_service.extract_text_from_pdf(doc_path)
                else:
                    ocr_result = ocr_service.extract_text_from_image(doc_path)

                if "error" not in ocr_result:
                    ocr_data = ocr_service.extract_structured_data(
                        ocr_result["full_text"]
                    )

        # Process audio if provided
        if "audio" in request.files:
            audio_file = request.files["audio"]
            if audio_file.filename != "":
                if not validate_file_type(
                    audio_file.filename, ["wav", "mp3", "m4a", "flac"]
                ):
                    return jsonify({"error": "Invalid audio file type"}), 400

                # Save audio temporarily
                audio_filename = secure_filename(audio_file.filename)
                audio_path = os.path.join(
                    current_app.config["UPLOAD_FOLDER"], audio_filename
                )
                audio_file.save(audio_path)
                file_paths.append(audio_path)

                # Process audio
                speech_result = speech_service.transcribe_audio(
                    audio_path, language_code
                )
                if "error" not in speech_result:
                    transcript = speech_result["full_transcript"]

        # Perform comprehensive business analysis
        if ocr_data or transcript:
            comprehensive_business_data = (
                business_service.extract_comprehensive_business_info(
                    ocr_data, transcript, language_code
                )
            )

            # Calculate business score
            business_score = business_service.calculate_comprehensive_business_score(
                comprehensive_business_data
            )

            # Generate comprehensive business case
            business_case = business_service.generate_comprehensive_business_case(
                comprehensive_business_data, business_score, ocr_data, transcript
            )
        else:
            return jsonify({"error": "No valid document or audio data provided"}), 400

        # Clean up all temporary files
        for path in file_paths:
            if os.path.exists(path):
                os.remove(path)

        submission_id = str(uuid.uuid4())
        processing_time = time.time() - start_time

        # Store comprehensive analysis in user's history if authenticated
        current_user = get_current_user()
        if current_user:
            user_service = UserService()
            processed_doc = ProcessedDocument(
                id=submission_id,
                original_filename="comprehensive_analysis",
                file_type="comprehensive",
                upload_timestamp=datetime.now(),
                processing_method="comprehensive_gemini_analysis",
                raw_text=f"OCR: {ocr_data.get('raw_text', '')} | Transcript: {transcript}",
                structured_data=comprehensive_business_data,
                confidence=business_score.get("percentage", 0) / 100,
                pages_processed=1,
                file_size=sum(
                    os.path.getsize(path) for path in file_paths if os.path.exists(path)
                ),
                processing_time=processing_time,
                ocr_metadata={
                    "analysis_type": "comprehensive",
                    "has_document": bool(ocr_data),
                    "has_audio": bool(transcript),
                    "language_code": language_code,
                    "business_score": business_score,
                },
            )

            user_service.add_processed_document(current_user, processed_doc)

        response_data = {
            "submission_id": submission_id,
            "comprehensive_business_data": comprehensive_business_data,
            "business_score": business_score,
            "business_case": business_case,
            "ocr_data": ocr_data if ocr_data else None,
            "transcript": transcript if transcript else None,
            "language_code": language_code,
            "processing_time": f"{processing_time:.2f}s",
            "status": "comprehensive_analysis_complete",
        }

        # Add user info if authenticated
        if current_user:
            response_data["saved_to_history"] = True
            response_data["user_id"] = current_user._id

        return jsonify(response_data), 200

    except Exception as e:
        # Ensure cleanup on any error
        for path in file_paths:
            try:
                if os.path.exists(path):
                    os.remove(path)
            except:
                pass
        return jsonify({"error": str(e)}), 500


@upload_bp.route("/test/dummy", methods=["POST"])
def upload_test_dummy():
    """Test endpoint with dummy OCR data for development and testing"""
    try:
        # Generate unique ID for this submission
        submission_id = str(uuid.uuid4())

        # Sample dummy data based on the provided example
        dummy_data = {
            "submission_id": submission_id,
            "confidence": 0.95,
            "pages_processed": 11,
            "raw_text": """Accelerated Entrepreneurship Development Program for Nano Unicorns

                Business Plan

                Participant Profile

                Name
                PRADEEP SINHA

                Education
                I.T.I (Industrial Training Institute)

                Phone Number
                +91 9876543210

                Business Name
                PRA DEEP MOBILE

                Product/Service
                Mobile Phone Repair Services
                - Display change
                - Microphone change
                - Circuit board change
                - On/off button and flex cable repair
                - Charging port repair
                - Touch screen replacement
                - Microphone jumper repair

                Unique Selling Proposition
                Beautiful product at affordable price, new items compared to market. 
                Customer relations via PhonePay, UPI, Paytm, GPay. 
                High quality and high-level USP, committed to excellence to impress people.

                Loan Requirement
                First Month Setup: ₹99,000

                Market Analysis
                Growing demand for mobile repair services in tier-2 and tier-3 cities.
                Increasing smartphone penetration creates consistent demand.

                Financial Projections
                Monthly Revenue Target: ₹45,000-60,000
                Break-even: 3-4 months
                ROI Expected: 35-40% annually""",
            "status": "ready_for_evaluation",
            "structured_data": {
                "Business_Name": "PRA DEEP MOBILE",
                "Education_Status": "I.T.I",
                "Entrepreneur_Name": "PRADEEP SINHA",
                "Key_USP": "Beautiful product at affordable price, new items compared to market. Customer relations via PhonePay, UPI, Paytm, GPay. High quality and high-level USP, committed to excellence to impress people.",
                "Loan_Requirement_First_Month_INR": 99000,
                "Main_Product_Service": "Mobile Phone Repair Services: Display change, mic change, circuit board change, on/off button repair, charging port repair, touch screen replacement, microphone jumper repair",
                "Phone_Number": "+91 9876543210",
            },
            "ocr_method": "dummy_data",
            "test_mode": True,
        }

        # Optional: Allow customization via request parameters
        request_data = request.get_json() if request.is_json else {}

        # Override entrepreneur name if provided
        if request_data and "entrepreneur_name" in request_data:
            dummy_data["structured_data"]["Entrepreneur_Name"] = request_data[
                "entrepreneur_name"
            ]

        # Override business name if provided
        if request_data and "business_name" in request_data:
            dummy_data["structured_data"]["Business_Name"] = request_data[
                "business_name"
            ]

        # Override loan amount if provided
        if request_data and "loan_amount" in request_data:
            try:
                dummy_data["structured_data"]["Loan_Requirement_First_Month_INR"] = int(
                    request_data["loan_amount"]
                )
            except (ValueError, TypeError):
                pass  # Keep default value if conversion fails

        return jsonify(dummy_data), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@upload_bp.route("/test/dummy/multiple", methods=["POST"])
def upload_test_dummy_multiple():
    """Test endpoint with multiple dummy business plan samples"""
    try:
        # Get the sample type from request (default to 'mobile_repair')
        request_data = request.get_json() if request.is_json else {}
        sample_type = request_data.get("sample_type", "mobile_repair")

        # Different dummy data samples
        samples = {
            "mobile_repair": {
                "Business_Name": "PRA DEEP MOBILE",
                "Education_Status": "I.T.I",
                "Entrepreneur_Name": "PRADEEP SINHA",
                "Key_USP": "Beautiful product at affordable price, customer relations via digital payments, high quality service",
                "Loan_Requirement_First_Month_INR": 99000,
                "Main_Product_Service": "Mobile Phone Repair Services",
                "Phone_Number": "+91 9876543210",
            },
            "food_truck": {
                "Business_Name": "SPICE WHEELS",
                "Education_Status": "Hotel Management Diploma",
                "Entrepreneur_Name": "ANJALI SHARMA",
                "Key_USP": "Authentic regional cuisine on wheels, hygienic food preparation, eco-friendly packaging",
                "Loan_Requirement_First_Month_INR": 150000,
                "Main_Product_Service": "Mobile Food Truck - Regional Indian Cuisine",
                "Phone_Number": "+91 8765432109",
            },
            "tailoring": {
                "Business_Name": "FASHION CRAFT",
                "Education_Status": "Fashion Design Certificate",
                "Entrepreneur_Name": "MEERA DEVI",
                "Key_USP": "Custom tailoring for women, traditional and modern designs, quick turnaround time",
                "Loan_Requirement_First_Month_INR": 75000,
                "Main_Product_Service": "Ladies Tailoring and Boutique Services",
                "Phone_Number": "+91 7654321098",
            },
            "agriculture": {
                "Business_Name": "GREEN HARVEST",
                "Education_Status": "B.Sc Agriculture",
                "Entrepreneur_Name": "RAVI KUMAR",
                "Key_USP": "Organic farming techniques, direct farmer-to-consumer sales, sustainable practices",
                "Loan_Requirement_First_Month_INR": 200000,
                "Main_Product_Service": "Organic Vegetable Farming and Direct Sales",
                "Phone_Number": "+91 6543210987",
            },
        }

        # Get the selected sample or default to mobile repair
        selected_sample = samples.get(sample_type, samples["mobile_repair"])

        # Generate response
        submission_id = str(uuid.uuid4())

        dummy_data = {
            "submission_id": submission_id,
            "confidence": 0.95,
            "pages_processed": 8,
            "raw_text": f"""Accelerated Entrepreneurship Development Program
                Business Plan

                Participant Profile:
                Name: {selected_sample['Entrepreneur_Name']}
                Education: {selected_sample['Education_Status']}
                Phone: {selected_sample['Phone_Number']}

                Business Details:
                Business Name: {selected_sample['Business_Name']}
                Product/Service: {selected_sample['Main_Product_Service']}
                USP: {selected_sample['Key_USP']}
                Loan Requirement: ₹{selected_sample['Loan_Requirement_First_Month_INR']:,}""",
            "status": "ready_for_evaluation",
            "structured_data": selected_sample,
            "ocr_method": "dummy_data",
            "test_mode": True,
            "sample_type": sample_type,
        }

        return jsonify(dummy_data), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@upload_bp.route("/test/frontend", methods=["POST", "GET"])
def upload_test_frontend():
    """
    Frontend-friendly test endpoint with various testing scenarios
    Supports both GET and POST methods for easy frontend testing
    """
    import time
    import random

    try:
        # Get parameters from either JSON body or query params
        if request.method == "POST" and request.is_json:
            params = request.get_json() or {}
        else:
            params = dict(request.args)

        # Test parameters
        scenario = params.get("scenario", "success")  # success, error, slow, partial
        delay = float(params.get("delay", 0))  # Simulate processing delay
        sample_type = params.get("sample_type", "mobile_repair")

        # Add artificial delay for testing loading states
        if delay > 0:
            time.sleep(min(delay, 5))  # Max 5 seconds for safety

        # Generate submission ID
        submission_id = str(uuid.uuid4())

        # Different test scenarios
        if scenario == "error":
            error_messages = [
                "File format not supported",
                "Image quality too low for OCR",
                "PDF file is corrupted",
                "Service temporarily unavailable",
                "File size exceeds limit",
            ]
            return (
                jsonify(
                    {
                        "error": random.choice(error_messages),
                        "submission_id": submission_id,
                        "timestamp": time.time(),
                    }
                ),
                400,
            )

        elif scenario == "slow":
            # Simulate slow processing with random delay
            time.sleep(random.uniform(2, 4))

        # Sample business data for different types
        samples = {
            "mobile_repair": {
                "Business_Name": "PRA DEEP MOBILE",
                "Education_Status": "I.T.I",
                "Entrepreneur_Name": "PRADEEP SINHA",
                "Key_USP": "Beautiful product at affordable price, customer relations via digital payments",
                "Loan_Requirement_First_Month_INR": 99000,
                "Main_Product_Service": "Mobile Phone Repair Services",
                "Phone_Number": "+91 9876543210",
            },
            "food_truck": {
                "Business_Name": "SPICE WHEELS",
                "Education_Status": "Hotel Management Diploma",
                "Entrepreneur_Name": "ANJALI SHARMA",
                "Key_USP": "Authentic regional cuisine, hygienic preparation, eco-friendly packaging",
                "Loan_Requirement_First_Month_INR": 150000,
                "Main_Product_Service": "Mobile Food Truck - Regional Indian Cuisine",
                "Phone_Number": "+91 8765432109",
            },
            "tailoring": {
                "Business_Name": "FASHION CRAFT",
                "Education_Status": "Fashion Design Certificate",
                "Entrepreneur_Name": "MEERA DEVI",
                "Key_USP": "Custom tailoring, traditional and modern designs, quick turnaround",
                "Loan_Requirement_First_Month_INR": 75000,
                "Main_Product_Service": "Ladies Tailoring and Boutique Services",
                "Phone_Number": "+91 7654321098",
            },
            "tech_startup": {
                "Business_Name": "SMART SOLUTIONS",
                "Education_Status": "B.Tech Computer Science",
                "Entrepreneur_Name": "RAHUL VERMA",
                "Key_USP": "AI-powered solutions, cost-effective automation, 24/7 support",
                "Loan_Requirement_First_Month_INR": 300000,
                "Main_Product_Service": "Software Development and IT Consulting",
                "Phone_Number": "+91 9988776655",
            },
        }

        # Get selected sample
        selected_sample = samples.get(sample_type, samples["mobile_repair"])

        # Build response based on scenario
        confidence = 0.95 if scenario != "partial" else random.uniform(0.6, 0.8)
        pages_processed = random.randint(1, 15) if scenario != "partial" else 1

        # Simulate partial OCR for "partial" scenario
        if scenario == "partial":
            selected_sample["Phone_Number"] = "N/A"
            selected_sample["Education_Status"] = "N/A"

        # Create response
        response_data = {
            "submission_id": submission_id,
            "confidence": round(confidence, 2),
            "pages_processed": pages_processed,
            "raw_text": f"""Accelerated Entrepreneurship Development Program
Business Plan

Participant Profile:
Name: {selected_sample['Entrepreneur_Name']}
Education: {selected_sample['Education_Status']}
Phone: {selected_sample['Phone_Number']}

Business Details:
Business Name: {selected_sample['Business_Name']}
Product/Service: {selected_sample['Main_Product_Service']}
USP: {selected_sample['Key_USP']}
Loan Requirement: ₹{selected_sample['Loan_Requirement_First_Month_INR']:,}

Market Analysis:
Target customers identified with growing demand.
Competitive advantage through quality and pricing.

Financial Projections:
Expected monthly revenue: ₹{selected_sample['Loan_Requirement_First_Month_INR'] // 2:,}
Break-even period: 4-6 months
ROI projection: 30-45% annually""",
            "status": "ready_for_evaluation",
            "structured_data": selected_sample,
            "ocr_method": "frontend_test",
            "test_mode": True,
            "scenario": scenario,
            "sample_type": sample_type,
            "processing_time": f"{delay + (2 if scenario == 'slow' else 0.5):.1f}s",
            "timestamp": time.time(),
        }

        return jsonify(response_data), 200

    except Exception as e:
        return (
            jsonify(
                {
                    "error": f"Test endpoint error: {str(e)}",
                    "test_mode": True,
                    "timestamp": time.time(),
                }
            ),
            500,
        )


@upload_bp.route("/test/frontend/info", methods=["GET"])
def test_frontend_info():
    """
    Information endpoint for frontend developers
    Shows available test scenarios and parameters
    """
    return (
        jsonify(
            {
                "endpoint": "/api/upload/test/frontend",
                "description": "Frontend-friendly test endpoint for development and testing",
                "methods": ["GET", "POST"],
                "parameters": {
                    "scenario": {
                        "type": "string",
                        "options": ["success", "error", "slow", "partial"],
                        "default": "success",
                        "description": "Test scenario to simulate",
                    },
                    "sample_type": {
                        "type": "string",
                        "options": [
                            "mobile_repair",
                            "food_truck",
                            "tailoring",
                            "tech_startup",
                        ],
                        "default": "mobile_repair",
                        "description": "Type of business plan sample",
                    },
                    "delay": {
                        "type": "number",
                        "range": "0-5",
                        "default": 0,
                        "description": "Artificial delay in seconds (for testing loading states)",
                    },
                },
                "examples": {
                    "success": "/api/upload/test/frontend?scenario=success&sample_type=food_truck",
                    "error": "/api/upload/test/frontend?scenario=error",
                    "slow": "/api/upload/test/frontend?scenario=slow&delay=3",
                    "partial": "/api/upload/test/frontend?scenario=partial&sample_type=tech_startup",
                },
                "curl_examples": [
                    'curl "http://localhost:5000/api/upload/test/frontend"',
                    'curl "http://localhost:5000/api/upload/test/frontend?scenario=error"',
                    'curl -X POST -H "Content-Type: application/json" -d \'{"scenario": "slow", "delay": 2}\' "http://localhost:5000/api/upload/test/frontend"',
                ],
            }
        ),
        200,
    )
