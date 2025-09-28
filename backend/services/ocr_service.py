"""
OCR service for processing handwritten notes, sketches, and PDFs
"""

from google.cloud import vision
from google import genai as gemini_sdk
from google.genai import types
import io
import logging
import os
import tempfile
import json
from pdf2image import convert_from_path
from PIL import Image
from flask import current_app
from utils.pdf_processor import PDFProcessor


class OCRService:
    def __init__(self):
        # Legacy Google Cloud Vision client
        self.vision_client = vision.ImageAnnotatorClient()

        # Gemini client for enhanced OCR
        self.gemini_client = None
        self.logger = logging.getLogger(__name__)

        # Initialize Gemini client if API key is available
        try:
            gemini_api_key = current_app.config.get("GEMINI_API_KEY")
            if gemini_api_key:
                os.environ["GEMINI_API_KEY"] = gemini_api_key
                self.gemini_client = gemini_sdk.Client(api_key=gemini_api_key)
                self.logger.info("Gemini client initialized successfully")
            else:
                self.logger.warning("GEMINI_API_KEY not found in configuration")
        except Exception as e:
            self.logger.error(f"Failed to initialize Gemini client: {str(e)}")

    def extract_text_from_image(self, image_path, use_gemini=True):
        """Extract text from handwritten notes or sketches"""
        try:
            if use_gemini and self.gemini_client:
                return self._gemini_vision_ocr(image_path)
            else:
                return self._google_vision_ocr(image_path)
        except Exception as e:
            self.logger.error(f"OCR processing failed: {str(e)}")
            return {"error": str(e)}

    def extract_text_from_pdf(self, pdf_path):
        """Extract text from PDF using Gemini Vision OCR"""
        try:
            if not self.gemini_client:
                return {"error": "Gemini client not initialized"}

            # Initialize PDF processor
            poppler_path = current_app.config.get("POPPLER_PATH")
            pdf_processor = PDFProcessor(poppler_path=poppler_path)

            # Validate Poppler installation
            if not pdf_processor.validate_poppler_installation():
                return {
                    "error": "Poppler installation not found or invalid. Please install Poppler and set POPPLER_PATH in configuration."
                }

            # Convert PDF pages to images
            pages = pdf_processor.convert_pdf_to_images(pdf_path)

            # Extract text from each page
            full_text_parts = []
            temp_files = []

            try:
                for i, page in enumerate(pages):
                    # Save page as temporary image with optimization
                    temp_file_path = pdf_processor.save_image_temporarily(page)
                    temp_files.append(temp_file_path)

                    # Perform OCR on the page
                    page_text = self._gemini_vision_ocr(temp_file_path)

                    if "error" in page_text:
                        self.logger.warning(
                            f"OCR failed for page {i+1}: {page_text['error']}"
                        )
                        full_text_parts.append(
                            f"[Page {i+1} OCR Error: {page_text['error']}]"
                        )
                    else:
                        full_text_parts.append(page_text["full_text"])

                raw_text_combined = "\n\n[PAGE BREAK]\n\n".join(full_text_parts)

                return {
                    "full_text": raw_text_combined,
                    "pages_processed": len(pages),
                    "confidence": 0.95,  # Gemini typically has high confidence
                }

            finally:
                # Clean up all temporary files
                for temp_file in temp_files:
                    pdf_processor.cleanup_temp_file(temp_file)

        except Exception as e:
            self.logger.error(f"PDF OCR processing failed: {str(e)}")
            return {"error": str(e)}

    def extract_structured_data(self, raw_text):
        """Extract structured data from raw OCR text using Gemini"""
        try:
            if not self.gemini_client:
                return {"error": "Gemini client not initialized"}

            # Define the extraction schema for business plans
            extraction_schema = types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "Entrepreneur_Name": types.Schema(
                        type=types.Type.STRING,
                        description="Extracted Name of the entrepreneur.",
                    ),
                    "Education_Status": types.Schema(
                        type=types.Type.STRING,
                        description="Extracted educational qualification.",
                    ),
                    "Phone_Number": types.Schema(
                        type=types.Type.STRING, description="Extracted phone number."
                    ),
                    "Business_Name": types.Schema(
                        type=types.Type.STRING, description="Name of the business."
                    ),
                    "Main_Product_Service": types.Schema(
                        type=types.Type.STRING,
                        description="Description of the main product or service provided.",
                    ),
                    "Key_USP": types.Schema(
                        type=types.Type.STRING,
                        description="The unique selling proposition or idea that is better than others.",
                    ),
                    "Loan_Requirement_First_Month_INR": types.Schema(
                        type=types.Type.INTEGER,
                        description="The loan requirement for the business setup phase (First Month) in INR.",
                    ),
                },
                required=["Entrepreneur_Name", "Business_Name", "Main_Product_Service"],
            )

            system_prompt = (
                "You are an expert financial analyst focused on business plan review. Your task is to extract "
                "key, structured data points from the provided raw OCR text which was taken from a handwritten "
                "entrepreneurship development program document. Only return the requested JSON object. "
                "If a field cannot be found, set its value to 'N/A' (except required fields)."
            )

            prompt = (
                f"Extract the following structured data from the provided raw OCR text:\n\n"
                f"--- RAW OCR TEXT ---\n{raw_text}\n--- END OF RAW OCR TEXT ---"
            )

            response = self.gemini_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    response_mime_type="application/json",
                    response_schema=extraction_schema,
                ),
            )

            return json.loads(response.text)

        except Exception as e:
            self.logger.error(f"Structured extraction failed: {str(e)}")
            return {"error": f"Structured extraction failed: {str(e)}"}

    def _gemini_vision_ocr(self, image_path):
        """Uses Gemini 2.5 Flash's multimodal capabilities to perform OCR on the image"""
        try:
            if not self.gemini_client:
                return {"error": "Gemini client not initialized"}

            # Read and prepare image
            with open(image_path, "rb") as image_file:
                image_data = image_file.read()

            vision_prompt = "Perform accurate OCR on the entire image, including all handwritten and printed text. Return only the raw text."

            contents = [
                vision_prompt,
                types.Part.from_bytes(data=image_data, mime_type="image/png"),
            ]

            response = self.gemini_client.models.generate_content(
                model="gemini-2.5-flash", contents=contents
            )

            return {
                "full_text": response.text,
                "confidence": 0.95,  # Gemini typically has high confidence
            }

        except Exception as e:
            self.logger.error(f"Gemini Vision OCR failed: {str(e)}")
            return {"error": f"Gemini Vision OCR failed: {str(e)}"}

    def _google_vision_ocr(self, image_path):
        """Legacy Google Cloud Vision OCR (fallback)"""
        try:
            with io.open(image_path, "rb") as image_file:
                content = image_file.read()

            image = vision.Image(content=content)

            # Perform text detection with handwriting recognition
            response = self.vision_client.document_text_detection(image=image)

            if response.error.message:
                raise Exception(f"OCR Error: {response.error.message}")

            # Extract full text
            full_text = response.full_text_annotation.text

            # Extract individual text blocks for structured analysis
            text_blocks = []
            for page in response.full_text_annotation.pages:
                for block in page.blocks:
                    block_text = ""
                    for paragraph in block.paragraphs:
                        for word in paragraph.words:
                            word_text = "".join(
                                [symbol.text for symbol in word.symbols]
                            )
                            block_text += word_text + " "
                    text_blocks.append(block_text.strip())

            return {
                "full_text": full_text,
                "text_blocks": text_blocks,
                "confidence": self._calculate_confidence(response),
            }

        except Exception as e:
            self.logger.error(f"Google Vision OCR processing failed: {str(e)}")
            return {"error": str(e)}

    def _calculate_confidence(self, response):
        """Calculate average confidence score for Google Vision"""
        confidences = []
        for page in response.full_text_annotation.pages:
            for block in page.blocks:
                confidences.append(block.confidence)

        return sum(confidences) / len(confidences) if confidences else 0.0
