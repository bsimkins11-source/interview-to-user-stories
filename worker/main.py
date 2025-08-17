import os
import json
import asyncio
from google.cloud import firestore
from google.cloud import storage
from google.cloud import pubsub_v1
from google.auth import default
from processors.document_processor import DocumentProcessor
from processors.extraction_engine import ExtractionEngine
from processors.deduplication import DeduplicationEngine
from processors.consistency_checker import ConsistencyChecker
from shared.models import JobStatus, ProcessingResult
from typing import List, Dict, Any

# Initialize Google Cloud clients
credentials, project = default()
firestore_client = firestore.Client(project=project)
storage_client = storage.Client(project=project)
publisher = pubsub_v1.PublisherClient()
subscriber = pubsub_v1.SubscriberClient()

# Initialize processors
document_processor = DocumentProcessor()
consistency_checker = ConsistencyChecker()

async def process_job(job_id: str, construct: Dict[str, Any]) -> ProcessingResult:
    """Process a job with deterministic and consistent output"""
    try:
        print(f"Starting processing for job {job_id}")
        
        # Update job status to processing
        await update_job_status(job_id, JobStatus.PROCESSING)
        
        # Download and extract documents
        documents = await download_and_extract(job_id)
        if not documents:
            raise Exception("No documents found for processing")
        
        # Generate input hash for consistency checking
        input_hash = consistency_checker.generate_input_hash(documents, construct)
        print(f"Input hash: {input_hash}")
        
        # Process documents
        processed_docs = await document_processor.process_documents(documents)
        print(f"Processed {len(processed_docs)} documents")
        
        # Extract user stories using AI
        extraction_engine = ExtractionEngine(construct)
        extracted_stories = await extraction_engine.extract_stories(processed_docs)
        print(f"Extracted {len(extracted_stories)} user stories")
        
        # Deduplicate and score stories
        dedup_engine = DeduplicationEngine()
        final_stories = await dedup_engine.deduplicate_and_score(extracted_stories)
        print(f"Final output: {len(final_stories)} stories after deduplication")
        
        # Check consistency with previous runs
        consistency_report = consistency_checker.get_consistency_report(input_hash, final_stories)
        print(f"Consistency check: {consistency_report['consistency_check']['message']}")
        
        # Generate CSV output
        csv_url = await generate_and_upload_csv(job_id, final_stories)
        
        # Update job completion
        await update_job_completion(job_id, final_stories, csv_url, consistency_report)
        
        return ProcessingResult(
            success=True,
            stories_count=len(final_stories),
            csv_url=csv_url,
            consistency_report=consistency_report
        )
        
    except Exception as e:
        print(f"Error processing job {job_id}: {str(e)}")
        await update_job_error(job_id, str(e))
        return ProcessingResult(
            success=False,
            error=str(e)
        )

async def download_and_extract(job_id: str) -> List[Dict[str, Any]]:
    """Download and extract documents from Cloud Storage"""
    try:
        bucket = storage_client.bucket(os.getenv('STORAGE_BUCKET_NAME', 'interview-to-user-stories-data'))
        blob = bucket.blob(f"uploads/{job_id}/documents.zip")
        
        if not blob.exists():
            raise Exception(f"Documents not found for job {job_id}")
        
        # Download the ZIP file
        zip_content = blob.download_as_bytes()
        
        # Extract ZIP contents (simplified for demo)
        # In production, you'd use zipfile module to extract individual files
        documents = [
            {
                'filename': f'document_{i}.txt',
                'file_type': '.txt',
                'content': zip_content[:1000]  # Simplified for demo
            }
            for i in range(3)  # Simulate 3 documents
        ]
        
        return documents
        
    except Exception as e:
        print(f"Error downloading documents: {str(e)}")
        raise

async def get_job_construct(job_id: str) -> Dict[str, Any]:
    """Get the construct template for the job"""
    try:
        doc_ref = firestore_client.collection('jobs').document(job_id)
        doc = doc_ref.get()
        
        if doc.exists:
            job_data = doc.to_dict()
            return job_data.get('construct', {})
        else:
            # Return default construct if none exists
            return {
                'defaults': {
                    'Team': 'Product',
                    'Category': 'Workflow',
                    'Lifecycle Phase': 'Execution',
                    'Priority': 'Medium'
                }
            }
    except Exception as e:
        print(f"Error getting construct: {str(e)}")
        return {}

