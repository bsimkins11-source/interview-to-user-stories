#!/bin/bash

echo "🚀 Starting Interview ETL Application (Local Development)"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not available. Please install it and try again."
    exit 1
fi

echo "📦 Building and starting services..."
docker-compose up --build -d

echo "⏳ Waiting for services to start..."
sleep 10

echo "🔍 Checking service status..."
docker-compose ps

echo ""
echo "✅ Services are starting up!"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "📊 Firestore Emulator: http://localhost:8080"
echo "💾 Storage Emulator: http://localhost:4443"
echo "📨 Pub/Sub Emulator: http://localhost:8085"
echo ""
echo "📝 To view logs: docker-compose logs -f"
echo "🛑 To stop: docker-compose down"
echo ""
echo "🎯 Next steps:"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Get a Gemini API key from https://makersuite.google.com/app/apikey"
echo "3. Update config/local.env with your API key"
echo "4. Upload your interview transcripts and start processing!"
