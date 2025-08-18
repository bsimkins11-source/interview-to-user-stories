import os
import logging
from typing import List, Dict, Any, Optional
from google.cloud import aiplatform
from google.cloud.aiplatform import MatchingEngineIndex, MatchingEngineIndexEndpoint
import vertexai
from vertexai.language_models import TextEmbeddingModel
import numpy as np
import asyncio

# Configure logging
logger = logging.getLogger(__name__)

class VectorProcessor:
    """Process transcripts using Vertex AI vectorization for enhanced Gemini processing"""
    
    def __init__(self, project_id: str, location: str = "us-central1"):
        self.project_id = project_id
        self.location = location
        self.embedding_model = None
        self.index = None
        self.endpoint = None
        
        try:
            # Initialize Vertex AI
            vertexai.init(project=project_id, location=location)
            self.embedding_model = TextEmbeddingModel.from_pretrained("textembedding-gecko@003")
            logger.info("✅ Vertex AI vector processor initialized successfully")
        except Exception as e:
            logger.error(f"⚠️ Failed to initialize Vertex AI: {e}")
            self.embedding_model = None
    
    async def vectorize_transcripts(self, transcripts: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Vectorize interview transcripts for enhanced AI processing"""
        if not self.embedding_model:
            logger.warning("⚠️ Vertex AI not available, skipping vectorization")
            return {"vectorized": False, "chunks": transcripts}
        
        try:
            logger.info(f"🧠 Vectorizing {len(transcripts)} transcripts...")
            
            vectorized_chunks = []
            
            for transcript in transcripts:
                # Split transcript into semantic chunks
                chunks = self._create_semantic_chunks(transcript)
                
                for i, chunk in enumerate(chunks):
                    # Generate embeddings for each chunk
                    embedding = await self._generate_embedding(chunk['text'])
                    
                    vectorized_chunk = {
                        'id': f"{transcript.get('filename', 'unknown')}_chunk_{i}",
                        'text': chunk['text'],
                        'embedding': embedding,
                        'metadata': {
                            'filename': transcript.get('filename', 'unknown'),
                            'chunk_index': i,
                            'total_chunks': len(chunks),
                            'file_type': transcript.get('file_type', 'unknown'),
                            'size': transcript.get('size', 0),
                            'source_transcript': transcript
                        }
                    }
                    vectorized_chunks.append(vectorized_chunk)
            
            logger.info(f"✅ Successfully vectorized {len(vectorized_chunks)} chunks")
            
            return {
                "vectorized": True,
                "chunks": vectorized_chunks,
                "total_chunks": len(vectorized_chunks),
                "embedding_dimension": len(vectorized_chunks[0]['embedding']) if vectorized_chunks else 0
            }
            
        except Exception as e:
            logger.error(f"❌ Error during vectorization: {e}")
            return {"vectorized": False, "chunks": transcripts, "error": str(e)}
    
    def _create_semantic_chunks(self, transcript: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Create semantic chunks from transcript text"""
        text = transcript.get('content', '')
        paragraphs = transcript.get('paragraphs', [])
        
        chunks = []
        
        if paragraphs:
            # Use existing paragraph structure
            for i, paragraph in enumerate(paragraphs):
                if paragraph.strip():
                    chunks.append({
                        'text': paragraph.strip(),
                        'type': 'paragraph',
                        'index': i
                    })
        else:
            # Create chunks from raw text
            sentences = text.split('. ')
            current_chunk = ""
            chunk_size = 0
            max_chunk_size = 1000  # Characters per chunk
            
            for sentence in sentences:
                if chunk_size + len(sentence) > max_chunk_size and current_chunk:
                    chunks.append({
                        'text': current_chunk.strip(),
                        'type': 'semantic',
                        'index': len(chunks)
                    })
                    current_chunk = sentence
                    chunk_size = len(sentence)
                else:
                    current_chunk += sentence + ". "
                    chunk_size += len(sentence) + 2
            
            # Add the last chunk
            if current_chunk.strip():
                chunks.append({
                    'text': current_chunk.strip(),
                    'type': 'semantic',
                    'index': len(chunks)
                })
        
        return chunks
    
    async def _generate_embedding(self, text: str) -> List[float]:
        """Generate text embedding using Vertex AI"""
        try:
            embeddings = self.embedding_model.get_embeddings([text])
            return embeddings[0].values
        except Exception as e:
            logger.error(f"⚠️ Error generating embedding: {e}")
            # Return zero vector as fallback
            return [0.0] * 768  # Gecko model dimension
    
    def find_similar_chunks(self, query: str, chunks: List[Dict[str, Any]], top_k: int = 5) -> List[Dict[str, Any]]:
        """Find most similar chunks to a query using vector similarity"""
        if not self.embedding_model or not chunks:
            return chunks[:top_k]
        
        try:
            # Generate query embedding
            query_embedding = asyncio.run(self._generate_embedding(query))
            
            # Calculate similarities
            similarities = []
            for chunk in chunks:
                if 'embedding' in chunk and chunk['embedding']:
                    similarity = self._cosine_similarity(query_embedding, chunk['embedding'])
                    similarities.append((similarity, chunk))
            
            # Sort by similarity and return top_k
            similarities.sort(key=lambda x: x[0], reverse=True)
            return [chunk for _, chunk in similarities[:top_k]]
            
        except Exception as e:
            logger.error(f"⚠️ Error finding similar chunks: {e}")
            return chunks[:top_k]
    
    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        try:
            vec1 = np.array(vec1)
            vec2 = np.array(vec2)
            
            dot_product = np.dot(vec1, vec2)
            norm1 = np.linalg.norm(vec1)
            norm2 = np.linalg.norm(vec2)
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
            
            return dot_product / (norm1 * norm2)
        except Exception as e:
            logger.error(f"Error calculating cosine similarity: {e}")
            return 0.0
    
    def get_context_for_extraction(self, user_story: str, chunks: List[Dict[str, Any]], context_window: int = 3) -> List[Dict[str, Any]]:
        """Get relevant context chunks for user story extraction"""
        if not chunks:
            return []
        
        try:
            # Find most similar chunks to the user story
            similar_chunks = self.find_similar_chunks(user_story, chunks, top_k=context_window)
            
            # Add surrounding context
            context_chunks = []
            for chunk in similar_chunks:
                context_chunks.append(chunk)
                
                # Add chunks from the same transcript for context
                chunk_metadata = chunk.get('metadata', {})
                filename = chunk_metadata.get('filename', '')
                chunk_index = chunk_metadata.get('chunk_index', 0)
                
                # Find chunks from the same transcript
                same_transcript_chunks = [
                    c for c in chunks 
                    if c.get('metadata', {}).get('filename') == filename
                ]
                
                # Add surrounding chunks
                for i in range(max(0, chunk_index - 1), min(len(same_transcript_chunks), chunk_index + 2)):
                    if i != chunk_index and same_transcript_chunks[i] not in context_chunks:
                        context_chunks.append(same_transcript_chunks[i])
            
            return context_chunks[:context_window * 2]  # Limit total context
            
        except Exception as e:
            logger.error(f"Error getting context for extraction: {e}")
            return []
    
    def enhance_extraction_prompt(self, base_prompt: str, context_chunks: List[Dict[str, Any]]) -> str:
        """Enhance extraction prompt with vectorized context"""
        if not context_chunks:
            return base_prompt
        
        try:
            context_text = "\n\n".join([
                f"CONTEXT CHUNK {i+1} (from {chunk.get('metadata', {}).get('filename', 'unknown')}):\n{chunk['text']}"
                for i, chunk in enumerate(context_chunks)
            ])
            
            enhanced_prompt = f"""
{base_prompt}

RELEVANT CONTEXT FROM INTERVIEWS:
{context_text}

Use this context to provide more accurate and detailed extraction. Consider the relationships between different parts of the interviews and how they inform the user story or requirement.
"""
            
            return enhanced_prompt
            
        except Exception as e:
            logger.error(f"Error enhancing extraction prompt: {e}")
            return base_prompt