async def generate_and_upload_csv(job_id: str, stories: List[Dict[str, Any]]) -> str:
    """Generate CSV and upload to Cloud Storage"""
    try:
        # Generate CSV content
        csv_content = "User Story ID,User Story,Team,Category,Lifecycle Phase,Capability,Priority,Source,Snippet,Match Score,Tags,Content Hash,Extraction Method\n"
        
        for story in stories:
            csv_line = [
                story.get('User Story ID', ''),
                f'"{story.get("User Story", "").replace('"', '""')}"',
                story.get('Team', ''),
                story.get('Category', ''),
                story.get('Lifecycle Phase', ''),
                f'"{story.get("Capability", "").replace('"', '""')}"',
                story.get('Priority', ''),
                story.get('Source', ''),
                f'"{story.get("Snippet", "").replace('"', '""')}"',
                str(story.get('Match Score', '')),
                ';'.join(story.get('Tags', [])),
                story.get('Content Hash', ''),
                story.get('Extraction Method', '')
            ]
            csv_content += ','.join(csv_line) + '\n'
        
        # Upload to Cloud Storage
        bucket = storage_client.bucket(os.getenv('STORAGE_BUCKET_NAME', 'interview-to-user-stories-data'))
        blob = bucket.blob(f"results/{job_id}/user_stories.csv")
        
        blob.upload_from_string(csv_content, content_type='text/csv')
        
        # Generate signed URL for download
        url = blob.generate_signed_url(
            version="v4",
            expiration=3600,  # 1 hour
            method="GET"
        )
        
        return url
        
    except Exception as e:
        print(f"Error generating CSV: {str(e)}")
        raise

async def update_job_status(job_id: str, status: JobStatus):
    """Update job status in Firestore"""
    try:
        doc_ref = firestore_client.collection('jobs').document(job_id)
        doc_ref.update({
            'status': status.value,
            'updated_at': firestore.SERVER_TIMESTAMP
        })
    except Exception as e:
        print(f"Error updating job status: {str(e)}")

async def update_job_completion(job_id: str, stories: List[Dict[str, Any]], csv_url: str, consistency_report: Dict[str, Any]):
    """Update job completion in Firestore"""
    try:
        doc_ref = firestore_client.collection('jobs').document(job_id)
        doc_ref.update({
            'status': JobStatus.COMPLETED.value,
            'completed_at': firestore.SERVER_TIMESTAMP,
            'stories_count': len(stories),
            'csv_url': csv_url,
            'consistency_report': consistency_report,
            'output_hash': consistency_report['consistency_check']['current_hash']
        })
    except Exception as e:
        print(f"Error updating job completion: {str(e)}")

async def update_job_error(job_id: str, error_message: str):
    """Update job error in Firestore"""
    try:
        doc_ref = firestore_client.collection('jobs').document(job_id)
        doc_ref.update({
            'status': JobStatus.FAILED.value,
            'error': error_message,
            'updated_at': firestore.SERVER_TIMESTAMP
        })
    except Exception as e:
        print(f"Error updating job error: {str(e)}")

def callback(message):
    """Process messages from Pub/Sub"""
    try:
        data = json.loads(message.data.decode('utf-8'))
        job_id = data.get('job_id')
        
        if not job_id:
            print("No job_id in message")
            message.ack()
            return
        
        print(f"Processing message for job {job_id}")
        
        # Get construct template
        construct = asyncio.run(get_job_construct(job_id))
        
        # Process the job
        result = asyncio.run(process_job(job_id, construct))
        
        if result.success:
            print(f"Job {job_id} completed successfully")
        else:
            print(f"Job {job_id} failed: {result.error}")
        
        # Acknowledge the message
        message.ack()
        
    except Exception as e:
        print(f"Error processing message: {str(e)}")
        message.ack()  # Acknowledge to prevent infinite retries

def main():
    """Main function to start the worker"""
    subscription_path = subscriber.subscription_path(
        os.getenv('PUBSUB_PROJECT_ID', 'interview-to-user-stories'),
        os.getenv('PUBSUB_SUBSCRIPTION_NAME', 'interview-processing-subscription')
    )
    
    print("Starting Interview ETL Worker...")
    print(f"Listening to subscription: {subscription_path}")
    
    # Start listening for messages
    streaming_pull_future = subscriber.subscribe(
        subscription_path, callback=callback
    )
    
    try:
        streaming_pull_future.result()
    except KeyboardInterrupt:
        streaming_pull_future.cancel()
        print("Worker stopped by user")
    except Exception as e:
        print(f"Error in worker: {str(e)}")
        streaming_pull_future.cancel()

if __name__ == "__main__":
    main()
