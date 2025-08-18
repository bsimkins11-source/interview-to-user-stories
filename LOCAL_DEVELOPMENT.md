# Local Development Guide

This guide will help you set up and run the Interview ETL application locally for development and testing.

## 🏗️ Architecture Overview

The application consists of three main components:

1. **Frontend** (Next.js) - User interface for the ETL workflow
2. **Backend** (FastAPI) - REST API for job management and file processing
3. **Worker** (Python) - Background processing for AI extraction and CSV generation

## 📋 Prerequisites

### Required Software
- **Docker & Docker Compose** - For running backend services
- **Node.js 18+** - For frontend development
- **Python 3.11+** - For backend development (optional, Docker handles this)
- **Git** - For version control

### Required Accounts
- **Google Cloud Platform** - For Firestore, Storage, and Pub/Sub
- **Google AI Studio** - For Gemini API access

## 🔑 Google Cloud Setup

### 1. Create a New Project
```bash
# Create a new GCP project
gcloud projects create interview-etl-dev --name="Interview ETL Development"

# Set the project as default
gcloud config set project interview-etl-dev
```

### 2. Enable Required APIs
```bash
# Enable required services
gcloud services enable \
  firestore.googleapis.com \
  storage.googleapis.com \
  pubsub.googleapis.com \
  run.googleapis.com \
  cloudbuild.googleapis.com
```

### 3. Create Service Account
```bash
# Create service account
gcloud iam service-accounts create interview-etl-sa \
  --display-name="Interview ETL Service Account"

# Grant necessary roles
gcloud projects add-iam-policy-binding interview-etl-dev \
  --member="serviceAccount:interview-etl-sa@interview-etl-dev.iam.gserviceaccount.com" \
  --role="roles/datastore.user"

gcloud projects add-iam-policy-binding interview-etl-dev \
  --member="serviceAccount:interview-etl-sa@interview-etl-dev.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding interview-etl-dev \
  --member="serviceAccount:interview-etl-sa@interview-etl-dev.iam.gserviceaccount.com" \
  --role="roles/pubsub.publisher"

gcloud projects add-iam-policy-binding interview-etl-dev \
  --member="serviceAccount:interview-etl-sa@interview-etl-dev.iam.gserviceaccount.com" \
  --role="roles/pubsub.subscriber"
```

### 4. Create and Download Key
```bash
# Create and download the key
gcloud iam service-accounts keys create ~/interview-etl-key.json \
  --iam-account=interview-etl-sa@interview-etl-dev.iam.gserviceaccount.com

# Set environment variable
export GOOGLE_APPLICATION_CREDENTIALS=~/interview-etl-key.json
```

### 5. Create Storage Bucket
```bash
# Create storage bucket
gsutil mb gs://interview-etl-dev-bucket

# Make bucket publicly readable (for development)
gsutil iam ch allUsers:objectViewer gs://interview-etl-dev-bucket
```

### 6. Create Firestore Database
```bash
# Create Firestore database (Native mode)
gcloud firestore databases create --region=us-central1
```

## 🚀 Local Development Setup

### 1. Clone and Install Dependencies
```bash
# Clone the repository
git clone <your-repo-url>
cd Interview-ETL-User-Stories

# Install frontend dependencies
cd app
npm install
cd ..

# Install backend dependencies (optional, Docker handles this)
cd backend
pip install -r requirements.txt
cd ..
```

### 2. Environment Configuration
Create `config/local.env`:
```env
# Google Cloud Configuration
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/interview-etl-key.json
GCS_BUCKET=interview-etl-dev-bucket
FIRESTORE_COLLECTION_JOBS=DevJobs
FIRESTORE_COLLECTION_CONSTRUCTS=DevConstructs

# API Configuration
CORS_ALLOW_ORIGINS=http://localhost:3000,http://localhost:8000

# AI Configuration
GEMINI_API_KEY=your-gemini-api-key-here

# Development Settings
DEBUG=true
LOG_LEVEL=DEBUG
```

### 3. Start Services
```bash
# Make startup script executable
chmod +x start-local.sh

# Start all services
./start-local.sh
```

This will:
- Start the backend API on port 8000
- Start the worker service
- Start the frontend development server on port 3000

## 🔧 Development Workflow

### Frontend Development
```bash
cd app
npm run dev
```

The frontend will be available at `http://localhost:3000` with hot reloading enabled.

