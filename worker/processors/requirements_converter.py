import os
import uuid
from typing import List, Dict, Any, Optional
from google.generativeai import GenerativeModel
import google.generativeai as genai

class RequirementsConverter:
    """Convert user stories into structured requirements using advanced Gemini AI analysis"""
    
    def __init__(self, gemini_api_key: Optional[str] = None):
        self.gemini_model = None
        if gemini_api_key:
            try:
                genai.configure(api_key=gemini_api_key)
                self.gemini_model = GenerativeModel('gemini-pro')
                print("🚀 Requirements converter initialized with Gemini AI - Ready for intelligent analysis!")
            except Exception as e:
                print(f"⚠️ Failed to initialize Gemini for requirements conversion: {e}")
                self.gemini_model = None
        else:
            print("❌ No Gemini API key provided - requirements conversion will use basic patterns")
    
    def convert_stories_to_requirements(self, user_stories: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Convert user stories to requirements using Gemini AI analysis"""
        if not self.gemini_model:
            print("⚠️ Gemini AI not available - falling back to basic pattern matching")
            return self._convert_with_patterns_batch(user_stories)
        
        print(f"🤖 Gemini AI analyzing {len(user_stories)} user stories for requirements conversion...")
        requirements = []
        
        for i, story in enumerate(user_stories, 1):
            try:
                print(f"📋 Processing story {i}/{len(user_stories)}: {story.get('User Story', 'Unknown')[:50]}...")
                
                # Use Gemini to intelligently convert the story
                story_requirements = self._convert_with_gemini_intelligence(story)
                requirements.extend(story_requirements)
                
                print(f"✅ Story {i} converted to {len(story_requirements)} requirements")
                
            except Exception as e:
                print(f"❌ Error converting story {i}: {e}")
                # Fallback to pattern-based conversion for this story
                fallback_reqs = self._convert_with_patterns(story)
                requirements.extend(fallback_reqs)
                print(f"🔄 Used fallback conversion for story {i}")
                continue
        
        print(f"🎯 Gemini AI successfully generated {len(requirements)} total requirements!")
        return requirements
    
    def _convert_with_gemini_intelligence(self, story: Dict[str, Any]) -> List[Dict[str, Any]]:
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
            prompt = self._build_intelligent_requirements_prompt(story_text, capability, snippet, team, category)
            
            print(f"🧠 Gemini analyzing: {story_text[:100]}...")
            
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
            print(f"💡 Gemini generated response: {requirements_text[:200]}...")
            
            # Parse the AI response into structured requirements
            requirements = self._parse_intelligent_requirements_response(requirements_text, story)
            
            return requirements
            
        except Exception as e:
            print(f"⚠️ Gemini AI conversion failed: {e}")
            return self._convert_with_patterns(story)
    
    def _build_intelligent_requirements_prompt(self, story_text: str, capability: str, snippet: str, team: str, category: str) -> str:
        """Build an intelligent AI prompt for advanced requirements analysis"""
        return f"""
You are an expert business analyst and requirements engineer with deep expertise in software development, business processes, and system architecture. Your task is to analyze the provided user story and generate comprehensive, actionable requirements using advanced analysis techniques.

USER STORY ANALYSIS:
"{story_text}"

CONTEXTUAL INFORMATION:
- Capability: {capability}
- Team: {team}
- Category: {category}
- Technical Context: {snippet}

ANALYSIS APPROACH:
1. **Business Impact Analysis**: Identify the business value, stakeholders, and success metrics
2. **Functional Decomposition**: Break down the user story into logical functional components
3. **Non-Functional Requirements**: Consider performance, security, scalability, usability
4. **Dependency Mapping**: Identify technical and business dependencies
5. **Risk Assessment**: Evaluate implementation complexity and potential challenges

REQUIREMENTS GENERATION GUIDELINES:

**REQ-ID**: Create descriptive, hierarchical identifiers (e.g., "REQ-AUTH-001", "REQ-WF-002", "REQ-INT-003")

**HIGH-LEVEL REQUIREMENT**: Extract the core business need, focusing on:
- What the system must accomplish
- Who the primary users are
- What business value it delivers
- How it fits into the overall system architecture

**PRIORITY LEVEL**: Use intelligent analysis to determine priority:
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
Generate 2-4 requirements per user story. For each requirement, use this exact format:

REQ-ID: [descriptive identifier]
REQUIREMENT: [high-level business requirement]
PRIORITY: [LOW/MEDIUM/HIGH]
REQ-DETAILS: [comprehensive specification with acceptance criteria]

EXAMPLE OUTPUT:
REQ-ID: REQ-AUTH-001
REQUIREMENT: Implement secure user authentication system with role-based access control
PRIORITY: HIGH
REQ-DETAILS: System must support secure login with username/password authentication, implement multi-factor authentication (MFA), enforce password complexity rules (minimum 8 characters, uppercase, lowercase, numbers, special characters), provide password reset functionality with secure token-based verification, implement session management with configurable timeout (default 30 minutes), and support role-based access control with predefined user roles (Admin, Manager, User). Must integrate with existing LDAP/Active Directory systems and provide audit logging for all authentication events.

Use your expertise to analyze the user story thoroughly and generate requirements that are:
- Clear and unambiguous
- Testable and measurable
- Aligned with business objectives
- Technically feasible
- Comprehensive yet focused

Focus on creating requirements that developers can implement and testers can validate.
"""
    
    def _parse_intelligent_requirements_response(self, response_text: str, source_story: Dict[str, Any]) -> List[Dict[str, Any]]:
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
