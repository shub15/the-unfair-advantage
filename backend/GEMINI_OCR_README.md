# Gemini OCR Integration

This document describes the integration of Google's Gemini Vision API for enhanced OCR capabilities, including PDF processing and structured data extraction.

## Overview

The enhanced OCR service now supports:

- **Image OCR**: Extract text from handwritten notes and sketches using both Google Cloud Vision and Gemini Vision
- **PDF OCR**: Process multi-page PDF documents with Gemini Vision
- **Structured Data Extraction**: Extract business plan information into structured JSON format
- **Dual OCR Support**: Fallback between Gemini and Google Cloud Vision APIs

## New Features

### 1. PDF Processing (`/upload/pdf`)

- Uploads PDF files and extracts text from all pages
- Converts PDF pages to images using pdf2image
- Performs OCR on each page using Gemini Vision
- Returns both raw text and structured business data

### 2. Enhanced Image OCR (`/upload/image/structured`)

- Same as existing image upload but with structured data extraction
- Option to choose between Gemini Vision and Google Cloud Vision
- Returns raw text and structured JSON data

### 3. Structured Data Extraction

Extracts the following business plan fields:

- `Entrepreneur_Name`: Name of the entrepreneur
- `Education_Status`: Educational qualification
- `Phone_Number`: Contact phone number
- `Business_Name`: Name of the business
- `Main_Product_Service`: Description of main product/service
- `Key_USP`: Unique selling proposition
- `Loan_Requirement_First_Month_INR`: Loan requirement in INR

## API Endpoints

### Upload PDF for OCR and Structured Extraction

```
POST /upload/pdf
Content-Type: multipart/form-data

Parameters:
- file: PDF file to process
```

**Response:**

```json
{
  "submission_id": "uuid",
  "raw_text": "extracted text from all pages",
  "structured_data": {
    "Entrepreneur_Name": "John Doe",
    "Business_Name": "Tech Startup",
    "Main_Product_Service": "AI-powered solution",
    "Loan_Requirement_First_Month_INR": 500000,
    ...
  },
  "pages_processed": 3,
  "confidence": 0.95,
  "status": "ready_for_evaluation"
}
```

### Upload Image with Structured Extraction

```
POST /upload/image/structured
Content-Type: multipart/form-data

Parameters:
- file: Image file to process
- use_gemini: true/false (optional, default: true)
```

**Response:**

```json
{
  "submission_id": "uuid",
  "raw_text": "extracted text",
  "structured_data": { ... },
  "confidence": 0.95,
  "ocr_method": "gemini",
  "status": "ready_for_evaluation"
}
```

## Installation and Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Install Poppler (Required for PDF processing)

**Windows:**

1. Download Poppler from: https://github.com/oschwartz10612/poppler-windows/releases
2. Extract to `C:\Program Files\poppler-25.07.0\`
3. Set the `POPPLER_PATH` environment variable

**Linux/Mac:**

```bash
# Ubuntu/Debian
sudo apt-get install poppler-utils

# MacOS
brew install poppler
```

### 3. Environment Configuration

Copy `.env.template` to `.env` and configure:

```bash
# Gemini API Configuration
GEMINI_API_KEY=your-gemini-api-key-here

# PDF Processing Configuration (Windows)
POPPLER_PATH=C:\Program Files\poppler-25.07.0\Library\bin

# Or leave empty for system-wide installation (Linux/Mac)
POPPLER_PATH=
```

### 4. Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create a new API key
3. Add it to your `.env` file

## Code Structure

### New Files

- `services/ocr_service.py` - Enhanced with Gemini integration
- `utils/pdf_processor.py` - PDF processing utilities
- `routes/upload.py` - New PDF and structured image endpoints

### Key Classes

#### `OCRService`

- `extract_text_from_image(image_path, use_gemini=True)` - Image OCR with dual API support
- `extract_text_from_pdf(pdf_path)` - PDF processing with Gemini Vision
- `extract_structured_data(raw_text)` - Structured data extraction

#### `PDFProcessor`

- `convert_pdf_to_images(pdf_path)` - Convert PDF to PIL images
- `validate_poppler_installation()` - Check Poppler setup
- `optimize_image_for_ocr(image)` - Image optimization for better OCR

## Error Handling

The system includes comprehensive error handling:

- **Missing API Keys**: Graceful fallback to Google Cloud Vision
- **Poppler Installation Issues**: Clear error messages and validation
- **File Processing Errors**: Automatic cleanup of temporary files
- **API Failures**: Detailed error logging and user-friendly messages

## Performance Considerations

- **Image Optimization**: Automatic resizing and format optimization for OCR
- **Temporary File Management**: Automatic cleanup of temporary files
- **Memory Usage**: Streaming file processing to minimize memory footprint
- **API Rate Limits**: Built-in error handling for API quotas

## Testing

Use the provided test scripts:

```bash
# Test PDF upload
python dev_tools/api_tester.py --endpoint pdf --file sample.pdf

# Test structured image upload
python dev_tools/api_tester.py --endpoint image_structured --file sample.png
```

## Troubleshooting

### Common Issues

1. **Poppler Not Found**

   - Ensure Poppler is installed and `POPPLER_PATH` is correct
   - Test with: `pdftoppm -h` (should show help)

2. **Gemini API Errors**

   - Verify API key is valid and has proper permissions
   - Check API quotas and billing

3. **Memory Issues**

   - Large PDFs may consume significant memory
   - Consider implementing page-by-page processing for very large files

4. **File Upload Limits**
   - Default limit is 16MB (configurable in config.py)
   - Adjust `MAX_CONTENT_LENGTH` as needed

## Integration with Existing Code

The new functionality is designed to be backward compatible:

- Existing `/upload/image` endpoint remains unchanged
- New endpoints provide additional functionality
- Original Google Cloud Vision OCR is still available as fallback

## Future Enhancements

Potential improvements:

- Batch processing for multiple files
- Custom extraction schemas for different document types
- Integration with document management systems
- Real-time processing status updates
