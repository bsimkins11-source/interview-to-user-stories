import re
import json
import hashlib
import os
from typing import List, Dict, Any, Optional
from google.generativeai import GenerativeModel
import openai
import google.generativeai as genai
import logging

logger = logging.getLogger(__name__)

class ExtractionEngine:
    """AI-powered extraction engine for user stories and requirements"""
    
    def __init__(self, construct: Dict[str, Any], llm_provider: str = "gemini"):
        self.construct = construct
        self.llm_provider = llm_provider
        self.story_counter = 1  # Initialize sequential counter for user story IDs
        
        # Initialize AI models with deterministic settings
        if llm_provider == "gemini":
            api_key = os.getenv('GEMINI_API_KEY')
            if not api_key:
                print("Warning: GEMINI_API_KEY not set. AI extraction will fall back to pattern matching.")
                self.gemini_model = None
            else:
                try:
                    self.gemini_model = GenerativeModel('gemini-pro')
                    print("Gemini model initialized successfully")
                except Exception as e:
                    print(f"Error initializing Gemini model: {str(e)}")
                    self.gemini_model = None
        elif llm_provider == "openai":
            api_key = os.getenv('OPENAI_API_KEY')
            if not api_key:
                print("Warning: OPENAI_API_KEY not set. AI extraction will fall back to pattern matching.")
                self.openai_client = None
            else:
                try:
                    self.openai_client = openai.OpenAI(api_key=api_key)
                    print("OpenAI client initialized successfully")
                except Exception as e:
                    print(f"Error initializing OpenAI client: {str(e)}")
                    self.openai_client = None
        
        # Workflow management specific patterns
        self.workflow_patterns = [
            "As a {role}, I need {capability} so that {benefit}",
            "The system should {action} when {condition}",
            "Users must be able to {action} in order to {goal}",
            "The workflow should {process} with {requirements}"
        ]
        
        # DAM system specific patterns
        self.dam_patterns = [
            "Assets should be {action} with {metadata}",
            "Users need to {action} assets for {purpose}",
            "The system must {capability} to support {workflow}",
            "Access control should {permission} based on {criteria}"
        ]
    
    def _generate_sequential_id(self) -> str:
        """Generate sequential user story ID: US-1, US-2, etc."""
        story_id = f"US-{self.story_counter}"
        self.story_counter += 1
        return story_id
    
    async def extract_stories(self, processed_documents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract user stories from processed documents using AI with deterministic processing"""
        all_stories = []
        
        # Sort documents by filename for consistent processing order
        sorted_docs = sorted(processed_documents, key=lambda x: x['filename'])
        
        for doc in sorted_docs:
            try:
                # Extract stories from each paragraph with consistent ordering
                doc_stories = await self._extract_from_document(doc)
                all_stories.extend(doc_stories)
            except Exception as e:
                print(f"Error extracting stories from {doc['filename']}: {str(e)}")
                continue
        
        # Apply construct template and defaults
        structured_stories = await self._apply_construct_template(all_stories)
        
        # Sort stories by consistent hash for deterministic output
        structured_stories.sort(key=lambda x: self._generate_story_hash(x))
        
        return structured_stories
    
    def _generate_story_hash(self, story: Dict[str, Any]) -> str:
        """Generate a consistent hash for story sorting"""
        # Create a deterministic string representation
        story_key = f"{story.get('User Story', '')}{story.get('Source', '')}{story.get('paragraph_index', 0)}"
        return hashlib.md5(story_key.encode()).hexdigest()
    
    async def _extract_from_document(self, doc: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract user stories from a single document with consistent processing"""
        stories = []
        paragraphs = doc.get('paragraphs', [])
        
        # Process paragraphs in consistent order
        for i, paragraph in enumerate(paragraphs):
            try:
                # Check if paragraph contains workflow or DAM content
                if self._is_relevant_content(paragraph):
                    story = await self._extract_story_from_text(paragraph, doc, i)
                    if story:
                        stories.append(story)
            except Exception as e:
                print(f"Error processing paragraph {i}: {str(e)}")
                continue
        
        # Sort stories by paragraph index for consistency
        stories.sort(key=lambda x: x.get('paragraph_index', 0))
        return stories
    
    def _is_relevant_content(self, text: str) -> bool:
        """Check if text contains relevant workflow or DAM content"""
        text_lower = text.lower()
        
        workflow_keywords = [
            'workflow', 'process', 'approval', 'review', 'sign-off',
            'routing', 'escalation', 'notification', 'automation',
            'business rules', 'decision points', 'status', 'state',
            'escalate', 'route', 'approve', 'reject', 'notify'
        ]
        
        dam_keywords = [
            'digital asset', 'asset management', 'metadata', 'tagging',
            'version control', 'access control', 'permissions', 'search',
            'categorization', 'workflow integration', 'asset', 'file',
            'upload', 'download', 'share', 'collaborate'
        ]
        
        return any(keyword in text_lower for keyword in workflow_keywords + dam_keywords)
    
    def _get_construct_guidance(self) -> str:
        """Get construct-specific guidance for the AI prompt"""
        if not self.construct:
            return "Use standard user story format with workflow, DAM, and integration categories."
        
        # Extract construct-specific information
        output_schema = self.construct.get('output_schema', [])
        defaults = self.construct.get('defaults', {})
        priority_rules = self.construct.get('priority_rules', [])
        
        guidance = f"""
SPECIFIC OUTPUT SCHEMA: {', '.join(output_schema)}
DEFAULT VALUES: {', '.join([f'{k}: {v}' for k, v in defaults.items()])}
PRIORITY RULES: {'; '.join(priority_rules)}
"""
        return guidance

    async def _extract_story_from_text(self, text: str, doc: Dict[str, Any], paragraph_index: int) -> Optional[Dict[str, Any]]:
        """Extract a single user story from text using AI with enhanced analysis"""
        try:
            # Enhanced text preprocessing for better AI analysis
            processed_text = self._preprocess_text_for_analysis(text)
            
            if self.llm_provider == "gemini":
                return await self._extract_with_gemini(processed_text, doc, paragraph_index)
            elif self.llm_provider == "openai":
                return await self._extract_with_openai(processed_text, doc, paragraph_index)
            else:
                return self._extract_with_patterns(processed_text, doc, paragraph_index)
        except Exception as e:
            print(f"Error in AI extraction: {str(e)}")
            return self._extract_with_patterns(text, doc, paragraph_index)

    async def extract_story_from_text_with_context(self, text: str, doc: Dict[str, Any], paragraph_index: int, context_chunks: List[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        """Extract user story using Gemini AI with enhanced context from vectorized chunks"""
        if not self.gemini_model:
            logger.warning("Gemini model not available, falling back to pattern matching")
            return self._extract_with_patterns(text, doc, paragraph_index)
            
        prompt = self._build_extraction_prompt_with_context(text, doc, paragraph_index, context_chunks)
        
        # Log the analysis process
        logger.info(f"\n🤖 GEMINI ANALYSIS WITH CONTEXT STARTED")
        logger.info(f"📄 Document: {doc.get('filename', 'Unknown')}")
        logger.info(f"📝 Paragraph: {paragraph_index + 1}")
        logger.info(f"📊 Text Length: {len(text)} characters")
        logger.info(f"🔍 Context Chunks: {len(context_chunks) if context_chunks else 0}")
        logger.info(f"📊 Text Preview: {text[:100]}...")
        
        try:
            # Generate content using Gemini with enhanced configuration
            response = await self.gemini_model.generate_content_async(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.3,  # Lower temperature for more consistent output
                    top_p=0.8,
                    top_k=40,
                    max_output_tokens=2048,
                )
            )
            
            response_text = response.text
            logger.info(f"💡 Gemini generated response: {response_text[:200]}...")
            
            # Parse the response into structured user story
            story = self._extract_story_from_text(response_text, doc, paragraph_index)
            
            if story:
                logger.info(f"✅ Successfully extracted story with context")
                logger.info(f"📋 Story details: {story.get('User Story', 'Unknown')[:50]}...")
            else:
                logger.warning(f"⚠️ Failed to parse story from Gemini response")
                
            return story
            
        except Exception as e:
            logger.error(f"❌ Error in Gemini AI extraction with context: {str(e)}")
            logger.info(f"🔄 Falling back to pattern matching...")
            return self._extract_with_patterns(text, doc, paragraph_index)
    
    def _extract_story_from_text(self, response_text: str, doc: Dict[str, Any], paragraph_index: int) -> Optional[Dict[str, Any]]:
        """Parse AI response into structured user story"""
        try:
            # Parse the response text to extract user story components
            lines = response_text.strip().split('\n')
            story_data = {}
            
            for line in lines:
                line = line.strip()
                if ':' in line:
                    key, value = line.split(':', 1)
                    key = key.strip()
                    value = value.strip()
                    
                    if key == 'User Story':
                        story_data['User Story'] = value
                    elif key == 'Capability':
                        story_data['Capability'] = value
                    elif key == 'Category':
                        story_data['Category'] = value
                    elif key == 'Priority':
                        story_data['Priority'] = value
                    elif key == 'Snippet':
                        story_data['Snippet'] = value
                    elif key == 'Team':
                        story_data['Team'] = value
                    elif key == 'Stakeholder':
                        story_data['Stakeholder'] = value
            
            # Validate that we have the minimum required fields
            if 'User Story' in story_data and 'Capability' in story_data:
                # Add metadata
                story_data['id'] = f"US-{doc.get('filename', 'unknown')}-{paragraph_index}"
                story_data['source_document'] = doc.get('filename', 'unknown')
                story_data['paragraph_index'] = paragraph_index
                
                return story_data
            else:
                logger.warning(f"Missing required fields in story response: {story_data}")
                return None
                
        except Exception as e:
            logger.error(f"Error parsing story from AI response: {e}")
            return None
    
    def _build_extraction_prompt_with_context(self, text: str, doc: Dict[str, Any], paragraph_index: int, context_chunks: List[Dict[str, Any]] = None) -> str:
        """Build the AI extraction prompt with enhanced context from vectorized chunks"""
        
        # Get construct-specific guidance
        construct_guidance = self._get_construct_guidance()
        
        # Build context information
        context_info = ""
        if context_chunks:
            context_info = "\n\nRELEVANT CONTEXT FROM INTERVIEWS:\n"
            for i, chunk in enumerate(context_chunks):
                chunk_metadata = chunk.get('metadata', {})
                filename = chunk_metadata.get('filename', 'Unknown')
                context_info += f"\nCONTEXT CHUNK {i+1} (from {filename}):\n{chunk['text']}\n"
            
            context_info += "\nUse this context to provide more accurate and detailed extraction. Consider the relationships between different parts of the interviews and how they inform the user story."
        
        return f"""
You are an expert business analyst specializing in extracting user stories from interview transcripts. Your task is to analyze the provided text and identify clear, actionable user stories.

ANALYZE THIS TEXT CAREFULLY:
"{text}"

{context_info}

EXTRACTION GUIDELINES:

1. **ROLE IDENTIFICATION**: Look for who is speaking or who needs the capability
   - Examples: "workflow manager", "content creator", "system administrator"
   - Extract stakeholder names and roles when mentioned

2. **CAPABILITY NEEDS**: Identify what the person wants to accomplish
   - Look for phrases like "I need to", "I want to", "I should be able to"
   - Focus on business capabilities, not just technical features

3. **BUSINESS VALUE**: Understand why this capability is important
   - Look for phrases like "so that", "in order to", "because"
   - Identify efficiency gains, cost savings, compliance needs, etc.

4. **CATEGORIZATION**: Classify the user story appropriately
   - Workflow: Process improvements, approvals, notifications
   - DAM: Digital asset management, content organization
   - Integration: System connections, data flows, APIs
   - Security: Access control, authentication, compliance

5. **PRIORITY ASSESSMENT**: Determine business priority
   - HIGH: Critical business functions, security, compliance, revenue impact
   - MEDIUM: Important operational features, user experience improvements
   - LOW: Nice-to-have features, minor improvements, future enhancements

{construct_guidance}

OUTPUT FORMAT:
Generate exactly ONE user story per text segment. Use this exact format:

User Story: [Complete user story in "As a [role], I need [capability] so that [business value]" format]
Capability: [Specific capability or feature needed]
Category: [Workflow/DAM/Integration/Security/Other]
Priority: [HIGH/MEDIUM/LOW]
Snippet: [Key quote or phrase from the text that supports this story]
Team: [Team or department mentioned, if any]
Stakeholder: [Specific person mentioned, if any]

EXAMPLE:
User Story: As a workflow manager, I need to approve document submissions so that I can ensure quality control and compliance.
Capability: Document approval workflow
Category: Workflow
Priority: HIGH
Snippet: "I need to approve all submissions before they go live"
Team: Operations
Stakeholder: Sarah Johnson

Analyze the text thoroughly and extract the most relevant user story. If no clear user story is present, return null.
"""
    
    def _parse_ai_response(self, ai_response: str, doc: Dict[str, Any], paragraph_index: int) -> Optional[Dict[str, Any]]:
        """Parse AI response into structured data with consistent validation"""
        try:
            # Try to extract JSON from response
            json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
            if json_match:
                story_data = json.loads(json_match.group())
                
                # Validate required fields
                if all(key in story_data for key in ['role', 'capability', 'benefit']):
                    # Normalize text for consistency
                    normalized_role = self._normalize_text(story_data.get('role', 'User'))
                    normalized_capability = self._normalize_text(story_data.get('capability', ''))
                    normalized_benefit = self._normalize_text(story_data.get('benefit', ''))
                    
                    return {
                        'user_story_id': self._generate_sequential_id(),  # Use sequential ID: US-1, US-2, etc.
                        'role': normalized_role,
                        'capability': normalized_capability,
                        'benefit': normalized_benefit,
                        'category': story_data.get('category', 'workflow'),
                        'priority': story_data.get('priority', 'medium'),
                        'source_text': story_data.get('source_text', ''),
                        'requirements': story_data.get('requirements', []),
                        'acceptance_criteria': story_data.get('acceptance_criteria', []),
                        'source_file': doc['filename'],
                        'paragraph_index': paragraph_index,
                        'extraction_method': 'ai',
                        'confidence_score': 0.8,
                        'content_hash': self._generate_content_hash(text)
                    }
        except Exception as e:
            print(f"Error parsing AI response: {str(e)}")
        
        return None
    
    def _normalize_text(self, text: str) -> str:
        """Normalize text for consistent processing"""
        if not text:
            return ""
        
        # Convert to lowercase and trim
        text = text.lower().strip()
        
        # Standardize common terms
        text = re.sub(r'\b(workflow|process|procedure)\b', 'workflow', text)
        text = re.sub(r'\b(asset|file|document|media)\b', 'asset', text)
        text = re.sub(r'\b(approve|approval|sign-off|signoff)\b', 'approval', text)
        text = re.sub(r'\b(notify|notification|alert|email)\b', 'notification', text)
        
        # Capitalize first letter
        return text.capitalize() if text else ""
    
    def _generate_content_hash(self, text: str) -> str:
        """Generate a hash of the source content for consistency checking"""
        return hashlib.md5(text.encode()).hexdigest()
    
    def _extract_with_patterns(self, text: str, doc: Dict[str, Any], paragraph_index: int) -> Optional[Dict[str, Any]]:
        """Fallback extraction using pattern matching with consistent logic"""
        # Simple pattern-based extraction
        text_lower = text.lower()
        
        # Identify category using consistent logic
        if any(keyword in text_lower for keyword in ['workflow', 'process', 'approval']):
            category = 'workflow'
        elif any(keyword in text_lower for keyword in ['asset', 'digital', 'metadata']):
            category = 'dam'
        else:
            category = 'general'
        
        # Extract basic story elements using consistent patterns
        role_match = re.search(r'as a (\w+)', text_lower)
        role = role_match.group(1) if role_match else 'User'
        
        # Simple capability extraction
        capability_keywords = ['need', 'want', 'should', 'must', 'require']
        capability = ''
        for keyword in capability_keywords:
            if keyword in text_lower:
                # Extract text after the keyword
                start_idx = text_lower.find(keyword)
                capability = text[start_idx:start_idx + 100].strip()
                break
        
        if not capability:
            capability = text[:100].strip()
        
        return {
            'user_story_id': self._generate_sequential_id(),  # Use sequential ID: US-1, US-2, etc.
            'role': role,
            'capability': capability,
            'benefit': 'Improved efficiency and user experience',
            'category': category,
            'priority': 'medium',
            'source_text': text[:200],
            'requirements': [],
            'acceptance_criteria': [],
            'source_file': doc['filename'],
            'paragraph_index': paragraph_index,
            'extraction_method': 'pattern',
            'confidence_score': 0.5,
            'content_hash': self._generate_content_hash(text)
        }
    
    async def _apply_construct_template(self, stories: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Apply the construct template to extracted stories with consistent processing"""
        if not self.construct:
            return stories
        
        structured_stories = []
        
        for story in stories:
            try:
                structured_story = self._structure_story(story)
                structured_stories.append(structured_story)
            except Exception as e:
                print(f"Error structuring story: {str(e)}")
                continue
        
        return structured_stories
    
    def _structure_story(self, story: Dict[str, Any]) -> Dict[str, Any]:
        """Structure a story according to the construct template with consistent defaults"""
        # Apply defaults from construct
        defaults = self.construct.get('defaults', {})
        
        structured_story = {
            'User Story ID': story.get('user_story_id', ''),
            'User Story': f"As a {story.get('role', 'User')}, I need {story.get('capability', '')} so that {story.get('benefit', '')}",
            'Team': defaults.get('Team', 'Product'),
            'Category': story.get('category', defaults.get('Category', 'Workflow')),
            'Lifecycle Phase': defaults.get('Lifecycle Phase', 'Execution'),
            'Capability': story.get('capability', ''),
            'Priority': story.get('priority', defaults.get('Priority', 'Medium')),
            'Source': story.get('source_file', ''),
            'Snippet': story.get('source_text', '')[:100] + '...',
            'Match Score': story.get('confidence_score', 0.0),
            'Tags': self._generate_tags(story),
            'Content Hash': story.get('content_hash', ''),
            'Extraction Method': story.get('extraction_method', 'unknown')
        }
        
        return structured_story
    
    def _generate_tags(self, story: Dict[str, Any]) -> List[str]:
        """Generate tags for the story with consistent logic"""
        tags = []
        
        # Add category tag
        tags.append(story.get('category', 'general'))
        
        # Add priority tag
        tags.append(story.get('priority', 'medium'))
        
        # Add role tag
        if story.get('role'):
            tags.append(story.get('role').lower())
        
        # Add capability tags using consistent patterns
        capability = story.get('capability', '').lower()
        if 'approval' in capability:
            tags.append('approval')
        if 'notification' in capability:
            tags.append('notification')
        if 'routing' in capability:
            tags.append('routing')
        if 'asset' in capability:
            tags.append('asset-management')
        
        # Sort tags for consistency
        return sorted(list(set(tags)))
    
    def get_extraction_summary(self, stories: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate a summary of extracted stories with consistent metrics"""
        if not stories:
            return {'total_stories': 0, 'status': 'no_stories_extracted'}
        
        categories = {}
        priorities = {}
        extraction_methods = {}
        
        for story in stories:
            # Count categories
            category = story.get('Category', 'Unknown')
            categories[category] = categories.get(category, 0) + 1
            
            # Count priorities
            priority = story.get('Priority', 'Unknown')
            priorities[priority] = priorities.get(priority, 0) + 1
            
            # Count extraction methods
            method = story.get('Extraction Method', 'Unknown')
            extraction_methods[method] = extraction_methods.get(method, 0) + 1
        
        return {
            'total_stories': len(stories),
            'category_distribution': categories,
            'priority_distribution': priorities,
            'extraction_methods': extraction_methods,
            'average_confidence': sum(story.get('Match Score', 0) for story in stories) / len(stories),
            'status': 'extraction_completed',
            'consistency_hash': self._generate_batch_hash(stories)
        }
    
    def _generate_batch_hash(self, stories: List[Dict[str, Any]]) -> str:
        """Generate a hash for the entire batch to verify consistency"""
        # Create a deterministic string from all story IDs and hashes
        story_identifiers = []
        for story in sorted(stories, key=lambda x: x.get('User Story ID', '')):
            story_identifiers.append(f"{story.get('User Story ID', '')}:{story.get('Content Hash', '')}")
        
        batch_string = "|".join(story_identifiers)
        return hashlib.md5(batch_string.encode()).hexdigest()
