from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class JobStatus(str, Enum):
    CREATED = "CREATED"
    UPLOADING = "UPLOADING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class JobCreate(BaseModel):
    name: str = Field(..., description="Job name")
    description: Optional[str] = Field(None, description="Job description")
    construct_id: Optional[str] = Field(None, description="Construct template ID")
    custom_construct: Optional[Dict[str, Any]] = Field(None, description="Custom construct data")

class JobResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    status: JobStatus
    construct_id: Optional[str]
    custom_construct: Optional[Dict[str, Any]]
    upload_url: Optional[str]
    csv_url: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    completed_at: Optional[datetime]
    error_message: Optional[str]
    metrics: Optional[Dict[str, Any]]

class ConstructCreate(BaseModel):
    name: str = Field(..., description="Construct name")
    description: Optional[str] = Field(None, description="Construct description")
    output_schema: List[str] = Field(..., description="Output CSV column headers")
    pattern: str = Field(..., description="User story pattern template")
    defaults: Dict[str, str] = Field(default_factory=dict, description="Default values for columns")
    priority_rules: List[str] = Field(default_factory=list, description="Priority classification rules")

class ConstructResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    output_schema: List[str]
    pattern: str
    defaults: Dict[str, str]
    priority_rules: List[str]
    created_at: datetime
    updated_at: Optional[datetime]

class UserStory:
    def __init__(self, id: str, title: str, description: str, acceptance_criteria: List[str], priority: str, status: str):
        self.id = id
        self.title = title
        self.description = description
        self.acceptance_criteria = acceptance_criteria
        self.priority = priority
        self.status = status

class ProcessingResult(BaseModel):
    total_files: int
    total_stories: int
    processing_time: float
    stories: List[UserStory]

class Requirement:
    def __init__(self, req_id: str, requirement: str, priority_level: str, req_details: str, source_story_id: Optional[str] = None):
        self.req_id = req_id
        self.requirement = requirement
        self.priority_level = priority_level
        self.req_details = req_details
        self.source_story_id = source_story_id  # Link back to original user story
