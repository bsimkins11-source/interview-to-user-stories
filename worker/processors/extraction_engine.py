import re
import json
import hashlib
import os
from typing import List, Dict, Any, Optional
from google.generativeai import GenerativeModel
import openai

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

    def _preprocess_text_for_analysis(self, text: str) -> str:
        """Preprocess text to improve AI analysis quality"""
        # Clean and structure the text for better AI understanding
        text = text.strip()
        
        # Add context markers for better analysis
        if 'interview' in text.lower() or ':' in text:
            # This looks like interview content, add context
            text = f"INTERVIEW CONTENT: {text}"
        
        # Highlight key phrases that indicate user stories
        key_indicators = ['need', 'want', 'should', 'must', 'require', 'problem', 'issue', 'difficulty']
        for indicator in key_indicators:
            if indicator in text.lower():
                text = f"{text}\n[KEY INDICATOR: {indicator.upper()}]"
        
        return text
    
    async def _extract_with_gemini(self, text: str, doc: Dict[str, Any], paragraph_index: int) -> Optional[Dict[str, Any]]:
        """Extract user story using Gemini AI with enhanced analysis and logging"""
        if not self.gemini_model:
            print("Gemini model not available, falling back to pattern matching")
            return self._extract_with_patterns(text, doc, paragraph_index)
            
        prompt = self._build_extraction_prompt(text)
        
        # Log the analysis process
        print(f"\n🤖 GEMINI ANALYSIS STARTED")
        print(f"📄 Document: {doc.get('filename', 'Unknown')}")
        print(f"📝 Paragraph: {paragraph_index + 1}")
        print(f"📊 Text Length: {len(text)} characters")
        print(f"🔍 Text Preview: {text[:200]}...")
        print(f"📋 Construct: {self.construct.get('name', 'Default') if self.construct else 'None'}")
        
        try:
            print(f"🚀 Sending to Gemini API...")
            
            # Use deterministic generation parameters
            response = self.gemini_model.generate_content(
                prompt,
                generation_config={
                    'temperature': 0.1,  # Low temperature for consistency
                    'top_p': 0.8,
                    'top_k': 40,
                    'max_output_tokens': 1000,
                }
            )
            
            if response.text:
                print(f"✅ Gemini Response Received")
                print(f"📄 Response Length: {len(response.text)} characters")
                print(f"🔍 Response Preview: {response.text[:300]}...")
                
                # Parse the response
                parsed_story = self._parse_ai_response(response.text, doc, paragraph_index)
                
                if parsed_story:
                    print(f"🎯 User Story Extracted Successfully!")
                    print(f"   - Role: {parsed_story.get('role', 'N/A')}")
                    print(f"   - Category: {parsed_story.get('category', 'N/A')}")
                    print(f"   - Priority: {parsed_story.get('priority', 'N/A')}")
                else:
                    print(f"⚠️  Failed to parse Gemini response")
                
                return parsed_story
            else:
                print(f"❌ Gemini returned empty response")
                return None
                
        except Exception as e:
            print(f"💥 Gemini extraction failed: {str(e)}")
            # Fall back to pattern-based extraction
            return self._extract_with_patterns(text, doc, paragraph_index)
    
    async def _extract_with_openai(self, text: str, doc: Dict[str, Any], paragraph_index: int) -> Optional[Dict[str, Any]]:
        """Extract user story using OpenAI with deterministic settings"""
        prompt = self._build_extraction_prompt(text)
        
        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an expert at extracting user stories from interview transcripts. Always provide consistent, structured output."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,  # Low temperature for consistency
                max_tokens=1000,
                top_p=0.8,
                frequency_penalty=0.0,
                presence_penalty=0.0
            )
            
            if response.choices and response.choices[0].message.content:
                return self._parse_ai_response(response.choices[0].message.content, doc, paragraph_index)
        except Exception as e:
            print(f"OpenAI extraction failed: {str(e)}")
        
        return None
    
    def _build_extraction_prompt(self, text: str) -> str:
        """Build the AI extraction prompt with deterministic instructions and examples"""
        
        # Get construct-specific guidance
        construct_guidance = self._get_construct_guidance()
        
        return f"""
You are an expert business analyst specializing in extracting user stories from interview transcripts. Your task is to analyze the provided text and identify clear, actionable user stories.

ANALYZE THIS TEXT CAREFULLY:
"{text}"

EXTRACTION GUIDELINES:

1. **ROLE IDENTIFICATION**: Look for who is speaking or who needs the capability
   - Examples: "workflow manager", "content creator", "system administrator", "team member"
   - If no specific role mentioned, infer from context or use "User"

2. **CAPABILITY EXTRACTION**: Identify what the person needs to do
   - Look for action words: "need", "want", "should", "must", "require"
   - Focus on specific, actionable capabilities
   - Examples: "approve documents", "upload assets", "receive notifications"

3. **BENEFIT IDENTIFICATION**: Understand why this capability is needed
   - Look for phrases like "so that", "in order to", "because"
   - Focus on business value and outcomes
   - Examples: "ensure quality control", "improve efficiency", "maintain compliance"

4. **CATEGORIZATION**: Classify into one of these categories:
   - **workflow**: Process management, approvals, routing, notifications, automation
   - **dam**: Digital asset management, metadata, version control, access control
   - **integration**: System connections, data sharing, API requirements
   - **security**: Authentication, permissions, compliance, audit trails

5. **PRIORITY ASSIGNMENT**:
   - **High**: Security, compliance, critical business functions, revenue impact
   - **Medium**: User experience, efficiency improvements, operational needs
   - **Low**: Nice-to-have features, optimizations, future enhancements

EXAMPLES OF GOOD USER STORIES:

**Workflow Example:**
Input: "We need a better approval process for document submissions. Right now, everything gets stuck in email threads and we lose track of what's been approved and what hasn't."
Output: {{
    "role": "workflow manager",
    "capability": "manage centralized approval process for document submissions",
    "benefit": "track approval status and maintain audit trails",
    "category": "workflow",
    "priority": "high",
    "source_text": "We need a better approval process for document submissions. Right now, everything gets stuck in email threads and we lose track of what's been approved and what hasn't.",
    "requirements": ["centralized approval system", "status tracking", "audit trail"],
    "acceptance_criteria": ["System shows all pending approvals", "Clear status indicators", "Complete approval history"]
}}

**DAM Example:**
Input: "We also handle a lot of marketing materials, product images, and documentation. We need a way to organize these assets with proper metadata, version control, and access permissions."
Output: {{
    "role": "content manager",
    "capability": "organize digital assets with metadata, version control, and access permissions",
    "benefit": "efficiently manage and find marketing materials and product images",
    "category": "dam",
    "priority": "medium",
    "source_text": "We also handle a lot of marketing materials, product images, and documentation. We need a way to organize these assets with proper metadata, version control, and access permissions.",
    "requirements": ["metadata management", "version control", "access permissions", "asset organization"],
    "acceptance_criteria": ["Assets can be tagged with metadata", "Version history is maintained", "Access control is enforced"]
}}

**Integration Example:**
Input: "The workflow should automatically route documents to the right people, send reminders when approvals are overdue, and maintain an audit trail of who approved what and when."
Output: {{
    "role": "system administrator",
    "capability": "automate document routing, reminders, and audit trail maintenance",
    "benefit": "ensure timely approvals and maintain compliance records",
    "category": "workflow",
    "priority": "high",
    "source_text": "The workflow should automatically route documents to the right people, send reminders when approvals are overdue, and maintain an audit trail of who approved what and when.",
    "requirements": ["automatic routing", "reminder system", "audit trail", "compliance tracking"],
    "acceptance_criteria": ["Documents route automatically", "Overdue reminders are sent", "Complete audit trail exists"]
}}

CONSTRUCT-SPECIFIC GUIDANCE:
{construct_guidance}

OUTPUT REQUIREMENTS:
- Return ONLY valid JSON in the exact format shown above
- If no clear user story can be extracted, return null
- Be specific and actionable in your responses
- Use consistent terminology and categorization
- Focus on business value and user needs

ANALYZE THE TEXT AND EXTRACT THE USER STORY:
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
