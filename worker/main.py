import os
import json
import time
from datetime import datetime
from google.cloud import storage, firestore, pubsub_v1
from google.cloud.exceptions import NotFound
from dotenv import load_dotenv
from processors.document_processor import DocumentProcessor
from processors.extraction_engine import ExtractionEngine
from processors.requirements_converter import RequirementsConverter
from flask import Flask, request, jsonify
import threading

# Load environment variables
load_dotenv()

# Initialize Flask app for Cloud Run compatibility
app = Flask(__name__)

# Initialize Google Cloud clients
storage_client = storage.Client()
firestore_client = firestore.Client()
publisher = pubsub_v1.PublisherClient()
subscriber = pubsub_v1.SubscriberClient()

# Initialize processors
document_processor = DocumentProcessor()
extraction_engine = ExtractionEngine(
    gemini_api_key=os.getenv('GEMINI_API_KEY'),
    openai_api_key=os.getenv('OPENAI_API_KEY')
)
requirements_converter = RequirementsConverter(
    gemini_api_key=os.getenv('GEMINI_API_KEY')
)

print("🚀 Interview ETL Worker initialized with AI processing pipeline!")
print(f"📊 Document Processor: {'✅ Ready' if document_processor else '❌ Not ready'}")
print(f"🤖 Extraction Engine: {'✅ Ready' if extraction_engine else '❌ Not ready'}")
print(f"📋 Requirements Converter: {'✅ Ready' if requirements_converter else '❌ Not ready'}")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for Cloud Run"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'services': {
            'document_processor': document_processor is not None,
            'extraction_engine': extraction_engine is not None,
            'requirements_converter': requirements_converter is not None
        }
    })

def download_and_extract(job_id: str):
    """Download and extract documents from Cloud Storage"""
    try:
        bucket = storage_client.bucket(os.getenv('STORAGE_BUCKET_NAME', 'interview-to-user-stories-data'))
        
        # Get all files uploaded for this job
        blobs = bucket.list_blobs(prefix=f"uploads/{job_id}/")
        documents = []
        
        for blob in blobs:
            if blob.name.endswith('/'):  # Skip directory markers
                continue
                
            try:
                # Download file content
                file_content = blob.download_as_text()
                
                # Extract filename from blob path
                filename = blob.name.split('/')[-1]
                file_extension = filename.split('.')[-1].lower()
                
                # Process different file types
                content = file_content
                paragraphs = [p.strip() for p in file_content.split('\n\n') if p.strip()]
                
                documents.append({
                    'filename': filename,
                    'file_type': file_extension,
                    'content': content,
                    'paragraphs': paragraphs,
                    'size': blob.size
                })
                
                print(f"Processed file: {filename} ({len(paragraphs)} paragraphs)")
                
            except Exception as e:
                print(f"Error processing file {blob.name}: {str(e)}")
                continue
        
        if not documents:
            raise Exception(f"No documents found for job {job_id}")
        
        print(f"Successfully processed {len(documents)} documents")
        return documents
        
    except Exception as e:
        print(f"Error downloading documents: {str(e)}")
        raise

def process_documents_with_ai(documents, construct):
    """Process documents using AI to extract user stories"""
    try:
        print("🤖 Starting AI-powered document processing...")
        
        # Process documents to extract text and structure
        processed_docs = document_processor.process_documents(documents, construct)
        print(f"📄 Processed {len(processed_docs)} documents")
        
        # Extract user stories using AI
        all_stories = []
        for doc in processed_docs:
            print(f"🧠 AI analyzing document: {doc.get('filename', 'Unknown')}")
            
            # Extract stories from each paragraph
            for i, paragraph in enumerate(doc.get('paragraphs', [])):
                if paragraph.strip():
                    story = await extraction_engine.extract_story_from_text(paragraph, doc, i)
                    if story:
                        all_stories.append(story)
                        print(f"✅ Extracted story: {story.get('User Story', 'Unknown')[:50]}...")
        
        print(f"🎯 Total user stories extracted: {len(all_stories)}")
        return all_stories
        
    except Exception as e:
        print(f"Error in AI document processing: {str(e)}")
        raise

def convert_stories_to_requirements(user_stories):
    """Convert user stories to requirements using Gemini AI"""
    try:
        print("🔄 Starting requirements conversion with Gemini AI...")
        
        # Use the requirements converter to generate requirements
        requirements = requirements_converter.convert_stories_to_requirements(user_stories)
        
        print(f"📋 Successfully converted {len(user_stories)} stories to {len(requirements)} requirements")
        return requirements
        
    except Exception as e:
        print(f"Error converting stories to requirements: {str(e)}")
        raise

def generate_and_upload_csv(user_stories, requirements, job_id: str):
    """Generate CSV files for both user stories and requirements"""
    try:
        bucket = storage_client.bucket(os.getenv('STORAGE_BUCKET_NAME', 'interview-to-user-stories-data'))
        
        # Generate user stories CSV
        if user_stories:
            stories_csv = generate_stories_csv(user_stories)
            stories_blob = bucket.blob(f"results/{job_id}/user_stories.csv")
            stories_blob.upload_from_string(stories_csv, content_type='text/csv')
            stories_url = f"gs://{bucket.name}/results/{job_id}/user_stories.csv"
            print(f"✅ User stories CSV uploaded: {stories_url}")
        
        # Generate requirements CSV
        if requirements:
            requirements_csv = generate_requirements_csv(requirements)
            requirements_blob = bucket.blob(f"results/{job_id}/requirements.csv")
            requirements_blob.upload_from_string(requirements_csv, content_type='text/csv')
            requirements_url = f"gs://{bucket.name}/results/{job_id}/requirements.csv"
            print(f"✅ Requirements CSV uploaded: {requirements_url}")
        
        return {
            'stories_csv_url': stories_url if user_stories else None,
            'requirements_csv_url': requirements_url if requirements else None
        }
        
    except Exception as e:
        print(f"Error generating and uploading CSV files: {str(e)}")
        raise

