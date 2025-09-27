"""
OCR service for processing handwritten notes and sketches
"""

from google.cloud import vision
import io
import logging

class OCRService:
    def __init__(self):
        self.client = vision.ImageAnnotatorClient()
        self.logger = logging.getLogger(__name__)
    
    def extract_text_from_image(self, image_path):
        """Extract text from handwritten notes or sketches"""
        try:
            with io.open(image_path, 'rb') as image_file:
                content = image_file.read()
            
            image = vision.Image(content=content)
            
            # Perform text detection with handwriting recognition
            response = self.client.document_text_detection(image=image)
            
            if response.error.message:
                raise Exception(f'OCR Error: {response.error.message}')
            
            # Extract full text
            full_text = response.full_text_annotation.text
            
            # Extract individual text blocks for structured analysis
            text_blocks = []
            for page in response.full_text_annotation.pages:
                for block in page.blocks:
                    block_text = ""
                    for paragraph in block.paragraphs:
                        for word in paragraph.words:
                            word_text = ''.join([symbol.text for symbol in word.symbols])
                            block_text += word_text + ' '
                    text_blocks.append(block_text.strip())
            
            return {
                'full_text': full_text,
                'text_blocks': text_blocks,
                'confidence': self._calculate_confidence(response)
            }
            
        except Exception as e:
            self.logger.error(f"OCR processing failed: {str(e)}")
            return {'error': str(e)}
    
    def _calculate_confidence(self, response):
        """Calculate average confidence score"""
        confidences = []
        for page in response.full_text_annotation.pages:
            for block in page.blocks:
                confidences.append(block.confidence)
        
        return sum(confidences) / len(confidences) if confidences else 0.0
