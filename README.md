# Interview ETL - User Stories Generator

A fully functional, production-ready application that transforms interview transcripts into structured user stories using AI-powered extraction.

## 🚀 Features

- **AI-Powered Extraction**: Uses advanced NLP to extract user stories from interview transcripts
- **Flexible Input Formats**: Supports ZIP, TXT, DOCX, PDF, and Markdown files
- **Custom Output Schemas**: Define your own output structure for user stories
- **Real-time Processing**: Live job status updates and progress tracking
- **Cloud Integration**: Built on Google Cloud Platform with Firestore, Storage, and Pub/Sub
- **Professional UI**: Modern, responsive interface built with Next.js and Tailwind CSS
- **CSV Export**: Download results in structured CSV format
- **External Import**: Import user stories from cloud storage and document links

## 🏗️ Architecture

```
Frontend (Next.js) → Backend (FastAPI) → Worker (Python) → Google Cloud Services
     ↓                    ↓                    ↓                    ↓
  React UI           REST API           AI Processing        Firestore/Storage
```

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python 3.11+, Pydantic
- **Worker**: Python async processing with Google Cloud Pub/Sub
- **Database**: Google Cloud Firestore
- **Storage**: Google Cloud Storage
- **AI/ML**: Google Gemini API for text processing
- **Deployment**: Docker, Google Cloud Run

## 📋 Prerequisites

- Docker and Docker Compose
- Google Cloud Platform account
- Node.js 18+ (for frontend development)
- Python 3.11+ (for backend development)

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd Interview-ETL-User-Stories
```

### 2. Configure Google Cloud

```bash
# Set up Google Cloud credentials
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-key.json"

# Enable required APIs:
# - Cloud Firestore API
# - Cloud Storage API
# - Cloud Pub/Sub API
# - Cloud Run API
```

### 3. Start the Application

```bash
# Make the startup script executable
chmod +x start-local.sh

# Start all services
./start-local.sh
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Health Check**: http://localhost:8000/health

## 📖 Usage Guide

### Step 1: Define Output Structure
- Choose from predefined templates or create custom schemas
- Define the fields you want in your user stories output
- Set default values and priority rules

### Step 2: Upload Interview Transcripts
- **File Upload**: Drag & drop or select files (ZIP, TXT, DOCX, PDF, MD)
- **Folder Import**: Link to cloud storage folders (Google Drive, SharePoint, etc.)
- **Document Import**: Import individual documents via URL

### Step 3: Process & Extract
- Review your inputs and start AI processing
- Monitor real-time progress and job status
- AI engine extracts user stories using your defined schema

### Step 4: Download Results
- Download structured CSV with all extracted user stories
- Review confidence scores and extraction quality
- Export for use in project management tools

## 🔧 Configuration

### Environment Variables

Create `config/local.env` for local development:

```env
# Google Cloud
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
GCS_BUCKET=your-storage-bucket
FIRESTORE_COLLECTION_JOBS=Jobs
FIRESTORE_COLLECTION_CONSTRUCTS=Constructs

# API Configuration
CORS_ALLOW_ORIGINS=http://localhost:3000,https://yourdomain.com

# AI Configuration
GEMINI_API_KEY=your-gemini-api-key
```

### Production Deployment

Update `config/production.env` with production values:

```env
# Production settings
GCS_BUCKET=interview-etl-production
FIRESTORE_COLLECTION_JOBS=ProductionJobs
FIRESTORE_COLLECTION_CONSTRUCTS=ProductionConstructs
```

## 🏭 Production Deployment

### Google Cloud Run

```bash
# Build and deploy backend
gcloud run deploy interview-etl-backend \
  --source backend/ \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

# Build and deploy worker
gcloud run deploy interview-etl-worker \
  --source worker/ \
  --platform managed \
  --region us-central1 \
  --no-allow-unauthenticated
```

### Frontend (Vercel)

```bash
# Deploy to Vercel
vercel --prod
```

## 🔍 API Documentation

### Core Endpoints

- `POST /jobs` - Create a new processing job
- `POST /jobs/{id}/upload` - Upload files to a job
- `PUT /jobs/{id}/uploadComplete` - Start processing
- `GET /jobs/{id}` - Get job status
- `GET /download/{id}/csv` - Download results

### Construct Management

- `POST /constructs` - Create output schema template
- `GET /constructs/default` - Get default template
- `GET /constructs` - List all templates

### External Imports

- `POST /external-imports/folder` - Import from cloud storage
- `POST /external-imports/document` - Import single document
- `POST /external-imports/link` - Import from URL

## 🧪 Testing

```bash
# Backend tests
cd backend
python -m pytest

# Frontend tests
cd app
npm test

# Integration tests
docker-compose -f docker-compose.test.yml up
```

## 📊 Monitoring & Logging

- **Health Checks**: `/health` endpoint for service monitoring
- **Job Status**: Real-time updates via API polling
- **Error Handling**: Comprehensive error responses with timestamps
- **Logging**: Structured logging for debugging and monitoring

## 🔒 Security

- CORS configuration for controlled access
- Google Cloud IAM for service authentication
- Input validation and sanitization
- Secure file upload handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: Check LOCAL_DEVELOPMENT.md for detailed setup
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Use GitHub Discussions for questions

## 🎯 Roadmap

- [ ] Advanced AI models for better extraction
- [ ] Real-time collaboration features
- [ ] Integration with project management tools
- [ ] Advanced analytics and reporting
- [ ] Multi-language support
- [ ] Mobile application

---

**Built with ❤️ for product managers, business analysts, and development teams**
