#!/bin/bash

echo "🚀 Starting Interview ETL - User Stories Generator"
echo "=================================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if required environment variables are set
if [ -z "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
    echo "⚠️  GOOGLE_APPLICATION_CREDENTIALS not set. Please set your Google Cloud credentials."
    echo "   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account-key.json"
fi

echo ""
echo "📋 Prerequisites:"
echo "   • Docker and Docker Compose installed"
echo "   • Google Cloud credentials configured"
echo "   • Node.js 18+ installed (for frontend development)"
echo ""

echo "🔧 Starting backend services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for backend to be ready..."
sleep 10

echo ""
echo "🌐 Starting frontend development server..."
cd app
npm run dev &

echo ""
echo "✅ Application is starting up!"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔌 Backend:  http://localhost:8000"
echo "📊 Health:   http://localhost:8000/health"
echo ""
echo "🔄 Worker processing will start automatically when jobs are created"
echo ""
echo "💡 To stop the application:"
echo "   • Frontend: Ctrl+C in the frontend terminal"
echo "   • Backend:  docker-compose down"
echo ""
echo "📚 For more information, see LOCAL_DEVELOPMENT.md"
