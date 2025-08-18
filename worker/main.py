import os
import json
import time
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from google.cloud import storage, firestore, pubsub_v1
from google.cloud.exceptions import NotFound, GoogleCloudError
from dotenv import load_dotenv
from processors.document_processor import DocumentProcessor
from processors.extraction_engine import ExtractionEngine
from processors.requirements_converter import RequirementsConverter
from processors.vector_processor import VectorProcessor
from flask import Flask, request, jsonify
import threading
import asyncio

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize Flask app for Cloud Run compatibility
app = Flask(__name__)

# Global variables for services
storage_client: Optional[storage.Client] = None
firestore_client: Optional[firestore.Client] = None
publisher: Optional[pubsub_v1.PublisherClient] = None
subscriber: Optional[pubsub_v1.SubscriberClient] = None

# Initialize processors
document_processor: Optional[DocumentProcessor] = None
extraction_engine: Optional[ExtractionEngine] = None
requirements_converter: Optional[RequirementsConverter] = None
vector_processor: Optional[VectorProcessor] = None

def initialize_services():
    """Initialize all Google Cloud services and processors with proper error handling"""
    global storage_client, firestore_client, publisher, subscriber
    global document_processor, extraction_engine, requirements_converter, vector_processor
    
    try:
        # Initialize Google Cloud clients
        storage_client = storage.Client()
        firestore_client = firestore.Client()
        publisher = pubsub_v1.PublisherClient()
        subscriber = pubsub_v1.SubscriberClient()
        
        logger.info("✅ Google Cloud clients initialized successfully")
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize Google Cloud clients: {e}")
        raise
    
    try:
        # Initialize processors
        document_processor = DocumentProcessor()
        extraction_engine = ExtractionEngine(
            gemini_api_key=os.getenv('GEMINI_API_KEY'),
            openai_api_key=os.getenv('OPENAI_API_KEY')
        )
        requirements_converter = RequirementsConverter(
            gemini_api_key=os.getenv('GEMINI_API_KEY')
        )
        vector_processor = VectorProcessor(
            project_id=os.getenv('GOOGLE_CLOUD_PROJECT', 'interview-to-user-stories')
        )
        
        logger.info("✅ All processors initialized successfully")
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize processors: {e}")
        raise

