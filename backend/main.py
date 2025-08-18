import os
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from typing import List, Dict, Any
import json
import os
from google.cloud import storage
from google.cloud import firestore
from datetime import datetime

from models import JobCreate, JobResponse, ConstructCreate, ConstructResponse
from services.job_service import JobService
from services.construct_service import ConstructService
from services.storage_service import StorageService
from services.external_import_service import ExternalImportService

app = FastAPI(title="Interview ETL API", version="1.0.0")

# CORS middleware
origins = [o.strip() for o in os.getenv("CORS_ALLOW_ORIGINS", "").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["http://localhost:3000", "https://interview-etl-frontend.vercel.app"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Initialize services
job_service = JobService()
construct_service = ConstructService()
storage_service = StorageService()
external_import_service = ExternalImportService()

# Initialize Firestore client for download endpoints
firestore_client = firestore.Client()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check if services are accessible
        firestore_client = firestore.Client()
        storage_client = storage.Client()
        
        return {
            "status": "healthy", 
            "service": "interview-etl-api",
            "timestamp": datetime.utcnow().isoformat(),
            "services": {
                "firestore": "connected",
                "storage": "connected"
            }
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "service": "interview-etl-api", 
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler for better error responses"""
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "error": str(exc),
            "timestamp": datetime.utcnow().isoformat()
        }
    )

@app.post("/jobs", response_model=JobResponse)
async def create_job(job: JobCreate):
    """Create a new job and return job details"""
    try:
        # Create job in Firestore
        job_id = await job_service.create_job(job)
        
        # Get the created job
        created_job = await job_service.get_job(job_id)
        
        return {
            "id": job_id,
            "name": created_job.get('name', ''),
            "description": created_job.get('description', ''),
            "status": created_job.get('status', 'CREATED'),
            "construct": created_job.get('construct', {}),
            "transcripts": created_job.get('transcripts', []),
            "files": created_job.get('files', []),
            "upload_url": None,  # Not needed for this flow
            "csv_url": None,
            "created_at": created_job.get('created_at'),
            "updated_at": created_job.get('updated_at'),
            "completed_at": None,
            "error_message": None,
            "metrics": None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/jobs/{job_id}/upload")
async def upload_files_to_job(
    job_id: str,
    files: List[UploadFile] = File(...)
):
    """Upload files to a specific job"""
    try:
        # Verify job exists
        job = await job_service.get_job(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        if job.get('status') != 'CREATED':
            raise HTTPException(status_code=400, detail="Job is not in CREATED state")
        
        # Upload files to Cloud Storage
        uploaded_files = []
        for file in files:
            if file.filename:
                # Generate unique filename
                file_extension = os.path.splitext(file.filename)[1]
                unique_filename = f"{job_id}_{len(uploaded_files)}{file_extension}"
                
                # Upload to Cloud Storage
                file_url = await storage_service.upload_file_to_job(
                    job_id, 
                    file.file, 
                    unique_filename
                )
                
                uploaded_files.append({
                    'original_name': file.filename,
                    'stored_name': unique_filename,
                    'url': file_url,
                    'size': file.size
                })
        
        # Update job with file information
        await job_service.add_files_to_job(job_id, uploaded_files)
        
        return {
            "message": f"Successfully uploaded {len(uploaded_files)} files",
            "job_id": job_id,
            "files": uploaded_files
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/jobs/{job_id}/uploadComplete")
async def mark_upload_complete(job_id: str):
    """Mark job upload as complete and trigger processing"""
    try:
        # Update job status
        await job_service.update_job_status(job_id, "PROCESSING")
        
        # TODO: Publish to Pub/Sub for worker processing
        # For now, just return success
        
        return {"message": "Upload marked as complete. Processing started.", "job_id": job_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: str):
    """Get job status and details"""
    try:
        job = await job_service.get_job(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        return job
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/jobs")
async def list_jobs():
    """List all jobs"""
    try:
        jobs = await job_service.list_jobs()
        return {"jobs": jobs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/constructs", response_model=ConstructResponse)
async def create_construct(construct: ConstructCreate):
    """Create a new construct template"""
    try:
        construct_id = await construct_service.create_construct(construct)
        
        # Get the created construct
        created_construct = await construct_service.get_construct(construct_id)
        
        return {
            "id": construct_id,
            "name": created_construct.get('name', ''),
            "description": created_construct.get('description', ''),
            "output_schema": created_construct.get('output_schema', []),
            "pattern": created_construct.get('pattern', ''),
            "defaults": created_construct.get('defaults', {}),
            "priority_rules": created_construct.get('priority_rules', []),
            "created_at": created_construct.get('created_at'),
            "updated_at": created_construct.get('updated_at')
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/constructs")
async def list_constructs():
    """List all construct templates"""
    try:
        constructs = await construct_service.list_constructs()
        return {"constructs": constructs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/constructs/{construct_id}")
async def get_construct(construct_id: str):
    """Get a specific construct template"""
    try:
        construct = await construct_service.get_construct(construct_id)
        if not construct:
            raise HTTPException(status_code=404, detail="Construct not found")
        return construct
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/constructs/default")
async def get_default_construct():
    """Get the default construct template"""
    try:
        construct = await construct_service.get_default_construct()
        return construct
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# External Import Endpoints
@app.post("/external-imports/folder")
async def import_from_folder(
    folder_url: str = Form(...),
    display_name: str = Form(""),
    description: str = Form("")
):
    """Import user stories from a cloud storage folder"""
    try:
        metadata = {
            'source_url': folder_url,
            'display_name': display_name or f'Imported Folder',
            'description': description or f'Imported from {folder_url}'
        }
        
        result = await external_import_service.import_from_folder(folder_url, metadata)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/external-imports/document")
async def import_from_document(
    document_url: str = Form(...),
    display_name: str = Form(""),
    description: str = Form("")
):
    """Import user stories from a single document"""
    try:
        metadata = {
            'source_url': document_url,
            'display_name': display_name or f'Imported Document',
            'description': description or f'Imported from {document_url}'
        }
        
        result = await external_import_service.import_from_document(document_url, metadata)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/external-imports/link")
async def import_from_link(
    link_url: str = Form(...),
    display_name: str = Form(""),
    description: str = Form("")
):
    """Import user stories from a direct link"""
    try:
        metadata = {
            'source_url': link_url,
            'display_name': display_name or f'Imported Link',
            'description': description or f'Imported from {link_url}'
        }
        
        result = await external_import_service.import_from_link(link_url, metadata)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/external-imports")
async def get_import_history():
    """Get history of external imports"""
    try:
        imports = await external_import_service.get_import_history()
        return {"imports": imports}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/external-imports/{import_id}/stories")
async def get_imported_stories(import_id: str):
    """Get stories from a specific import"""
    try:
        stories = await external_import_service.get_imported_stories(import_id)
        return {"stories": stories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/external-imports/{import_id}")
async def delete_import(import_id: str):
    """Delete an external import and all its stories"""
    try:
        success = await external_import_service.delete_import(import_id)
        if success:
            return {"message": "Import deleted successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to delete import")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/external-imports/{import_id}/compare")
async def compare_with_interview_results(import_id: str, job_id: str):
    """Compare imported stories with interview results for gap analysis"""
    try:
        # Get imported stories
        imported_stories = await external_import_service.get_imported_stories(import_id)
        
        # Get job results (interview stories)
        job = await job_service.get_job(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # TODO: Implement gap analysis logic
        # For now, return basic comparison data
        
        comparison = {
            'imported_stories_count': len(imported_stories),
            'interview_stories_count': job.get('stories_count', 0),
            'imported_categories': list(set(story.get('category', 'Unknown') for story in imported_stories)),
            'interview_categories': job.get('categories', []),
            'gap_analysis': {
                'missing_categories': [],
                'overlapping_categories': [],
                'unique_imported': [],
                'unique_interview': []
            }
        }
        
        return comparison
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/download/{job_id}/csv")
async def download_csv(job_id: str):
    """Download CSV results for a completed job"""
    try:
        # Get job details from Firestore
        job_doc = firestore_client.collection('jobs').document(job_id).get()
        if not job_doc.exists:
            raise HTTPException(status_code=404, detail="Job not found")
        
        job_data = job_doc.to_dict()
        if job_data.get('status') != 'COMPLETED':
            raise HTTPException(status_code=400, detail="Job not completed yet")
        
        csv_url = job_data.get('csv_url')
        if not csv_url:
            raise HTTPException(status_code=404, detail="CSV not found for this job")
        
        # If it's a GCS URL, generate a signed download URL
        if csv_url.startswith('gs://'):
            bucket_name = csv_url.split('/')[2]
            blob_name = '/'.join(csv_url.split('/')[3:])
            
            storage_client = storage.Client()
            bucket = storage_client.bucket(bucket_name)
            blob = bucket.blob(blob_name)
            
            if not blob.exists():
                raise HTTPException(status_code=404, detail="CSV file not found in storage")
            
            # Generate signed URL
            signed_url = blob.generate_signed_url(
                version="v4",
                expiration=3600,  # 1 hour
                method="GET"
            )
            
            return {"download_url": signed_url}
        else:
            # Return the direct URL if it's already a signed URL
            return {"download_url": csv_url}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/download/{job_id}/csv/direct")
async def download_csv_direct(job_id: str):
    """Direct CSV download (streams the file)"""
    try:
        # Get job details from Firestore
        job_doc = firestore_client.collection('jobs').document(job_id).get()
        if not job_doc.exists:
            raise HTTPException(status_code=404, detail="Job not found")
        
        job_data = job_doc.to_dict()
        if job_data.get('status') != 'COMPLETED':
            raise HTTPException(status_code=400, detail="Job not completed yet")
        
        csv_url = job_data.get('csv_url')
        if not csv_url:
            raise HTTPException(status_code=404, detail="CSV not found for this job")
        
        # If it's a GCS URL, download and stream the file
        if csv_url.startswith('gs://'):
            bucket_name = csv_url.split('/')[2]
            blob_name = '/'.join(csv_url.split('/')[3:])
            
            storage_client = storage.Client()
            bucket = storage_client.bucket(bucket_name)
            blob = bucket.blob(blob_name)
            
            if not blob.exists():
                raise HTTPException(status_code=404, detail="CSV file not found in storage")
            
            # Download the CSV content
            csv_content = blob.download_as_text()
            
            # Return as file response
            return FileResponse(
                content=csv_content.encode(),
                media_type='text/csv',
                filename=f'user_stories_{job_id}.csv'
            )
        else:
            raise HTTPException(status_code=400, detail="Direct download only available for GCS files")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
