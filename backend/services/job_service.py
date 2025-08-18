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
    
    async def create_job(self, job: JobCreate) -> str:
        """Create a new job in Firestore and return the job ID"""
        job_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        job_data = {
            "id": job_id,
            "name": job.name or f"Interview ETL Job {now.strftime('%Y%m%d-%H%M%S')}",
            "description": job.description or "AI-powered interview transcript processing",
            "status": JobStatus.CREATED.value,
            "construct": job.construct,
            "transcripts": job.transcripts,
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
    
    async def update_job_completion(self, job_id: str, csv_url: str, metrics: dict) -> bool:
        """Update job with completion data"""
        try:
            now = datetime.utcnow()
            doc_ref = self.collection.document(job_id)
            doc_ref.update({
                "status": JobStatus.COMPLETED.value,
                "csv_url": csv_url,
                "metrics": metrics,
                "completed_at": now,
                "updated_at": now
            })
            return True
        except Exception:
            return False
    
    async def list_jobs(self, limit: int = 50) -> List[dict]:
        """List recent jobs"""
        docs = self.collection.order_by("created_at", direction=firestore.Query.DESCENDING).limit(limit).stream()
        return [doc.to_dict() for doc in docs]
