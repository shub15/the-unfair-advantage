# Google Cloud Vision OCR Tools

This project provides two Python scripts for performing Optical Character Recognition (OCR) using Google Cloud Vision API. The tools can process both PDF documents and image files to extract text content.

## Features

1. **PDF OCR (`pdf_ocr.py`)**
   - Processes PDF files stored in Google Cloud Storage
   - Handles multi-page PDF documents
   - Outputs extracted text to the console
   - Saves results to a specified GCS bucket

2. **Image OCR (`ocr.py`)**
   - Processes multiple image files from a local directory
   - Supports common image formats (JPEG, PNG, etc.)
   - Includes a timer decorator to measure processing time
   - Outputs extracted text to the console

## Prerequisites

- Python 3.7+
- Google Cloud SDK installed and configured
- Google Cloud Vision API enabled
- Required Python packages (install via `pip install -r requirements.txt`)
- Google Cloud Service Account with Vision API access

## Setup

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd ocr
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up Google Cloud Credentials**
   - Create a service account with Vision API access
   - Download the JSON key file
   - Update the path in the scripts or set the environment variable:
     ```bash
     export GOOGLE_APPLICATION_CREDENTIALS="path/to/your/vision_key.json"
     ```

## Usage

### For PDF Processing (`pdf_ocr.py`)

1. Upload your PDF to a Google Cloud Storage bucket
2. Update the following variables in `pdf_ocr.py`:
   - `gcs_source_uri`: Path to your PDF in GCS (e.g., 'gs://your-bucket/path/to/file.pdf')
   - `gcs_destination_uri`: Output directory in GCS for results

3. Run the script:
   ```bash
   python pdf_ocr.py
   ```

### For Image Processing (`ocr.py`)

1. Place your images in the specified directory (default: `D:\gdgsc\ocr\image`)
2. Update the `mypath` variable in `ocr.py` if needed
3. Run the script:
   ```bash
   python ocr.py
   ```

## Configuration

### Environment Variables
- `GOOGLE_APPLICATION_CREDENTIALS`: Path to your service account JSON key file

### Script Variables

#### `pdf_ocr.py`
- `batch_size`: Number of pages to process in each batch
- `mime_type`: Set to 'application/pdf' for PDF processing
- `timeout`: Maximum time (in seconds) to wait for the operation to complete

#### `ocr.py`
- `mypath`: Directory containing images to process

## Output

- **PDF OCR**: Extracted text is printed to the console
- **Image OCR**: Each image's text is printed with the filename

## Error Handling

- Missing or invalid credentials
- Timeout for long-running operations
- Empty or invalid input files
- Network connectivity issues

## Performance Notes

- Processing time depends on file size and complexity
- The `@my_timer` decorator in `ocr.py` helps monitor performance
- For large PDFs, consider adjusting the `batch_size` in `pdf_ocr.py`

## Requirements

Listed in `requirements.txt`:
```
google-cloud-vision>=2.0.0
google-cloud-storage>=1.32.0
protobuf>=3.13.0
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and feature requests, please open an issue in the repository.
