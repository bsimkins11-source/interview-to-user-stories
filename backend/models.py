from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class JobStatus(str, Enum):
    CREATED = "CREATED"
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
    total_files: int
    total_stories: int
    processing_time: float
    stories: List[UserStory]
