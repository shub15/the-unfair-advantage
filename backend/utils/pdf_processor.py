"""
PDF processing utilities for The Unfair Advantage platform
"""

import os
import tempfile
from pdf2image import convert_from_path
from PIL import Image
import logging


class PDFProcessor:
    def __init__(self, poppler_path=None):
        self.poppler_path = poppler_path
        self.logger = logging.getLogger(__name__)

    def validate_poppler_installation(self):
        """Validate that Poppler is properly installed and accessible"""
        if not self.poppler_path:
            # Try to use system-wide Poppler installation
            return True

        if not os.path.isdir(self.poppler_path):
            return False

        # Check for required Poppler executables
        required_executables = (
            ["pdftoppm.exe", "pdftocairo.exe"]
            if os.name == "nt"
            else ["pdftoppm", "pdftocairo"]
        )

        for exe in required_executables:
            exe_path = os.path.join(self.poppler_path, exe)
            if not os.path.exists(exe_path):
                self.logger.warning(f"Poppler executable not found: {exe_path}")
                return False

        return True

    def convert_pdf_to_images(self, pdf_path, dpi=200):
        """Convert PDF pages to PIL Image objects"""
        try:
            if not self.validate_poppler_installation():
                raise Exception("Poppler installation not found or invalid")

            # Convert PDF to images
            if self.poppler_path:
                pages = convert_from_path(
                    pdf_path, dpi=dpi, poppler_path=self.poppler_path
                )
            else:
                pages = convert_from_path(pdf_path, dpi=dpi)

            self.logger.info(f"Successfully converted PDF to {len(pages)} images")
            return pages

        except Exception as e:
            self.logger.error(f"Failed to convert PDF to images: {str(e)}")
            raise

    def optimize_image_for_ocr(self, image):
        """Optimize image for better OCR results"""
        try:
            # Convert to RGB if necessary
            if image.mode != "RGB":
                image = image.convert("RGB")

            # Resize if too large (maintain aspect ratio)
            max_dimension = 2048
            if max(image.size) > max_dimension:
                ratio = max_dimension / max(image.size)
                new_size = tuple(int(dim * ratio) for dim in image.size)
                image = image.resize(new_size, Image.Resampling.LANCZOS)

            return image

        except Exception as e:
            self.logger.error(f"Failed to optimize image: {str(e)}")
            return image

    def save_image_temporarily(self, image, format="PNG"):
        """Save PIL Image to a temporary file and return the path"""
        try:
            with tempfile.NamedTemporaryFile(
                delete=False, suffix=f".{format.lower()}"
            ) as tmp_file:
                optimized_image = self.optimize_image_for_ocr(image)
                optimized_image.save(tmp_file.name, format)
                return tmp_file.name

        except Exception as e:
            self.logger.error(f"Failed to save image temporarily: {str(e)}")
            raise

    def cleanup_temp_file(self, file_path):
        """Safely remove temporary file"""
        try:
            if os.path.exists(file_path):
                os.unlink(file_path)
                self.logger.debug(f"Cleaned up temporary file: {file_path}")
        except Exception as e:
            self.logger.warning(
                f"Failed to cleanup temporary file {file_path}: {str(e)}"
            )
