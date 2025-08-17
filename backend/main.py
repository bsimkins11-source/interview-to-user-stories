import os
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Dict, Any
import json

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
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# Initialize services
job_service = JobService()
construct_service = ConstructService()
storage_service = StorageService()
external_import_service = ExternalImportService()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "interview-etl-api"}

@app.post("/jobs", response_model=JobResponse)
async def create_job(job: JobCreate):
    """Create a new job and return signed upload URL"""
    try:
        # Create job in Firestore
        job_id = await job_service.create_job(job)
        
        # Generate signed upload URL
        upload_url = await storage_service.generate_signed_upload_url(job_id)
        
        return JobResponse(
            id=job_id,
            status="CREATED",
            upload_url=upload_url,
            message="Job created successfully. Use the upload URL to upload your files."
        )
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
        return ConstructResponse(
            id=construct_id,
            name=construct.name,
            output_schema=construct.output_schema,
            pattern=construct.pattern,
            defaults=construct.defaults,
            message="Construct created successfully"
        )
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
