export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Interview ETL - User Stories Generator
          </h1>
          <p className="text-xl text-gray-600">
            Transform interview transcripts into structured user stories using AI-powered ETL processing.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            🎉 Application is Working!
          </h2>
          <p className="text-gray-600 mb-4">
            If you can see this page, the Next.js App Router is working correctly.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800">✅ Frontend</h3>
              <p className="text-blue-600">Next.js 14 with App Router</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800">✅ Backend</h3>
              <p className="text-green-600">FastAPI on GCP Cloud Run</p>
            </div>
          </div>
          
          <div className="text-center">
            <a 
              href="https://interview-etl-backend-289778453333.us-central1.run.app/health"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Test Backend API
            </a>
          </div>
        </div>
        
        <div className="mt-8 text-center text-gray-500">
          <p>Ready to build the complete ETL application!</p>
        </div>
      </div>
    </div>
  );
}
