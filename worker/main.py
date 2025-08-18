import os
from flask import Flask, request, jsonify
import json

# Initialize Flask app for Cloud Run
app = Flask(__name__)

# Health check endpoint for Cloud Run
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "interview-etl-worker",
        "timestamp": "2025-08-18T03:30:00Z",
        "message": "Worker service is running"
    })

# Simple status endpoint
@app.route('/status', methods=['GET'])
def status():
    return jsonify({
        "worker_status": "running",
        "environment": os.getenv('ENVIRONMENT', 'production'),
        "ready": True
    })

if __name__ == "__main__":
    # For Cloud Run, start Flask app
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
