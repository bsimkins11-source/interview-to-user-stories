from typing import Optional, List
from datetime import datetime
import os
from google.cloud import firestore
from models import JobCreate, JobResponse, JobStatus
import uuid

class JobService:
    def __init__(self):
        self.db = firestore.Client()
        self.collection = self.db.collection(os.getenv("FIRESTORE_COLLECTION_JOBS", "Jobs"))
    
    async def create_job(self, name: str = None, description: str = None, construct: dict = None, transcripts: list = None) -> str:
        """Create a new job in Firestore and return the job ID"""
        job_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        job_data = {
            "id": job_id,
            "name": name or f"Interview ETL Job {now.strftime('%Y%m%d-%H%M%S')}",
            "description": description or "AI-powered interview transcript processing",
            "status": JobStatus.CREATED.value,
            "construct": construct,
            "transcripts": transcripts,
            "files": [],
            "created_at": now,
            "updated_at": now,
        }
        
        doc_ref = self.collection.document(job_id)
        doc_ref.set(job_data)
        
        return job_id
    
    async def get_job(self, job_id: str) -> Optional[dict]:
        """Get job by ID as a dictionary"""
        doc = self.collection.document(job_id).get()
        if doc.exists:
            return doc.to_dict()
        return None
    
    async def add_files_to_job(self, job_id: str, files: List[dict]) -> bool:
        """Add uploaded files to a job"""
        try:
            doc_ref = self.collection.document(job_id)
            doc_ref.update({
                "files": files,
                "updated_at": datetime.utcnow()
            })
            return True
        except Exception:
            return False
    
    async def update_job_status(self, job_id: str, status: str) -> bool:
        """Update job status"""
        try:
            doc_ref = self.collection.document(job_id)
            doc_ref.update({
                "status": status,
                "updated_at": datetime.utcnow()
            })
            return True
        except Exception:
            return False
    
    async def update_job_completion(self, job_id: str, user_stories_count: int, requirements_count: int, stories_csv_url: str = None, requirements_csv_url: str = None, processing_time: float = None):
        """Update job with completion details"""
        try:
            update_data = {
                "status": JobStatus.COMPLETED.value,
                "user_stories_count": user_stories_count,
                "requirements_count": requirements_count,
                "completed_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            if stories_csv_url:
                update_data["stories_csv_url"] = stories_csv_url
            if requirements_csv_url:
                update_data["requirements_csv_url"] = requirements_csv_url
            if processing_time:
                update_data["processing_time"] = processing_time
            
            doc_ref = self.collection.document(job_id)
            doc_ref.update(update_data)
            
            print(f"✅ Job {job_id} marked as completed with {user_stories_count} stories and {requirements_count} requirements")
            return True
            
        except Exception as e:
            print(f"❌ Error updating job completion: {e}")
            return False
    
    async def list_jobs(self, limit: int = 50) -> List[dict]:
        """List recent jobs"""
        docs = self.collection.order_by("created_at", direction=firestore.Query.DESCENDING).limit(limit).stream()
        return [doc.to_dict() for doc in docs]
