from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from typing import List, Optional
import uuid
from datetime import datetime

from models import JobCreate, JobResponse, JobStatus, ConstructCreate, ConstructResponse
from services.job_service import JobService
from services.construct_service import ConstructService
from services.storage_service import StorageService

app = FastAPI(title="Interview ETL API", version="1.0.0")

# CORS configuration
origins = [o.strip() for o in os.getenv("CORS_ALLOW_ORIGINS", "").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],  # tighten in prod
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# Initialize services
job_service = JobService()
construct_service = ConstructService()
storage_service = StorageService()

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.post("/jobs", response_model=JobResponse)
async def create_job(job: JobCreate):
    """Create a new job and return signed upload URL"""
    try:
        # Create job in Firestore
        job_id = str(uuid.uuid4())
        job_data = await job_service.create_job(job_id, job)
        
        # Generate signed upload URL for ZIP file
        upload_url = await storage_service.generate_signed_upload_url(job_id)
        
        return JobResponse(
            id=job_id,
            status=JobStatus.CREATED,
            upload_url=upload_url,
            created_at=job_data.created_at,
            **job.dict()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/jobs/{job_id}/uploadComplete")
async def mark_upload_complete(job_id: str):
    """Mark job as uploaded and enqueue for processing"""
    try:
        # Update job status to PROCESSING
        await job_service.update_job_status(job_id, JobStatus.PROCESSING)
        
        # TODO: Publish to Pub/Sub for worker processing
        # await pubsub_service.publish_job(job_id)
        
        return {"message": "Job queued for processing", "job_id": job_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: str):
    """Get job status and results"""
    try:
        job = await job_service.get_job(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        return job
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/constructs", response_model=ConstructResponse)
async def create_construct(construct: ConstructCreate):
    """Create a new construct template"""
    try:
        construct_id = str(uuid.uuid4())
        result = await construct_service.create_construct(construct_id, construct)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/constructs", response_model=List[ConstructResponse])
async def list_constructs():
    """List all available constructs"""
    try:
        return await construct_service.list_constructs()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
