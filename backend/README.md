# The Unfair Advantage - Backend API 🚀

> **Democratizing business idea evaluation through AI-powered multi-modal analysis**

## 🎯 Problem Statement

Many aspiring entrepreneurs struggle to turn raw ideas—scribbled notes, sketches, or voice notes—into structured business cases. Traditional evaluation requires expensive consultants or mentor time. **The Unfair Advantage** solves this by providing an intelligent tool that:

- ✅ Captures ideas in **any format** (text, voice, handwritten notes, documents)
- ✅ Processes content in **any language** (10+ Indian languages supported)
- ✅ Provides **instant AI-powered evaluation** and feedback
- ✅ Gives **every innovator a fair shot** regardless of background

## 🏗️ Architecture

### Multi-Modal Input Processing

```
Raw Idea → Input Processing → Language Detection → Translation → AI Analysis → Structured Feedback
    ↓           ↓                    ↓               ↓              ↓              ↓
  Text      OCR/Speech         Auto-detect      Translate      Vertex AI     Actionable
  Voice     Recognition          Language        to English     Gemini        Insights
  Image
  Document
```

### Technology Stack

- **Backend**: Flask (Python 3.8+)
- **AI/ML**: Google Cloud Vertex AI (Gemini 1.5 Pro)
- **OCR**: Google Cloud Vision API
- **Speech**: Google Cloud Speech-to-Text
- **Translation**: Google Cloud Translate
- **Infrastructure**: Google Cloud Platform

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Google Cloud Platform account
- GCP Service Account with required permissions

### Installation

1. **Clone and Setup**

   ```bash
   cd backend
   python start.py
   ```

   This will:

   - Check Python version
   - Install dependencies
   - Create required directories
   - Start the development server

2. **Manual Setup** (alternative)

   ```bash
   # Install dependencies
   pip install -r requirements.txt

   # Copy environment template
   cp .env.template .env

   # Edit .env with your values
   nano .env

   # Start server
   python app.py
   ```

### Environment Configuration

Create `.env` file from template:

```env
# GCP Configuration
GCP_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json

# Optional settings
SECRET_KEY=your-secret-key
MAX_CONTENT_LENGTH=16777216  # 16MB
```

## 📋 API Endpoints

### Base URL: `http://localhost:5000`

#### 🏥 Health & Documentation

- `GET /` - Health check and API overview
- `GET /api/docs` - Complete API documentation

#### 📤 Upload Endpoints

- `POST /api/upload/text` - Submit text-based business idea
- `POST /api/upload/voice` - Upload voice recording (.mp3, .wav, .m4a)
- `POST /api/upload/image` - Upload handwritten notes/sketches (.jpg, .png)
- `POST /api/upload/document` - Upload documents (.pdf, .txt)
- `GET /api/upload/status/<id>` - Check processing status

#### 🧠 Evaluation Endpoints

- `POST /api/evaluate/analyze` - Get AI-powered business analysis
- `GET /api/evaluate/report/<id>` - Detailed evaluation report
- `GET /api/evaluate/criteria` - View evaluation criteria

#### 💬 Feedback Endpoints

- `POST /api/feedback/submit` - Submit user feedback
- `POST /api/feedback/rating` - Rate evaluation quality

## 🔧 Features

### Multi-Modal Input Support

- **Text**: Direct idea submission
- **Voice**: Speech-to-text in 10+ Indian languages
- **Images**: OCR for handwritten notes and sketches
- **Documents**: PDF and text file processing

### AI-Powered Analysis

- **Market Potential**: TAM, SAM, SOM analysis
- **Feasibility**: Technical and operational assessment
- **Innovation**: Uniqueness and differentiation
- **Scalability**: Growth potential evaluation
- **Financial Viability**: Revenue model analysis

### Language Support

| Language  | Code | Voice | Text | OCR |
| --------- | ---- | ----- | ---- | --- |
| English   | en   | ✅    | ✅   | ✅  |
| Hindi     | hi   | ✅    | ✅   | ✅  |
| Bengali   | bn   | ✅    | ✅   | ✅  |
| Tamil     | ta   | ✅    | ✅   | ✅  |
| Telugu    | te   | ✅    | ✅   | ✅  |
| Marathi   | mr   | ✅    | ✅   | ✅  |
| Gujarati  | gu   | ✅    | ✅   | ✅  |
| Kannada   | kn   | ✅    | ✅   | ✅  |
| Malayalam | ml   | ✅    | ✅   | ✅  |
| Punjabi   | pa   | ✅    | ✅   | ✅  |

## 🧪 Testing

### Example API Calls

#### Submit Text Idea

```bash
curl -X POST http://localhost:5000/api/upload/text \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AI-powered food delivery for rural areas",
    "content": "An app that connects rural consumers with local farmers and food vendors using AI to optimize delivery routes and predict demand.",
    "language": "en"
  }'
```

#### Upload Voice Recording

```bash
curl -X POST http://localhost:5000/api/upload/voice \
  -F "audio=@idea_recording.mp3" \
  -F "title=My Startup Idea" \
  -F "language=hi-IN"
```

#### Upload Handwritten Notes

```bash
curl -X POST http://localhost:5000/api/upload/image \
  -F "image=@sketch.jpg" \
  -F "title=Business Model Sketch"
```

## 🏛️ Project Structure

```
backend/
├── app.py              # Main Flask application
├── config.py           # Configuration settings
├── start.py            # Startup script
├── requirements.txt    # Dependencies
├── .env.template       # Environment template
├── models/             # Data models
├── services/           # Business logic
├── routes/             # API endpoints
├── utils/              # Utilities
├── static/uploads/     # File storage
└── logs/              # Application logs
```

## 🔒 Security

- File type validation and sanitization
- Size limits (16MB max)
- Malicious content detection
- Input validation and sanitization
- Secure file storage

## 📊 Monitoring & Logging

- Comprehensive logging to `logs/unfair_advantage.log`
- Request/response tracking
- Error monitoring
- Performance metrics

## 🚀 Deployment

### Local Development

```bash
python start.py
```

### Production (Google Cloud Run)

```bash
# Build and deploy
gcloud run deploy unfair-advantage-api \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

This project is part of the CSI Odyssey Hackathon submission.

## 🙏 Acknowledgments

- Google Cloud Platform for AI/ML services
- Indian startup ecosystem for inspiration
- CSI Odyssey Hackathon organizers

---

**Built with ❤️ for empowering entrepreneurs across India and beyond**
