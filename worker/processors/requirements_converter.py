import os
import logging
import uuid
from typing import List, Dict, Any, Optional
from google.generativeai import GenerativeModel
import google.generativeai as genai

# Configure logging
logger = logging.getLogger(__name__)

class RequirementsConverter:
    """Convert user stories into structured requirements using advanced Gemini AI analysis"""
    
    def __init__(self, gemini_api_key: Optional[str] = None, requirements_construct: Optional[Dict[str, Any]] = None):
        self.gemini_model = None
        self.requirements_construct = requirements_construct
        
        if gemini_api_key:
            try:
                genai.configure(api_key=gemini_api_key)
                self.gemini_model = GenerativeModel('gemini-pro')
                logger.info("🚀 Requirements converter initialized with Gemini AI - Ready for intelligent analysis!")
                if requirements_construct:
                    logger.info(f"📋 Using requirements construct: {requirements_construct.get('name', 'Unknown')} with {len(requirements_construct.get('output_schema', []))} fields")
            except Exception as e:
                logger.error(f"⚠️ Failed to initialize Gemini for requirements conversion: {e}")
                self.gemini_model = None
        else:
            logger.warning("❌ No Gemini API key provided - requirements conversion will use basic patterns")
    
    def convert_stories_to_requirements(self, user_stories: List[Dict[str, Any]], user_stories_construct: Optional[Dict[str, Any]] = None, vectorized_chunks: Optional[List[Dict[str, Any]]] = None) -> List[Dict[str, Any]]:
        """Convert user stories to requirements using Gemini AI analysis with both constructs and vectorized context"""
        if not self.gemini_model:
            logger.warning("⚠️ Gemini AI not available - falling back to basic pattern matching")
            return self._convert_with_patterns_batch(user_stories)
        
        logger.info(f"🤖 Gemini AI analyzing {len(user_stories)} user stories for requirements conversion...")
        logger.info(f"📊 User stories construct: {user_stories_construct.get('name', 'Unknown') if user_stories_construct else 'None'}")
        logger.info(f"📋 Requirements construct: {self.requirements_construct.get('name', 'Unknown') if self.requirements_construct else 'None'}")
        logger.info(f"🧠 Vectorized context: {len(vectorized_chunks) if vectorized_chunks else 0} chunks available")
        
        requirements = []
        
        for i, story in enumerate(user_stories, 1):
            try:
                logger.info(f"📋 Processing story {i}/{len(user_stories)}: {story.get('User Story', 'Unknown')[:50]}...")
                
                # Get relevant context chunks for this story
                context_chunks = []
                if vectorized_chunks:
                    context_chunks = self._get_context_for_story(story, vectorized_chunks)
                    logger.info(f"🔍 Found {len(context_chunks)} relevant context chunks for story {i}")
                
                # Use Gemini to intelligently convert the story using both constructs and context
                story_requirements = self._convert_with_gemini_intelligence(story, user_stories_construct, context_chunks)
                requirements.extend(story_requirements)
                
                logger.info(f"✅ Story {i} converted to {len(story_requirements)} requirements")
                
            except Exception as e:
                logger.error(f"❌ Error converting story {i}: {e}")
                # Fallback to pattern-based conversion for this story
                fallback_reqs = self._convert_with_patterns(story)
                requirements.extend(fallback_reqs)
                logger.info(f"🔄 Used fallback conversion for story {i}")
                continue
        
        logger.info(f"🎯 Gemini AI successfully generated {len(requirements)} total requirements!")
        return requirements
    
    def _convert_with_gemini_intelligence(self, story: Dict[str, Any], user_stories_construct: Optional[Dict[str, Any]] = None, context_chunks: Optional[List[Dict[str, Any]]] = None) -> List[Dict[str, Any]]:
        """Use Gemini AI to intelligently analyze and convert user stories to requirements"""
        try:
            # Extract story content
            story_text = story.get('User Story', '')
            capability = story.get('Capability', '')
            snippet = story.get('Snippet', '')
            team = story.get('Team', '')
            category = story.get('Category', '')
            
            if not story_text:
                return []
            
            # Build advanced AI prompt for intelligent requirements analysis
            prompt = self._build_intelligent_requirements_prompt(story_text, capability, snippet, team, category, user_stories_construct, context_chunks)
            
            logger.info(f"🧠 Gemini analyzing: {story_text[:100]}...")
            
            # Generate requirements using Gemini with enhanced configuration
            response = self.gemini_model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.3,  # Lower temperature for more consistent output
                    top_p=0.8,
                    top_k=40,
                    max_output_tokens=2048,
                )
            )
            
            requirements_text = response.text
            logger.info(f"💡 Gemini generated response: {requirements_text[:200]}...")
            
            # Parse the AI response into structured requirements
            requirements = self._parse_intelligent_requirements_response(requirements_text, story, self.requirements_construct)
            
            return requirements
            
        except Exception as e:
            logger.error(f"⚠️ Gemini AI conversion failed: {e}")
            return self._convert_with_patterns(story)
    
    def _build_intelligent_requirements_prompt(self, story_text: str, capability: str, snippet: str, team: str, category: str, user_stories_construct: Optional[Dict[str, Any]] = None, context_chunks: Optional[List[Dict[str, Any]]] = None) -> str:
        """Build an intelligent AI prompt for advanced requirements analysis using both constructs"""
        
        # Build user stories construct context
        user_stories_context = ""
        if user_stories_construct:
            user_stories_context = f"""
USER STORIES CONSTRUCT CONTEXT:
- Template: {user_stories_construct.get('name', 'Unknown')}
- Output Schema: {', '.join(user_stories_construct.get('output_schema', []))}
- Pattern: {user_stories_construct.get('pattern', 'Standard pattern')}
- Defaults: {', '.join([f'{k}: {v}' for k, v in user_stories_construct.get('defaults', {}).items()])}
"""
        
        # Build requirements construct context
        requirements_context = ""
        if self.requirements_construct:
            requirements_context = f"""
REQUIREMENTS CONSTRUCT CONTEXT:
- Template: {self.requirements_construct.get('name', 'Unknown')}
- Output Schema: {', '.join(self.requirements_construct.get('output_schema', []))}
- Pattern: {self.requirements_construct.get('pattern', 'Standard pattern')}
- Defaults: {', '.join([f'{k}: {v}' for k, v in self.requirements_construct.get('defaults', {}).items()])}
- Priority Rules: {'; '.join(self.requirements_construct.get('priority_rules', []))}
"""
        
        # Build vectorized context context
        vectorized_context_context = ""
        if context_chunks:
            vectorized_context_context = f"""
VECTORIZED CONTEXT:
- Chunks: {len(context_chunks)}
- Example Chunks:
"""
            for i, chunk in enumerate(context_chunks[:3]): # Show first 3 chunks for context
                vectorized_context_context += f"""
  Chunk {i+1}:
  - Text: {chunk.get('text', 'N/A')}
  - Embedding: {len(chunk.get('embedding', []))} dimensions
"""
        
        return f"""
You are an expert business analyst and requirements engineer with deep expertise in software development, business processes, and system architecture. Your task is to analyze the provided user story and generate comprehensive, actionable requirements using advanced analysis techniques.

USER STORY ANALYSIS:
"{story_text}"

CONTEXTUAL INFORMATION:
- Capability: {capability}
- Team: {team}
- Category: {category}
- Technical Context: {snippet}

{user_stories_context}

{requirements_context}

{vectorized_context_context}

ANALYSIS APPROACH:
1. **Business Impact Analysis**: Identify the business value, stakeholders, and success metrics
2. **Functional Decomposition**: Break down the user story into logical functional components
3. **Non-Functional Requirements**: Consider performance, security, scalability, usability
4. **Dependency Mapping**: Identify technical and business dependencies
5. **Risk Assessment**: Evaluate implementation complexity and potential challenges

REQUIREMENTS GENERATION GUIDELINES:

**OUTPUT SCHEMA**: You MUST generate requirements that match the exact output schema defined above. Each requirement should include ALL required fields.

**REQ-ID**: Create descriptive, hierarchical identifiers (e.g., "REQ-001", "REQ-AUTH-001")

**HIGH-LEVEL REQUIREMENT**: Extract the core business need, focusing on:
- What the system must accomplish
- Who the primary users are
- What business value it delivers
- How it fits into the overall system architecture

**PRIORITY LEVEL**: Use the priority rules defined above to determine priority:
- HIGH: Critical business functions, security, compliance, revenue impact, customer-facing features
- MEDIUM: Important operational features, user experience improvements, efficiency gains
- LOW: Nice-to-have features, future enhancements, minor improvements

**REQUIREMENT DETAILS**: Provide comprehensive specification including:
- Functional requirements with clear acceptance criteria
- Non-functional requirements (performance, security, usability, scalability)
- Business rules and validation logic
- Integration points and data flows
- User interface and experience requirements
- Testing and quality assurance requirements
- Implementation constraints and assumptions

OUTPUT FORMAT:
Generate 2-4 requirements per user story. For each requirement, use this exact format matching the output schema:

{self._build_output_format_instructions()}

Use your expertise to analyze the user story thoroughly and generate requirements that are:
- Clear and unambiguous
- Testable and measurable
- Aligned with business objectives
- Technically feasible
- Comprehensive yet focused
- EXACTLY matching the defined output schema

Focus on creating requirements that developers can implement and testers can validate.
"""

    def _build_output_format_instructions(self) -> str:
        """Build the output format instructions based on the requirements construct"""
        if not self.requirements_construct:
            return """
REQ-ID: [descriptive identifier]
REQUIREMENT: [high-level business requirement]
PRIORITY: [LOW/MEDIUM/HIGH]
REQ-DETAILS: [comprehensive specification with acceptance criteria]
"""
        
        schema = self.requirements_construct.get('output_schema', [])
        defaults = self.requirements_construct.get('defaults', {})
        
        format_lines = []
        for field in schema:
            default_value = defaults.get(field, '')
            if default_value:
                format_lines.append(f"{field.upper()}: [{default_value}]")
            else:
                format_lines.append(f"{field.upper()}: [value]")
        
        return '\n'.join(format_lines)
    
    def _parse_intelligent_requirements_response(self, response_text: str, source_story: Dict[str, Any], requirements_construct: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Parse the intelligent AI response into structured requirements"""
        requirements = []
        current_req = {}
        
        lines = response_text.strip().split('\n')
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            if line.startswith('REQ-ID:'):
                # Save previous requirement if exists and complete
                if current_req and len(current_req) >= 4:
                    current_req['source_story_id'] = source_story.get('id', str(uuid.uuid4()))
                    requirements.append(current_req.copy())
                
                # Start new requirement
                current_req = {'req_id': line.replace('REQ-ID:', '').strip()}
                
            elif line.startswith('REQUIREMENT:'):
                current_req['requirement'] = line.replace('REQUIREMENT:', '').strip()
                
            elif line.startswith('PRIORITY:'):
                priority = line.replace('PRIORITY:', '').strip().upper()
                # Normalize priority values
                if priority in ['LOW', 'MEDIUM', 'HIGH']:
                    current_req['priority_level'] = priority
                else:
                    current_req['priority_level'] = 'MEDIUM'  # Default
                    
            elif line.startswith('REQ-DETAILS:'):
                current_req['req_details'] = line.replace('REQ-DETAILS:', '').strip()
        
        # Add the last requirement
        if current_req and len(current_req) >= 4:
            current_req['source_story_id'] = source_story.get('id', str(uuid.uuid4()))
            requirements.append(current_req)
        
        return requirements
    
    def _convert_with_patterns_batch(self, user_stories: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Batch pattern-based conversion when AI is not available"""
        requirements = []
        
        for story in user_stories:
            story_reqs = self._convert_with_patterns(story)
            requirements.extend(story_reqs)
        
        return requirements
    
    def _convert_with_patterns(self, story: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Fallback pattern-based conversion when AI is not available"""
        story_text = story.get('User Story', '')
        capability = story.get('Capability', '')
        
        if not story_text:
            return []
        
        # Generate a simple requirement based on patterns
        req_id = f"REQ-{str(uuid.uuid4())[:8].upper()}"
        
        # Determine priority based on keywords
        priority = 'MEDIUM'  # Default
        if any(word in story_text.lower() for word in ['critical', 'urgent', 'security', 'compliance', 'revenue', 'customer', 'core']):
            priority = 'HIGH'
        elif any(word in story_text.lower() for word in ['nice', 'future', 'enhancement', 'optional', 'improvement']):
            priority = 'LOW'
        
        # Create requirement
        requirement = {
            'req_id': req_id,
            'requirement': f"Implement {capability.lower() if capability else 'user story functionality'}",
            'priority_level': priority,
            'req_details': f"Convert user story: {story_text[:100]}...",
            'source_story_id': story.get('id', str(uuid.uuid4()))
        }
        
        return [requirement]

    def _get_context_for_story(self, story: Dict[str, Any], vectorized_chunks: List[Dict[str, Any]], context_window: int = 3) -> List[Dict[str, Any]]:
        """Get relevant context chunks for a specific user story"""
        if not vectorized_chunks:
            return []
        
        try:
            # Use the story text to find relevant context
            story_text = story.get('User Story', '') + ' ' + story.get('Capability', '')
            
            # Find most similar chunks
            similarities = []
            for chunk in vectorized_chunks:
                if 'embedding' in chunk and chunk['embedding']:
                    # Simple text similarity for now (could be enhanced with embedding similarity)
                    chunk_text = chunk.get('text', '').lower()
                    story_words = story_text.lower().split()
                    
                    # Calculate word overlap similarity
                    overlap = sum(1 for word in story_words if word in chunk_text)
                    if overlap > 0:
                        similarities.append((overlap, chunk))
            
            # Sort by similarity and return top chunks
            similarities.sort(key=lambda x: x[0], reverse=True)
            return [chunk for _, chunk in similarities[:context_window]]
            
        except Exception as e:
            logger.error(f"⚠️ Error getting context for story: {e}")
            return []
