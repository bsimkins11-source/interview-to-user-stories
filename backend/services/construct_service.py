from typing import List, Optional
from datetime import datetime
import os
import uuid
from google.cloud import firestore
from models import ConstructCreate, ConstructResponse

class ConstructService:
    def __init__(self):
        self.db = firestore.Client()
        self.collection = self.db.collection(os.getenv("FIRESTORE_COLLECTION_CONSTRUCTS", "Constructs"))
    
    async def create_construct(self, construct: ConstructCreate) -> str:
        """Create a new construct template and return the ID"""
        construct_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        construct_data = {
            "id": construct_id,
            "name": construct.name,
            "description": construct.description,
            "output_schema": construct.output_schema,
            "pattern": construct.pattern,
            "defaults": construct.defaults,
            "priority_rules": construct.priority_rules,
            "created_at": now,
            "updated_at": now,
        }
        
        doc_ref = self.collection.document(construct_id)
        doc_ref.set(construct_data)
        
        return construct_id
    
    async def get_construct(self, construct_id: str) -> Optional[dict]:
        """Get construct by ID as a dictionary"""
        doc = self.collection.document(construct_id).get()
        if doc.exists:
            return doc.to_dict()
        return None
    
    async def list_constructs(self) -> List[dict]:
        """List all available constructs as dictionaries"""
        docs = self.collection.order_by("created_at", direction=firestore.Query.DESCENDING).stream()
        return [doc.to_dict() for doc in docs]
    
    async def get_default_construct(self) -> Optional[dict]:
        """Get the default construct template as a dictionary"""
        docs = self.collection.where("name", "==", "Default").limit(1).stream()
        for doc in docs:
            return doc.to_dict()
        
        # If no default construct exists, create one
        default_construct = {
            "id": "default",
            "name": "Default User Story Template",
            "description": "Standard template for extracting user stories from interview transcripts",
            "output_schema": [
                "User Story ID",
                "User Story",
                "Team",
                "Category", 
                "Lifecycle Phase",
                "Capability",
                "Priority",
                "Source",
                "Snippet",
                "Match Score",
                "Tags"
            ],
            "pattern": "As a {role}, I want {feature} so that {benefit}",
            "defaults": {
                "Team": "Product",
                "Category": "Workflow",
                "Lifecycle Phase": "Execution",
                "Priority": "Medium"
            },
            "priority_rules": [
                "High: Security, compliance, critical business functions",
                "Medium: User experience, efficiency improvements",
                "Low: Nice-to-have features, optimizations"
            ],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        return default_construct