# -----------------------------
# Utility: Conditional vectorization
# -----------------------------
def _estimate_tokens_from_text_length(char_count: int) -> int:
    """Rough token estimate (~4 chars per token for English)."""
    return max(1, char_count // 4)

def _should_vectorize(documents: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Decide whether to vectorize based on size/complexity. Configurable via env.

    Env overrides (optional):
      VECTORIZE_MIN_TOKENS (default 30000)
      VECTORIZE_MIN_PARAGRAPHS (default 800)
      VECTORIZE_MIN_DOCS (default 3)
    """
    try:
        min_tokens = int(os.getenv('VECTORIZE_MIN_TOKENS', '30000'))
        min_paragraphs = int(os.getenv('VECTORIZE_MIN_PARAGRAPHS', '800'))
        min_docs = int(os.getenv('VECTORIZE_MIN_DOCS', '3'))
    except ValueError:
        min_tokens, min_paragraphs, min_docs = 30000, 800, 3

    total_chars = 0
    total_paragraphs = 0
    doc_count = len(documents or [])

    for d in documents or []:
        content = d.get('content', '') or ''
        total_chars += len(content)
        total_paragraphs += len(d.get('paragraphs', []) or [])

    est_tokens = _estimate_tokens_from_text_length(total_chars)

    should = (est_tokens >= min_tokens) or (total_paragraphs >= min_paragraphs) or (doc_count >= min_docs)

    return {
        'should_vectorize': should,
        'metrics': {
            'doc_count': doc_count,
            'total_chars': total_chars,
            'estimated_tokens': est_tokens,
            'total_paragraphs': total_paragraphs,
            'thresholds': {
                'min_tokens': min_tokens,
                'min_paragraphs': min_paragraphs,
                'min_docs': min_docs
            }
        }
    }

def _build_naive_chunks_from_documents(documents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Create simple text chunks from paragraphs so downstream context code works without embeddings."""
    chunks: List[Dict[str, Any]] = []
    if not documents:
        return chunks
    for doc in documents:
        filename = doc.get('filename', 'unknown')
        paragraphs = doc.get('paragraphs', []) or []
        for idx, p in enumerate(paragraphs):
            if p and p.strip():
                chunks.append({
                    'id': f"{filename}_p_{idx}",
                    'text': p.strip(),
                    'embedding': None,  # not available
                    'metadata': {
                        'filename': filename,
                        'chunk_index': idx,
                        'total_chunks': len(paragraphs),
                        'file_type': doc.get('file_type', 'unknown'),
                        'size': doc.get('size', 0),
                        'source_transcript': doc
                    }
                })
    return chunks

# Initialize services
try:
    initialize_services()
    logger.info("🚀 Interview ETL Worker initialized with AI processing pipeline!")
except Exception as e:
    logger.error(f"❌ Failed to initialize worker: {e}")
    # Don't raise here - let the app start but log the error

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for Cloud Run with comprehensive service status"""
    try:
        # Test Google Cloud services
        services_status = {
            'document_processor': document_processor is not None,
            'extraction_engine': extraction_engine is not None,
            'requirements_converter': requirements_converter is not None,
            'vector_processor': vector_processor is not None,
            'storage_client': storage_client is not None,
            'firestore_client': firestore_client is not None,
            'publisher': publisher is not None,
            'subscriber': subscriber is not None
        }
        
        # Check if all critical services are ready
        all_ready = all(services_status.values())
        
        return jsonify({
            'status': 'healthy' if all_ready else 'degraded',
            'timestamp': datetime.utcnow().isoformat(),
            'services': services_status,
            'environment': {
                'project_id': os.getenv('GOOGLE_CLOUD_PROJECT'),
                'bucket_name': os.getenv('STORAGE_BUCKET_NAME'),
                'gemini_available': bool(os.getenv('GEMINI_API_KEY')),
                'openai_available': bool(os.getenv('OPENAI_API_KEY'))
            }
        })
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({
            'status': 'unhealthy',
            'timestamp': datetime.utcnow().isoformat(),
            'error': str(e)
        }), 500

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
                
                logger.info(f"Processed file: {filename} ({len(paragraphs)} paragraphs)")
                
            except Exception as e:
                logger.error(f"Error processing file {blob.name}: {str(e)}")
                continue
        
        if not documents:
            raise Exception(f"No documents found for job {job_id}")
        
        logger.info(f"Successfully processed {len(documents)} documents")
        return documents
        
    except Exception as e:
        logger.error(f"Error downloading documents: {str(e)}")
        raise

async def process_documents_with_ai(documents: List[Dict[str, Any]], construct: Dict[str, Any]):
    """Process documents using AI to extract user stories with vectorization"""
    try:
        logger.info("🤖 Starting AI-powered document processing with vectorization...")
        
        # Step 1: Conditionally vectorize transcripts for enhanced context
        decision = _should_vectorize(documents)
        logger.info(
            "🧮 Vectorization decision: %s | metrics=%s",
            'YES' if decision['should_vectorize'] else 'NO',
            decision['metrics']
        )

        if decision['should_vectorize']:
            logger.info("🧠 Step 1: Vectorizing interview transcripts (large input detected)...")
            vectorization_result = await vector_processor.vectorize_transcripts(documents)
            if vectorization_result.get('vectorized'):
                logger.info(f"✅ Successfully vectorized {vectorization_result['total_chunks']} chunks")
                vectorized_chunks = vectorization_result['chunks']
            else:
                logger.warning("⚠️ Vectorization failed, falling back to naive chunks from paragraphs")
                vectorized_chunks = _build_naive_chunks_from_documents(documents)
        else:
            # Small inputs: skip expensive embedding call, but still build chunks for context
            logger.info("⚡ Skipping vectorization for small input; building naive context chunks")
            vectorized_chunks = _build_naive_chunks_from_documents(documents)
        
        # Step 2: Process documents to extract text and structure
        processed_docs = await document_processor.process_documents(documents)
        logger.info(f"📄 Processed {len(processed_docs)} documents")
        
        # Step 3: Extract user stories using AI with enhanced context
        all_stories = []
        for doc in processed_docs:
            logger.info(f"🧠 AI analyzing document: {doc.get('filename', 'Unknown')}")
            
            # Extract stories from each paragraph
            for i, paragraph in enumerate(doc.get('paragraphs', [])):
                if paragraph.strip():
                    # Get relevant context chunks for this paragraph
                    context_chunks = vector_processor.get_context_for_extraction(
                        paragraph, 
                        vectorized_chunks, 
                        context_window=3
                    )
                    
                    # Extract story using AI with enhanced context
                    story = await extraction_engine.extract_story_from_text_with_context(
                        paragraph, 
                        doc, 
                        i, 
                        context_chunks
                    )
                    
                    if story:
                        all_stories.append(story)
                        logger.info(f"✅ Extracted story: {story.get('User Story', 'Unknown')[:50]}...")
        
        logger.info(f"🎯 Total user stories extracted: {len(all_stories)}")
        return all_stories
        
    except Exception as e:
        logger.error(f"Error in AI document processing: {str(e)}")
        raise

def convert_stories_to_requirements(user_stories: List[Dict[str, Any]], user_stories_construct: Dict[str, Any], vectorized_chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Convert user stories to requirements using Gemini AI with both constructs"""
    try:
        logger.info("🔄 Starting requirements conversion with Gemini AI...")
        logger.info(f"📊 User stories construct: {user_stories_construct.get('name', 'Unknown') if user_stories_construct else 'None'}")
        logger.info(f"📋 Requirements construct: {requirements_converter.requirements_construct.get('name', 'Unknown') if requirements_converter.requirements_construct else 'None'}")
        
        # Use the requirements converter to generate requirements
        requirements = requirements_converter.convert_stories_to_requirements(user_stories, user_stories_construct, vectorized_chunks)
        
        logger.info(f"📋 Successfully converted {len(user_stories)} stories to {len(requirements)} requirements")
        return requirements
        
    except Exception as e:
        logger.error(f"Error converting stories to requirements: {str(e)}")
        raise

def generate_and_upload_csv(user_stories: List[Dict[str, Any]], requirements: List[Dict[str, Any]], job_id: str):
    """Generate CSV files for both user stories and requirements"""
    try:
        bucket = storage_client.bucket(os.getenv('STORAGE_BUCKET_NAME', 'interview-to-user-stories-data'))
        
        # Generate user stories CSV
        if user_stories:
            stories_csv = generate_stories_csv(user_stories)
            stories_blob = bucket.blob(f"results/{job_id}/user_stories.csv")
            stories_blob.upload_from_string(stories_csv, content_type='text/csv')
            stories_url = f"gs://{bucket.name}/results/{job_id}/user_stories.csv"
            logger.info(f"✅ User stories CSV uploaded: {stories_url}")
        
        # Generate requirements CSV
        if requirements:
            requirements_csv = generate_requirements_csv(requirements)
            requirements_blob = bucket.blob(f"results/{job_id}/requirements.csv")
            requirements_blob.upload_from_string(requirements_csv, content_type='text/csv')
            requirements_url = f"gs://{bucket.name}/results/{job_id}/requirements.csv"
            logger.info(f"✅ Requirements CSV uploaded: {requirements_url}")
        
        return {
            'stories_csv_url': stories_url if user_stories else None,
            'requirements_csv_url': requirements_url if requirements else None
        }
        
    except Exception as e:
        logger.error(f"Error generating and uploading CSV files: {str(e)}")
        raise

def generate_stories_csv(user_stories: List[Dict[str, Any]]) -> str:
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

def generate_requirements_csv(requirements: List[Dict[str, Any]]) -> str:
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
        logger.info(f"🚀 Starting job processing for job ID: {job_id}")
        start_time = time.time()
        
        # Update job status to processing
        job_ref = firestore_client.collection('jobs').document(job_id)
        job_ref.update({
            'status': 'PROCESSING',
            'updated_at': datetime.utcnow()
        })
        
        # Step 1: Download and extract documents
        logger.info("📥 Step 1: Downloading and extracting documents...")
        documents = download_and_extract(job_id)
        
        # Step 2: Get job details from Firestore
        job_doc = job_ref.get()
        if not job_doc.exists:
            raise Exception(f"Job {job_id} not found in Firestore")
        
        job_data = job_doc.to_dict()
        construct = job_data.get('construct', {})
        requirements_construct = job_data.get('requirements_construct', {})
        
        # Step 3: Process documents with AI to extract user stories
        logger.info("🤖 Step 2: Processing documents with AI...")
        user_stories = asyncio.run(process_documents_with_ai(documents, construct))
        
        # Get vectorized chunks for requirements processing
        vectorized_chunks = []
        try:
            vectorization_result = asyncio.run(vector_processor.vectorize_transcripts(documents))
            if vectorization_result.get('vectorized'):
                vectorized_chunks = vectorization_result['chunks']
                logger.info(f"✅ Retrieved {len(vectorized_chunks)} vectorized chunks for requirements")
        except Exception as e:
            logger.warning(f"⚠️ Failed to get vectorized chunks for requirements: {e}")
            vectorized_chunks = []
        
        # Step 4: Convert user stories to requirements using Gemini AI
        logger.info("🔄 Step 3: Converting user stories to requirements...")
        
        # Pass vectorized chunks for enhanced context
        requirements = convert_stories_to_requirements(user_stories, construct, vectorized_chunks)
        
        # Step 5: Generate and upload CSV files
        logger.info("�� Step 4: Generating and uploading results...")
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
        
        logger.info(f"✅ Job {job_id} completed successfully!")
        logger.info(f"📊 Results: {len(user_stories)} user stories, {len(requirements)} requirements")
        logger.info(f"⏱️ Processing time: {processing_time:.2f} seconds")
        
    except Exception as e:
        logger.error(f"❌ Error processing job {job_id}: {str(e)}")
        
        # Update job status to failed
        try:
            job_ref = firestore_client.collection('jobs').document(job_id)
            job_ref.update({
                'status': 'FAILED',
                'error': str(e),
                'updated_at': datetime.utcnow()
            })
        except Exception as update_error:
            logger.error(f"Failed to update job status: {update_error}")

def start_worker():
    """Start the background worker process"""
    logger.info("🔄 Starting background worker process...")
    
    subscription_path = subscriber.subscription_path(
        os.getenv('PUBSUB_PROJECT_ID', 'interview-to-user-stories'),
        os.getenv('PUBSUB_SUBSCRIPTION_NAME', 'interview-etl-jobs')
    )
    
    def callback(message):
        try:
            data = json.loads(message.data.decode('utf-8'))
            job_id = data.get('job_id')
            
            if job_id:
                logger.info(f"📨 Received job message: {job_id}")
                process_job(job_id)
                message.ack()
            else:
                logger.warning("⚠️ Invalid job message format")
                message.nack()
                
        except Exception as e:
            logger.error(f"❌ Error processing message: {e}")
            message.nack()
    
    # Start listening for messages
    streaming_pull_future = subscriber.subscribe(subscription_path, callback=callback)
    logger.info("👂 Listening for job messages...")
    
    try:
        streaming_pull_future.result()
    except KeyboardInterrupt:
        streaming_pull_future.cancel()
        logger.info("🛑 Worker stopped by user")

if __name__ == "__main__":
    # Start worker in background thread
    worker_thread = threading.Thread(target=start_worker, daemon=True)
    worker_thread.start()
    
    # Run Flask app on main thread for Cloud Run
    port = int(os.getenv('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False)