def generate_stories_csv(user_stories):
    """Generate CSV content for user stories"""
    if not user_stories:
        return ""
    
    # Define CSV headers based on the first story
    headers = list(user_stories[0].keys())
    
    csv_lines = [','.join(headers)]
    
    for story in user_stories:
        row = []
        for header in headers:
            value = story.get(header, '')
            # Escape quotes and wrap in quotes if contains comma
            if isinstance(value, str):
                value = value.replace(chr(34), chr(34) + chr(34))
                if ',' in value or chr(34) in value:
                    value = f'"{value}"'
            row.append(str(value))
        csv_lines.append(','.join(row))
    
    return '\n'.join(csv_lines)

def generate_requirements_csv(requirements):
    """Generate CSV content for requirements"""
    if not requirements:
        return ""
    
    # Define CSV headers for requirements
    headers = ['req_id', 'requirement', 'priority_level', 'req_details', 'source_story_id']
    
    csv_lines = [','.join(headers)]
    
    for req in requirements:
        row = []
        for header in headers:
            value = req.get(header, '')
            # Escape quotes and wrap in quotes if contains comma
            if isinstance(value, str):
                value = value.replace(chr(34), chr(34) + chr(34))
                if ',' in value or chr(34) in value:
                    value = f'"{value}"'
            row.append(str(value))
        csv_lines.append(','.join(row))
    
    return '\n'.join(csv_lines)

def process_job(job_id: str):
    """Main job processing function"""
    try:
        print(f"🚀 Starting job processing for job ID: {job_id}")
        start_time = time.time()
        
        # Update job status to processing
        job_ref = firestore_client.collection('jobs').document(job_id)
        job_ref.update({
            'status': 'PROCESSING',
            'updated_at': datetime.utcnow()
        })
        
        # Step 1: Download and extract documents
        print("📥 Step 1: Downloading and extracting documents...")
        documents = download_and_extract(job_id)
        
        # Step 2: Get job details from Firestore
        job_doc = job_ref.get()
        if not job_doc.exists:
            raise Exception(f"Job {job_id} not found in Firestore")
        
        job_data = job_doc.to_dict()
        construct = job_data.get('construct', {})
        
        # Step 3: Process documents with AI to extract user stories
        print("🤖 Step 2: Processing documents with AI...")
        user_stories = process_documents_with_ai(documents, construct)
        
        # Step 4: Convert user stories to requirements using Gemini AI
        print("🔄 Step 3: Converting user stories to requirements...")
        requirements = convert_stories_to_requirements(user_stories)
        
        # Step 5: Generate and upload CSV files
        print("📊 Step 4: Generating and uploading results...")
        csv_urls = generate_and_upload_csv(user_stories, requirements, job_id)
        
        # Step 6: Update job with results
        processing_time = time.time() - start_time
        job_ref.update({
            'status': 'COMPLETED',
            'user_stories_count': len(user_stories),
            'requirements_count': len(requirements),
            'stories_csv_url': csv_urls.get('stories_csv_url'),
            'requirements_csv_url': csv_urls.get('requirements_csv_url'),
            'processing_time': processing_time,
            'completed_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        })
        
        print(f"✅ Job {job_id} completed successfully!")
        print(f"📊 Results: {len(user_stories)} user stories, {len(requirements)} requirements")
        print(f"⏱️ Processing time: {processing_time:.2f} seconds")
        
    except Exception as e:
        print(f"❌ Error processing job {job_id}: {str(e)}")
        
        # Update job status to failed
        try:
            job_ref = firestore_client.collection('jobs').document(job_id)
            job_ref.update({
                'status': 'FAILED',
                'error': str(e),
                'updated_at': datetime.utcnow()
            })
        except Exception as update_error:
            print(f"Failed to update job status: {update_error}")

def start_worker():
    """Start the background worker process"""
    print("🔄 Starting background worker process...")
    
    subscription_path = subscriber.subscription_path(
        os.getenv('PUBSUB_PROJECT_ID', 'interview-to-user-stories'),
        os.getenv('PUBSUB_SUBSCRIPTION_NAME', 'interview-etl-jobs')
    )
    
    def callback(message):
        try:
            data = json.loads(message.data.decode('utf-8'))
            job_id = data.get('job_id')
            
            if job_id:
                print(f"📨 Received job message: {job_id}")
                process_job(job_id)
                message.ack()
            else:
                print("⚠️ Invalid job message format")
                message.nack()
                
        except Exception as e:
            print(f"❌ Error processing message: {e}")
            message.nack()
    
    # Start listening for messages
    streaming_pull_future = subscriber.subscribe(subscription_path, callback=callback)
    print("👂 Listening for job messages...")
    
    try:
        streaming_pull_future.result()
    except KeyboardInterrupt:
        streaming_pull_future.cancel()
        print("🛑 Worker stopped by user")

if __name__ == "__main__":
    # Start worker in background thread
    worker_thread = threading.Thread(target=start_worker, daemon=True)
    worker_thread.start()
    
    # Run Flask app on main thread for Cloud Run
    port = int(os.getenv('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False)
