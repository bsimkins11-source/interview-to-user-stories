from typing import List, Optional
from datetime import datetime
import os
from google.cloud import firestore
from models import ConstructCreate, ConstructResponse

class ConstructService:
    def __init__(self):
        self.db = firestore.Client()
        self.collection = self.db.collection(os.getenv("FIRESTORE_COLLECTION_CONSTRUCTS", "Constructs"))
    
    async def create_construct(self, construct_id: str, construct: ConstructCreate) -> ConstructResponse:
        """Create a new construct template"""
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
        
        return ConstructResponse(**construct_data)
    
    async def get_construct(self, construct_id: str) -> Optional[ConstructResponse]:
        """Get construct by ID"""
        doc = self.collection.document(construct_id).get()
        if doc.exists:
            return ConstructResponse(**doc.to_dict())
        return None
    
    async def list_constructs(self) -> List[ConstructResponse]:
        """List all available constructs"""
        docs = self.collection.order_by("created_at", direction=firestore.Query.DESCENDING).stream()
        return [ConstructResponse(**doc.to_dict()) for doc in docs]
    
    async def get_default_construct(self) -> Optional[ConstructResponse]:
        """Get the default construct template"""
        docs = self.collection.where("name", "==", "Default").limit(1).stream()
        for doc in docs:
            return ConstructResponse(**doc.to_dict())
        return None
