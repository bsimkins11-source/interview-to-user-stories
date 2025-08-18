from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum

class JobStatus(str, Enum):
    CREATED = "CREATED"
    UPLOADING = "UPLOADING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class Construct(BaseModel):
    name: str
    description: Optional[str] = None
    output_schema: List[str]
    pattern: str
    defaults: Dict[str, str]
    priority_rules: List[str]

class ConstructCreate(BaseModel):
    name: str
    description: Optional[str] = None
    output_schema: List[str]
    pattern: str
    defaults: Dict[str, str]
    priority_rules: List[str]

class ConstructResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    output_schema: List[str]
    pattern: str
    defaults: Dict[str, str]
    priority_rules: List[str]
    created_at: datetime
    updated_at: datetime

class TranscriptInput(BaseModel):
    id: str
    type: str  # 'file', 'folder', 'document'
    name: str
    source: str
    status: str
    size: Optional[int] = None
    file_count: Optional[int] = None

class JobCreate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    construct: Dict[str, Any]
    transcripts: List[Dict[str, Any]]

class JobResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    status: JobStatus
    construct: Dict[str, Any]
    transcripts: List[Dict[str, Any]]
    files: List[Dict[str, Any]]
    user_stories_count: Optional[int] = None
    requirements_count: Optional[int] = None
    stories_csv_url: Optional[str] = None
    requirements_csv_url: Optional[str] = None
    processing_time: Optional[float] = None
    error: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

class Requirement(BaseModel):
    req_id: str
    requirement: str
    priority_level: str  # 'LOW', 'MEDIUM', 'HIGH'
    req_details: str
    source_story_id: Optional[str] = None

class UserStory(BaseModel):
    user_story_id: str
    user_story: str
    team: Optional[str]
    category: Optional[str]
    lifecycle_phase: Optional[str]
    capability: Optional[str]
    priority: Optional[str]
    source: Optional[str]
    snippet: Optional[str]
    match_score: Optional[float]
    tags: List[str] = Field(default_factory=list)

class ProcessingResult(BaseModel):
    job_id: str
    status: str
    processing_time: float
    stories: List[UserStory]
    requirements: Optional[List[Requirement]] = None
