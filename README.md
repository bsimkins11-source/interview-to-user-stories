# Interview ETL User Stories

An intelligent ETL application for processing interview data into structured user stories using AI-powered extraction and normalization. Built with Next.js, FastAPI, and Gemini AI.

## 🚀 Features

- **Smart Construct Editor**: Define custom output schemas, patterns, and defaults
- **AI-Powered Extraction**: Gemini AI analyzes transcripts and extracts user stories
- **Multi-Format Support**: Process TXT, DOCX, MD, and PDF files
- **Real-time Processing**: Live status updates and progress tracking
- **Intelligent Assistant**: Built-in AI help throughout the ETL process
- **Beautiful UI**: Modern, responsive design that fits the Agent Hub ecosystem

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Worker        │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│   (Cloud Run)   │
│                 │    │                 │    │                 │
│ • Construct     │    │ • Job Management│    │ • File Parsing  │
│ • File Upload   │    │ • Signed URLs   │    │ • AI Extraction │
│ • Status Monitor│    │ • Firestore     │    │ • Deduplication │
│ • AI Assistant  │    │ • GCS Storage   │    │ • CSV Generation│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       ▼
         │              ┌─────────────────┐    ┌─────────────────┐
         │              │   Firestore     │    │   Google Cloud  │
         │              │   (Database)    │    │   Storage       │
         │              └─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐
│   Gemini AI     │
│   (Assistant)   │
│                 │
│ • Construct Help│
│ • Data Analysis │
│ • Process Guide │
└─────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** with App Router
- **Tailwind CSS** for styling
- **shadcn/ui** components
- **React Hook Form** with Zod validation
- **React Dropzone** for file uploads

### Backend
- **FastAPI** for REST API
- **Google Cloud Firestore** for data storage
- **Google Cloud Storage** for file management
- **Google Cloud Pub/Sub** for async processing

### AI & Processing
- **Google Gemini** for intelligent assistance and extraction
- **Document parsing** (TXT, DOCX, MD, PDF)
- **Jaccard similarity** for deduplication
- **Custom construct templates**

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- Google Cloud Project with enabled services
- Gemini API key

### 1. Clone and Setup
```bash
git clone <repository-url>
cd Interview-ETL-User-Stories

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
pip install -r requirements.txt

# Install worker dependencies
cd ../worker
pip install -r requirements.txt
```

### 2. Environment Configuration

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

#### Backend (.env)
```bash
GCP_PROJECT_ID=your-project-id
GCS_BUCKET=your-bucket-name
PUBSUB_TOPIC=jobs.process
FIRESTORE_COLLECTION_JOBS=Jobs
FIRESTORE_COLLECTION_CONSTRUCTS=Constructs
LLM_PROVIDER=gemini
GOOGLE_API_KEY=your_gemini_api_key
CORS_ALLOW_ORIGINS=http://localhost:3000
```

#### Worker (.env)
```bash
GCP_PROJECT_ID=your-project-id
GCS_BUCKET=your-bucket-name
PUBSUB_TOPIC=jobs.process
FIRESTORE_COLLECTION_JOBS=Jobs
FIRESTORE_COLLECTION_CONSTRUCTS=Constructs
LLM_PROVIDER=gemini
GOOGLE_API_KEY=your_gemini_api_key
```

### 3. Start Development Servers

```bash
# Terminal 1: Frontend
cd frontend
npm run dev

# Terminal 2: Backend
cd backend
python -m uvicorn main:app --reload --port 8000

# Terminal 3: Worker
cd worker
python main.py
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 📋 Usage Workflow

### 1. Define Output Structure
- Use the **Construct Editor** to define your desired output format
- Choose from pre-built templates or create custom ones
- Define columns, patterns, defaults, and priority rules
- Preview how your data will be structured

### 2. Upload Interview Files
- Prepare a ZIP file containing your interview transcripts
- Supported formats: TXT, DOCX, MD, PDF
- Drag and drop or browse to upload
- Files are securely stored in Google Cloud Storage

### 3. AI Processing
- Our Gemini AI analyzes each transcript
- Extracts user stories based on your construct
- Applies patterns and default values
- Performs deduplication and quality scoring

### 4. Download Results
- Get structured CSV output
- View processing metrics and insights
- Analyze data patterns and distributions
- Start new jobs or refine your construct

## 🤖 AI Assistant Features

The built-in Gemini AI assistant provides:

- **Construct Guidance**: Help with schema design and optimization
- **Template Suggestions**: Pre-built patterns for common use cases
- **Data Analysis**: Insights about extracted stories and patterns
- **Process Help**: Step-by-step guidance through the ETL workflow
- **Best Practices**: Tips for interview preparation and data quality

## 🚀 Deployment

### Frontend (Vercel)
```bash
cd frontend
npm run build
vercel --prod
```

### Backend & Worker (Google Cloud Run)
```bash
# Build and deploy API
gcloud run deploy i2s-api \
  --source backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

# Build and deploy worker
gcloud run deploy i2s-worker \
  --source worker \
  --platform managed \
  --region us-central1 \
  --no-allow-unauthenticated
```

### Infrastructure Setup
```bash
# Enable required services
gcloud services enable run.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable pubsub.googleapis.com

# Create Firestore database
gcloud firestore databases create --region=us-central1

# Create GCS bucket
gsutil mb gs://your-bucket-name

# Create Pub/Sub topic
gcloud pubsub topics create jobs.process
```

## 🔧 Configuration

### Construct Templates
The system supports custom construct definitions:

```json
{
  "name": "User Story Template",
  "output_schema": [
    "User Story ID",
    "User Story",
    "Team",
    "Category",
    "Priority",
    "Source",
    "Snippet"
  ],
  "pattern": "As a {{role}}, I need {{capability}} so that {{benefit}}.",
  "defaults": {
    "Category": "Workflow",
    "Priority": "Medium"
  },
  "priority_rules": ["high", "medium", "low"]
}
```

### File Processing
- **ZIP Upload**: Maximum 100MB per job
- **Supported Formats**: TXT, DOCX, MD, PDF
- **Processing Time**: 2-5 minutes for typical jobs
- **Output**: Structured CSV with configurable columns

## 🧪 Testing

### Frontend Tests
```bash
cd frontend
npm run test
npm run test:e2e
```

### Backend Tests
```bash
cd backend
pytest
```

### Integration Tests
```bash
# Test complete ETL pipeline
python -m pytest tests/integration/
```

## 📊 Monitoring & Analytics

- **Job Status**: Real-time processing updates
- **Performance Metrics**: Processing time and success rates
- **Error Tracking**: Detailed error logs and debugging
- **Usage Analytics**: Job volume and user patterns

## 🔒 Security

- **Authentication**: Google OAuth integration
- **File Security**: Signed URLs for secure file access
- **Data Privacy**: Files processed in isolated environments
- **API Security**: CORS protection and rate limiting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests and documentation
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Project Wiki](link-to-wiki)
- **Issues**: [GitHub Issues](link-to-issues)
- **Discussions**: [GitHub Discussions](link-to-discussions)
- **Email**: support@example.com

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Basic ETL pipeline
- ✅ Construct editor
- ✅ AI-powered extraction
- ✅ Real-time status updates

### Phase 2 (Next)
- 🔄 Advanced analytics dashboard
- 🔄 Team collaboration features
- 🔄 API rate limiting and quotas
- 🔄 Enhanced error handling

### Phase 3 (Future)
- 📋 Multi-language support
- 📋 Advanced AI models
- 📋 Enterprise features
- 📋 Mobile application

---

Built with ❤️ for the Agent Hub ecosystem