### Backend Development
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000` with auto-reload on code changes.

### Worker Development
```bash
cd worker
python main.py
```

The worker will connect to Pub/Sub and process jobs as they're created.

## 🧪 Testing

### Frontend Tests
```bash
cd app
npm test
npm run test:watch
```

### Backend Tests
```bash
cd backend
python -m pytest
python -m pytest --cov=.
```

### Integration Tests
```bash
# Test the complete workflow
docker-compose -f docker-compose.test.yml up
```

## 📊 Monitoring & Debugging

### Health Checks
- **Backend**: `http://localhost:8000/health`
- **Worker**: Check Docker logs

### Logs
```bash
# View all service logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f worker
```

### Database Inspection
```bash
# View Firestore data
gcloud firestore collections list
gcloud firestore documents list --collection-id=DevJobs
```

## 🐛 Common Issues & Solutions

### 1. Google Cloud Authentication
**Issue**: "Could not automatically determine credentials"
**Solution**: 
```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/key.json
gcloud auth activate-service-account --key-file=/path/to/your/key.json
```

### 2. Port Conflicts
**Issue**: "Port already in use"
**Solution**: 
```bash
# Find process using port
lsof -i :8000
# Kill process
kill -9 <PID>
```

### 3. Docker Issues
**Issue**: "Cannot connect to Docker daemon"
**Solution**: 
```bash
# Start Docker Desktop
# Or restart Docker service
sudo systemctl restart docker
```

### 4. File Upload Failures
**Issue**: "Upload failed: 500"
**Solution**: 
- Check Google Cloud Storage permissions
- Verify bucket exists and is accessible
- Check service account has proper roles

### 5. AI Processing Failures
**Issue**: "Processing failed: AI extraction error"
**Solution**: 
- Verify Gemini API key is valid
- Check API quota and limits
- Review input file formats

## 🔄 Development Workflow

### 1. Code Changes
1. Make changes to your code
2. Save the file
3. Frontend: Hot reload will update automatically
4. Backend: Restart the service or use `--reload` flag
5. Worker: Restart the worker process

### 2. Testing Changes
1. Test the specific functionality you changed
2. Run relevant test suites
3. Test the complete workflow end-to-end
4. Check logs for any errors

### 3. Database Changes
1. Update models in `backend/models.py`
2. Update Firestore collections if needed
3. Test with sample data
4. Update tests accordingly

## 📁 Project Structure

```
Interview-ETL-User-Stories/
├── app/                    # Frontend (Next.js)
│   ├── components/        # React components
│   ├── lib/              # Utilities and API client
│   └── page.tsx          # Main application page
├── backend/               # Backend API (FastAPI)
│   ├── services/         # Business logic services
│   ├── models.py         # Data models
│   └── main.py           # FastAPI application
├── worker/                # Background processing
│   ├── processors/       # AI processing modules
│   └── main.py           # Worker main process
├── config/                # Environment configuration
├── docker-compose.yml     # Local development services
└── start-local.sh         # Startup script
```

## 🚀 Deployment Preparation

### 1. Environment Variables
Update `config/production.env` with production values:
```env
GCS_BUCKET=interview-etl-production
FIRESTORE_COLLECTION_JOBS=ProductionJobs
FIRESTORE_COLLECTION_CONSTRUCTS=ProductionConstructs
CORS_ALLOW_ORIGINS=https://yourdomain.com
```

### 2. Build and Test
```bash
# Build frontend
cd app
npm run build
npm run start

# Test backend
cd ../backend
python -m pytest

# Test worker
cd ../worker
python main.py
```

### 3. Docker Images
```bash
# Build production images
docker build -t interview-etl-backend ./backend
docker build -t interview-etl-worker ./worker

# Test locally
docker run -p 8000:8000 interview-etl-backend
```

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Google Cloud Documentation](https://cloud.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Google Cloud Storage Documentation](https://cloud.google.com/storage/docs)

## 🆘 Getting Help

1. **Check the logs** - Most issues are visible in the service logs
2. **Verify configuration** - Ensure all environment variables are set correctly
3. **Test individual components** - Isolate issues by testing services separately
4. **Check Google Cloud Console** - Verify permissions and service status
5. **Review this guide** - Common solutions are documented above

For additional support, create an issue in the GitHub repository with:
- Description of the problem
- Steps to reproduce
- Error messages and logs
- Environment details (OS, Node.js version, etc.)
