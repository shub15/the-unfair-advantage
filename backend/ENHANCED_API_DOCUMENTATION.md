# Enhanced Upload API Documentation

This document describes the enhanced upload endpoints that now include comprehensive business analysis and scoring capabilities, similar to the functionality in `main-final.py`.

## New Features Added

### 1. Enhanced Speech-to-Text Service

- **Speaker Diarization**: Identifies different speakers in audio
- **Audio Chunking**: Handles long audio files (>59 seconds) by splitting into chunks
- **Advanced Configuration**: Uses telephony models for better recognition in Indian languages

### 2. Business Analysis Service

- **Comprehensive Business Data Extraction**: Combines OCR and audio transcript data
- **Business Scoring**: 10-point scoring system across 5 categories
- **Business Case Generation**: Generates detailed mentor-ready business cases

### 3. Enhanced Upload Endpoints

#### `/upload/pdf` (Enhanced)

**Method**: POST  
**Description**: PDF upload with comprehensive business analysis

**Request**:

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -F "file=@business_plan.pdf" \
  http://localhost:5000/upload/pdf
```

**Response** (Enhanced):

```json
{
  "submission_id": "uuid",
  "raw_text": "OCR extracted text...",
  "structured_data": {
    "entrepreneur_info": {...},
    "business_concept": {...},
    "value_proposition": {...},
    "financial_info": {...},
    "additional_info": {...}
  },
  "comprehensive_business_data": {
    "entrepreneur_profile": {...},
    "business_concept": {...},
    "target_market": {...},
    "value_proposition": {...},
    "revenue_model": {...},
    "resources_required": {...},
    "competition": {...},
    "implementation": {...}
  },
  "business_score": {
    "total_score": 7,
    "max_score": 10,
    "percentage": 70,
    "breakdown": {
      "market_potential": 2,
      "business_model_clarity": 1,
      "financial_feasibility": 2,
      "competitive_advantage": 1,
      "entrepreneur_capability": 1
    },
    "eligibility": "High Potential - Recommended",
    "recommendation": "Strong business case...",
    "score_details": {...}
  },
  "business_case": "# Executive Summary\n\n...",
  "pages_processed": 3,
  "confidence": 0.95,
  "processing_time": "2.34s",
  "file_size": 1048576,
  "status": "analyzed"
}
```

#### `/upload/image/structured` (Enhanced)

**Method**: POST  
**Description**: Image upload with comprehensive business analysis

**Request**:

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -F "file=@business_sketch.jpg" \
  -F "use_gemini=true" \
  http://localhost:5000/upload/image/structured
```

**Response**: Similar to PDF response with business analysis data.

#### `/upload/audio` (Enhanced)

**Method**: POST  
**Description**: Audio upload with optional business analysis

**Request**:

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -F "file=@business_pitch.wav" \
  -F "language=en-IN" \
  -F "analyze_business=true" \
  http://localhost:5000/upload/audio
```

**Response**:

```json
{
  "submission_id": "uuid",
  "transcript": "Speaker 1: Our business idea is...\nSpeaker 2: The market size is...",
  "detected_language": "en-IN",
  "confidence": 0.92,
  "processing_method": "standard|chunked",
  "duration_seconds": 120.5,
  "comprehensive_business_data": {...},
  "business_score": {...},
  "business_case": "...",
  "status": "analyzed"
}
```

#### `/upload/comprehensive` (New)

**Method**: POST  
**Description**: Combined document and audio upload for comprehensive analysis

**Request**:

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -F "document=@business_plan.pdf" \
  -F "audio=@pitch_recording.wav" \
  -F "language=en-IN" \
  http://localhost:5000/upload/comprehensive
```

**Response**:

```json
{
  "submission_id": "uuid",
  "comprehensive_business_data": {...},
  "business_score": {...},
  "business_case": "...",
  "ocr_data": {...},
  "transcript": "...",
  "language_code": "en-IN",
  "processing_time": "5.67s",
  "status": "comprehensive_analysis_complete",
  "saved_to_history": true,
  "user_id": "user_id"
}
```

## Business Scoring System

### Scoring Categories (0-2 points each)

1. **Market Potential** (0-2 points)

   - Market size identification
   - Primary customer definition

2. **Business Model Clarity** (0-2 points)

   - Business description completeness
   - Pricing strategy definition

3. **Financial Feasibility** (0-2 points)

   - Startup costs/loan requirements
   - Revenue stream identification

4. **Competitive Advantage** (0-2 points)

   - Unique selling proposition
   - Problem-solving capability

5. **Entrepreneur Capability** (0-2 points)
   - Relevant experience
   - Implementation timeline

### Eligibility Levels

- **7-10 points**: "High Potential - Recommended"
- **5-6 points**: "Good Potential - Consider"
- **3-4 points**: "Needs Development"
- **0-2 points**: "Insufficient Information"

## Business Case Structure

The generated business case includes:

1. **Executive Summary**
2. **Data Source Analysis**
3. **Business Analysis**
4. **Strengths & Opportunities**
5. **Risks & Challenges**
6. **Mentor Evaluation Focus Areas**
7. **Recommendation**

## Audio Processing Features

### Speaker Diarization

- Identifies up to 3 speakers
- Formats transcript with speaker labels
- Preserves temporal information

### Chunking for Long Audio

- Automatically splits audio >59 seconds
- Processes in 50-second chunks
- Combines results with chunk markers

### Language Support

- Primary: English (India) - `en-IN`
- Secondary: Hindi (India) - `hi-IN`
- Enhanced telephony models for Indian languages

## Error Handling

All endpoints include comprehensive error handling:

- File validation errors
- Processing errors
- Service initialization errors
- Cleanup on failure

## Authentication

- Optional authentication with `@optional_auth`
- Authenticated users get data saved to history
- User document tracking and statistics

## File Constraints

### Document Files

- **PDF**: Max size defined in config
- **Images**: PNG, JPG, JPEG formats
- Temporary file cleanup after processing

### Audio Files

- **Formats**: WAV, MP3, M4A, FLAC
- **Duration**: Automatic chunking for long files
- Speaker diarization enabled by default

## Configuration Requirements

Ensure these environment variables are set:

```env
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_APPLICATION_CREDENTIALS=path/to/service_account.json
UPLOAD_FOLDER=path/to/uploads
```

## Usage Examples

### Basic PDF Analysis

```bash
curl -X POST \
  -F "file=@plan.pdf" \
  http://localhost:5000/upload/pdf
```

### Audio with Business Analysis

```bash
curl -X POST \
  -F "file=@pitch.wav" \
  -F "analyze_business=true" \
  http://localhost:5000/upload/audio
```

### Comprehensive Analysis

```bash
curl -X POST \
  -F "document=@plan.pdf" \
  -F "audio=@pitch.wav" \
  http://localhost:5000/upload/comprehensive
```
