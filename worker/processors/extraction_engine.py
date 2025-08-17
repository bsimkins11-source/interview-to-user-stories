import re
import json
from typing import List, Dict, Any, Optional
from google.generativeai import GenerativeModel
import openai

class ExtractionEngine:
    """AI-powered extraction engine for user stories and requirements"""
    
    def __init__(self, construct: Dict[str, Any], llm_provider: str = "gemini"):
        self.construct = construct
        self.llm_provider = llm_provider
        
        # Initialize AI models
        if llm_provider == "gemini":
            self.gemini_model = GenerativeModel('gemini-pro')
        elif llm_provider == "openai":
            self.openai_client = openai.OpenAI()
        
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
    
    async def extract_stories(self, processed_documents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract user stories from processed documents using AI"""
        all_stories = []
        
        for doc in processed_documents:
            try:
                # Extract stories from each paragraph
                doc_stories = await self._extract_from_document(doc)
                all_stories.extend(doc_stories)
            except Exception as e:
                print(f"Error extracting stories from {doc['filename']}: {str(e)}")
                continue
        
        # Apply construct template and defaults
        structured_stories = await self._apply_construct_template(all_stories)
        
        return structured_stories
    
    async def _extract_from_document(self, doc: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract user stories from a single document"""
        stories = []
        paragraphs = doc.get('paragraphs', [])
        
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
    
    async def _extract_story_from_text(self, text: str, doc: Dict[str, Any], paragraph_index: int) -> Optional[Dict[str, Any]]:
        """Extract a single user story from text using AI"""
        try:
            if self.llm_provider == "gemini":
                return await self._extract_with_gemini(text, doc, paragraph_index)
            elif self.llm_provider == "openai":
                return await self._extract_with_openai(text, doc, paragraph_index)
            else:
                return self._extract_with_patterns(text, doc, paragraph_index)
        except Exception as e:
            print(f"Error in AI extraction: {str(e)}")
            return self._extract_with_patterns(text, doc, paragraph_index)
    
    async def _extract_with_gemini(self, text: str, doc: Dict[str, Any], paragraph_index: int) -> Optional[Dict[str, Any]]:
        """Extract user story using Gemini AI"""
        prompt = self._build_extraction_prompt(text)
        
        try:
            response = self.gemini_model.generate_content(prompt)
            if response.text:
                return self._parse_ai_response(response.text, doc, paragraph_index)
        except Exception as e:
            print(f"Gemini extraction failed: {str(e)}")
        
        return None
    
    async def _extract_with_openai(self, text: str, doc: Dict[str, Any], paragraph_index: int) -> Optional[Dict[str, Any]]:
        """Extract user story using OpenAI"""
        prompt = self._build_extraction_prompt(text)
        
        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an expert at extracting user stories from interview transcripts."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3
            )
            
            if response.choices and response.choices[0].message.content:
                return self._parse_ai_response(response.choices[0].message.content, doc, paragraph_index)
        except Exception as e:
            print(f"OpenAI extraction failed: {str(e)}")
        
        return None
    
    def _build_extraction_prompt(self, text: str) -> str:
        """Build the AI extraction prompt"""
        return f"""
        Extract a user story from the following interview text. Focus on workflow management and DAM system requirements.
        
        Text: "{text}"
        
        Please extract and structure the information as a user story in this format:
        {{
            "role": "who needs this capability",
            "capability": "what they need to do",
            "benefit": "why they need it",
            "category": "workflow|dam|integration",
            "priority": "high|medium|low",
            "source_text": "relevant excerpt from the text",
            "requirements": ["list", "of", "specific", "requirements"],
            "acceptance_criteria": ["list", "of", "acceptance", "criteria"]
        }}
        
        If no clear user story can be extracted, return null.
        """
    
    def _parse_ai_response(self, ai_response: str, doc: Dict[str, Any], paragraph_index: int) -> Optional[Dict[str, Any]]:
        """Parse AI response into structured data"""
        try:
            # Try to extract JSON from response
            json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
            if json_match:
                story_data = json.loads(json_match.group())
                
                # Validate required fields
                if all(key in story_data for key in ['role', 'capability', 'benefit']):
                    return {
                        'user_story_id': f"{doc['filename']}_{paragraph_index}",
                        'role': story_data.get('role', 'User'),
                        'capability': story_data.get('capability', ''),
                        'benefit': story_data.get('benefit', ''),
                        'category': story_data.get('category', 'workflow'),
                        'priority': story_data.get('priority', 'medium'),
                        'source_text': story_data.get('source_text', ''),
                        'requirements': story_data.get('requirements', []),
                        'acceptance_criteria': story_data.get('acceptance_criteria', []),
                        'source_file': doc['filename'],
                        'paragraph_index': paragraph_index,
                        'extraction_method': 'ai',
                        'confidence_score': 0.8
                    }
        except Exception as e:
            print(f"Error parsing AI response: {str(e)}")
        
        return None
    
    def _extract_with_patterns(self, text: str, doc: Dict[str, Any], paragraph_index: int) -> Optional[Dict[str, Any]]:
        """Fallback extraction using pattern matching"""
        # Simple pattern-based extraction
        text_lower = text.lower()
        
        # Identify category
        if any(keyword in text_lower for keyword in ['workflow', 'process', 'approval']):
            category = 'workflow'
        elif any(keyword in text_lower for keyword in ['asset', 'digital', 'metadata']):
            category = 'dam'
        else:
            category = 'general'
        
        # Extract basic story elements
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
            'user_story_id': f"{doc['filename']}_{paragraph_index}",
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
            'confidence_score': 0.5
        }
    
    async def _apply_construct_template(self, stories: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Apply the construct template to extracted stories"""
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
        """Structure a story according to the construct template"""
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
            'Tags': self._generate_tags(story)
        }
        
        return structured_story
    
    def _generate_tags(self, story: Dict[str, Any]) -> List[str]:
        """Generate tags for the story"""
        tags = []
        
        # Add category tag
        tags.append(story.get('category', 'general'))
        
        # Add priority tag
        tags.append(story.get('priority', 'medium'))
        
        # Add role tag
        if story.get('role'):
            tags.append(story.get('role').lower())
        
        # Add capability tags
        capability = story.get('capability', '').lower()
        if 'approval' in capability:
            tags.append('approval')
        if 'notification' in capability:
            tags.append('notification')
        if 'routing' in capability:
            tags.append('routing')
        if 'asset' in capability:
            tags.append('asset-management')
        
        return list(set(tags))  # Remove duplicates
    
    def get_extraction_summary(self, stories: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate a summary of extracted stories"""
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
            method = story.get('extraction_method', 'Unknown')
            extraction_methods[method] = extraction_methods.get(method, 0) + 1
        
        return {
            'total_stories': len(stories),
            'category_distribution': categories,
            'priority_distribution': priorities,
            'extraction_methods': extraction_methods,
            'average_confidence': sum(story.get('Match Score', 0) for story in stories) / len(stories),
            'status': 'extraction_completed'
        }
