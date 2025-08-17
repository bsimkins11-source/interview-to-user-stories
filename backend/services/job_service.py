from typing import Optional, List
from datetime import datetime
import os
from google.cloud import firestore
from models import JobCreate, JobResponse, JobStatus

class JobService:
    def __init__(self):
        self.db = firestore.Client()
        self.collection = self.db.collection(os.getenv("FIRESTORE_COLLECTION_JOBS", "Jobs"))
    
    async def create_job(self, job_id: str, job: JobCreate) -> JobResponse:
        """Create a new job in Firestore"""
        now = datetime.utcnow()
        job_data = {
            "id": job_id,
            "name": job.name,
            "description": job.description,
            "status": JobStatus.CREATED,
            "construct_id": job.construct_id,
            "custom_construct": job.custom_construct,
            "created_at": now,
            "updated_at": now,
        }
        
        doc_ref = self.collection.document(job_id)
        doc_ref.set(job_data)
        
        return JobResponse(**job_data)
    
    async def get_job(self, job_id: str) -> Optional[JobResponse]:
        """Get job by ID"""
        doc = self.collection.document(job_id).get()
        if doc.exists:
            return JobResponse(**doc.to_dict())
        return None
    
    async def update_job_status(self, job_id: str, status: JobStatus) -> bool:
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
                "status": JobStatus.COMPLETED,
                "csv_url": csv_url,
                "metrics": metrics,
                "completed_at": now,
                "updated_at": now
            })
            return True
        except Exception:
            return False
    
    async def list_jobs(self, limit: int = 50) -> List[JobResponse]:
        """List recent jobs"""
        docs = self.collection.order_by("created_at", direction=firestore.Query.DESCENDING).limit(limit).stream()
        return [JobResponse(**doc.to_dict()) for doc in docs]
