import os
from datetime import datetime, timedelta
from typing import Optional
from google.cloud import storage
from google.cloud.storage.blob import Blob
import io

class StorageService:
    def __init__(self):
        self.client = storage.Client()
        self.bucket_name = os.getenv("GCS_BUCKET", "tp-interview2stories")
        self.bucket = self.client.bucket(self.bucket_name)
    
    async def generate_signed_upload_url(self, job_id: str, expiration_minutes: int = 15) -> str:
        """Generate signed URL for ZIP upload"""
        blob_name = f"uploads/{job_id}/interview_data.zip"
        blob = self.bucket.blob(blob_name)
        
        # Generate signed URL for PUT operation
        url = blob.generate_signed_url(
            version="v4",
            expiration=datetime.utcnow() + timedelta(minutes=expiration_minutes),
            method="PUT",
            content_type="application/zip"
        )
        
        return url
    
    async def upload_file_to_job(self, job_id: str, file_content: io.IOBase, filename: str) -> str:
        """Upload a single file to a job's upload folder"""
        blob_name = f"uploads/{job_id}/{filename}"
        blob = self.bucket.blob(blob_name)
        
        # Upload the file content
        blob.upload_from_file(file_content)
        
        # Return the GCS URL
        return f"gs://{self.bucket_name}/{blob_name}"
    
    async def generate_signed_download_url(self, job_id: str, expiration_hours: int = 24) -> str:
        """Generate signed URL for CSV download"""
        blob_name = f"results/{job_id}/user_stories.csv"
        blob = self.bucket.blob(blob_name)
        
        if not blob.exists():
            return None
        
        # Generate signed URL for GET operation
        url = blob.generate_signed_url(
            version="v4",
            expiration=datetime.utcnow() + timedelta(hours=expiration_hours),
            method="GET"
        )
        
        return url
    
    async def upload_csv_result(self, job_id: str, csv_content: str) -> str:
        """Upload CSV result to GCS"""
        blob_name = f"results/{job_id}/user_stories.csv"
        blob = self.bucket.blob(blob_name)
        
        # Set content type and upload
        blob.content_type = "text/csv"
        blob.upload_from_string(csv_content)
        
        return f"gs://{self.bucket_name}/{blob_name}"
    
    async def file_exists(self, job_id: str) -> bool:
        """Check if upload file exists"""
        blob_name = f"uploads/{job_id}/interview_data.zip"
        blob = self.bucket.blob(blob_name)
        return blob.exists()
    
    async def get_file_size(self, job_id: str) -> Optional[int]:
        """Get uploaded file size in bytes"""
        blob_name = f"uploads/{job_id}/interview_data.zip"
        blob = self.bucket.blob(blob_name)
        
        if blob.exists():
            blob.reload()
            return blob.size
        return None
