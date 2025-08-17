import asyncio
import os
import zipfile
import tempfile
from typing import List, Dict, Any
from datetime import datetime
import csv
import io

from google.cloud import pubsub_v1, firestore, storage
from google.cloud import generativeai as genai
import openai

from processors.document_processor import DocumentProcessor
from processors.extraction_engine import ExtractionEngine
from processors.deduplication import DeduplicationEngine
from models import JobStatus, UserStory, ProcessingResult

# Initialize clients
subscriber = pubsub_v1.SubscriberClient()
publisher = pubsub_v1.PublisherClient()
db = firestore.Client()
storage_client = storage.Client()

# Configuration
PROJECT_ID = os.getenv("GCP_PROJECT_ID", "tp-interview2stories")
SUBSCRIPTION_NAME = f"projects/{PROJECT_ID}/subscriptions/jobs.process"
BUCKET_NAME = os.getenv("GCS_BUCKET", "tp-interview2stories")
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini")

# Initialize AI clients
if LLM_PROVIDER == "gemini":
    genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
    model = genai.GenerativeModel('gemini-pro')
elif LLM_PROVIDER == "openai":
    openai.api_key = os.getenv("OPENAI_API_KEY")

async def process_job(job_id: str):
    """Main job processing pipeline"""
    try:
        print(f"Starting processing for job {job_id}")
        
        # Update job status to PROCESSING
        await update_job_status(job_id, JobStatus.PROCESSING)
        
        # Download and extract ZIP file
        documents = await download_and_extract(job_id)
        if not documents:
            raise Exception("No documents found in ZIP file")
        
        # Get job construct
        construct = await get_job_construct(job_id)
        
        # Process documents
        processor = DocumentProcessor()
        normalized_texts = await processor.process_documents(documents)
        
        # Extract user stories using AI
        extraction_engine = ExtractionEngine(construct, LLM_PROVIDER)
        user_stories = await extraction_engine.extract_stories(normalized_texts)
        
        # Deduplicate and score
        dedup_engine = DeduplicationEngine()
        final_stories = await dedup_engine.deduplicate_and_score(user_stories)
        
        # Generate CSV and upload
        csv_url = await generate_and_upload_csv(job_id, final_stories)
        
        # Update job completion
        metrics = {
            "total_files": len(documents),
            "total_stories": len(final_stories),
            "processing_time": datetime.utcnow().isoformat()
        }
        
        await update_job_completion(job_id, csv_url, metrics)
        
        print(f"Job {job_id} completed successfully")
        
    except Exception as e:
        print(f"Error processing job {job_id}: {str(e)}")
        await update_job_error(job_id, str(e))

async def download_and_extract(job_id: str) -> List[Dict[str, Any]]:
    """Download ZIP file and extract documents"""
    bucket = storage_client.bucket(BUCKET_NAME)
    blob = bucket.blob(f"uploads/{job_id}/interview_data.zip")
    
    with tempfile.NamedTemporaryFile() as tmp_file:
        blob.download_to_filename(tmp_file.name)
        
        documents = []
        with zipfile.ZipFile(tmp_file.name, 'r') as zip_ref:
            for file_info in zip_ref.filelist:
                if file_info.filename.endswith(('.txt', '.docx', '.md', '.pdf')):
                    content = zip_ref.read(file_info.filename)
                    documents.append({
                        "filename": file_info.filename,
                        "content": content,
                        "file_type": file_info.filename.split('.')[-1]
                    })
    
    return documents

async def get_job_construct(job_id: str) -> Dict[str, Any]:
    """Get construct template for the job"""
    job_doc = db.collection("Jobs").document(job_id).get()
    job_data = job_doc.to_dict()
    
    if job_data.get("construct_id"):
        construct_doc = db.collection("Constructs").document(job_data["construct_id"]).get()
        return construct_doc.to_dict()
    elif job_data.get("custom_construct"):
        return job_data["custom_construct"]
    else:
        # Return default construct
        return {
            "output_schema": ["User Story ID", "User Story", "Team", "Category", "Lifecycle Phase", "Capability", "Priority", "Source", "Snippet", "Match Score", "Tags"],
            "pattern": "As a {{role}}, I need {{capability}} so that {{benefit}}.",
            "defaults": {"Category": "Workflow", "Lifecycle Phase": "Execution"}
        }

async def generate_and_upload_csv(job_id: str, user_stories: List[UserStory]) -> str:
    """Generate CSV and upload to GCS"""
    # Create CSV content
    output = io.StringIO()
    if user_stories:
        fieldnames = user_stories[0].__fields__.keys()
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        
        for story in user_stories:
            writer.writerow(story.dict())
    
    csv_content = output.getvalue()
    
    # Upload to GCS
    bucket = storage_client.bucket(BUCKET_NAME)
    blob = bucket.blob(f"results/{job_id}/user_stories.csv")
    blob.upload_from_string(csv_content, content_type="text/csv")
    
    return f"gs://{BUCKET_NAME}/results/{job_id}/user_stories.csv"

async def update_job_status(job_id: str, status: JobStatus):
    """Update job status in Firestore"""
    db.collection("Jobs").document(job_id).update({
        "status": status,
        "updated_at": datetime.utcnow()
    })

async def update_job_completion(job_id: str, csv_url: str, metrics: Dict[str, Any]):
    """Update job with completion data"""
    db.collection("Jobs").document(job_id).update({
        "status": JobStatus.COMPLETED,
        "csv_url": csv_url,
        "metrics": metrics,
        "completed_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    })

async def update_job_error(job_id: str, error_message: str):
    """Update job with error information"""
    db.collection("Jobs").document(job_id).update({
        "status": JobStatus.FAILED,
        "error_message": error_message,
        "updated_at": datetime.utcnow()
    })

def callback(message):
    """Pub/Sub message callback"""
    job_id = message.data.decode("utf-8")
    print(f"Received message for job {job_id}")
    
    # Process job asynchronously
    asyncio.create_task(process_job(job_id))
    
    # Acknowledge message
    message.ack()

def main():
    """Main worker function"""
    print("Starting Interview ETL Worker...")
    
    # Subscribe to Pub/Sub topic
    subscription_path = subscriber.subscription_path(PROJECT_ID, "jobs.process")
    streaming_pull_future = subscriber.subscribe(subscription_path, callback=callback)
    
    print(f"Listening for messages on {subscription_path}")
    
    try:
        streaming_pull_future.result()
    except KeyboardInterrupt:
        streaming_pull_future.cancel()
        streaming_pull_future.result()

if __name__ == "__main__":
    main()
