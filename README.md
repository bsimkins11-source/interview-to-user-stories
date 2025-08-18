# Interview ETL User Stories

**Transform interview transcripts into structured user stories with AI-powered extraction**

**Last Deployment:** 2024-01-01 21:15 UTC - Enterprise-grade optimizations deployed! 🚀

## 🎯 Overview

## 🚀 Features

- **Complete ETL Pipeline**: 4-step wizard for interview processing
- **Multiple Input Types**: File uploads, folder links, document links
- **External Story Import**: Google Drive, SharePoint, OneDrive integration
- **AI-Powered Extraction**: Gemini-powered user story generation
- **Consistent Output**: Deterministic processing with CSV export
- **Enhanced AI Assistant**: Context-aware Q&A throughout the process

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │     Worker      │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│   (Python)      │
│   Vercel        │    │   Cloud Run     │    │   Cloud Run     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   External      │    │   Firestore     │    │   Cloud         │
│   Imports       │    │   Database      │    │   Storage       │
│   (GDrive, SP)  │    │   (Jobs, Data)  │    │   (Files)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, shadcn/ui
- **Backend**: FastAPI, Python, Google Cloud Run
- **Worker**: Python, AI processing, document parsing
- **Database**: Google Cloud Firestore
- **Storage**: Google Cloud Storage
- **AI**: Google Gemini, OpenAI (optional)
- **Deployment**: Vercel (frontend), GCP Cloud Run (backend/worker)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- Google Cloud Platform account

### Local Development
```bash
# Clone the repository
git clone <your-repo-url>
cd Interview-ETL-User-Stories

# Start local services
./start-local.sh

# Frontend (in new terminal)
cd frontend
npm install
npm run dev

# Backend (in new terminal)
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Production Deployment
```bash
# Backend & Worker to GCP
gcloud run deploy interview-etl-backend --source backend --region us-central1
gcloud run deploy interview-etl-worker --source worker --region us-central1

# Frontend to Vercel (auto-deploys from GitHub)
git push origin main
```

## 📋 Usage Workflow

### 1. Define Structure
- Create output schema templates
- Configure user story patterns
- Set default values and priorities

### 2. Add Transcripts
- Upload interview files (ZIP, TXT, DOCX, PDF, MD)
- Import from cloud storage (Google Drive, SharePoint, OneDrive)
- Provide direct document links

### 3. Process & Extract
- AI-powered content analysis
- User story pattern recognition
- Automatic categorization and scoring

### 4. Download Results
- CSV export with structured data
- Confidence scores for each story
- Deduplication and quality metrics

## 🤖 AI Assistant Features

- **Context-Aware Q&A**: Understands your current ETL step
- **User Story Guidance**: Best practices and templates
- **Process Explanation**: How the AI extraction works
- **Smart Suggestions**: Contextual help for each stage

## 🔌 External Import Capabilities

### Supported Sources
- **Google Drive**: Folders and documents
- **SharePoint**: Team sites and document libraries
- **OneDrive**: Personal and business storage
- **Direct Links**: HTTP endpoints, APIs, external systems

### Import Formats
- **Documents**: Google Sheets, Excel, Word, PDF
- **Data**: CSV, JSON, XML
- **Text**: Plain text, Markdown

## 📊 Output Schema

The system generates structured user stories with:
- **User Story**: "As a [role], I need [capability] so that [benefit]"
- **Metadata**: Category, priority, tags, confidence score
- **Requirements**: Acceptance criteria, dependencies
- **Source**: Original transcript reference, extraction method

## 🔒 Security & Privacy

- **No Data Persistence**: Files processed and deleted
- **Secure Uploads**: Signed URLs for file transfers
- **API Authentication**: Configurable access controls
- **CORS Protection**: Restricted to authorized domains

## 🧪 Testing

### Local Testing
```bash
# Run backend tests
cd backend
python -m pytest

# Run frontend tests
cd frontend
npm test

# End-to-end testing
npm run test:e2e
```

### Production Testing
- Health check endpoints
- API response validation
- File processing workflows
- AI extraction accuracy

## 📈 Monitoring

- **Health Checks**: Service availability monitoring
- **Processing Metrics**: Job completion rates
- **Error Tracking**: Failed job analysis
- **Performance**: Response time monitoring

## 🚀 Roadmap

- [ ] **Auth Integration**: Google OAuth, Auth.js
- [ ] **Advanced AI**: Custom model training
- [ ] **Real-time Processing**: WebSocket updates
- [ ] **Batch Processing**: Large file optimization
- [ ] **API Rate Limiting**: Usage management
- [ ] **Advanced Analytics**: Processing insights

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🆘 Support

- **Documentation**: [Project Wiki](link-to-wiki)
- **Issues**: [GitHub Issues](link-to-issues)
- **Discussions**: [GitHub Discussions](link-to-discussions)

## 🔗 Links

- **Live Application**: [https://interview-to-user-stories.vercel.app/](https://interview-to-user-stories.vercel.app/)
- **Backend API**: [https://interview-etl-backend-289778453333.us-central1.run.app/](https://interview-etl-backend-289778453333.us-central1.run.app/)
- **Agent Hub**: [https://transparent-agent-hub-zeta.vercel.app/](https://transparent-agent-hub-zeta.vercel.app/)

---

**Built with ❤️ for transforming interviews into actionable user stories**
