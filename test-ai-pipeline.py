#!/usr/bin/env python3
"""
Test script to verify the AI processing pipeline is working
"""

import os
import asyncio
from dotenv import load_dotenv
from worker.processors.extraction_engine import ExtractionEngine
from worker.processors.document_processor import DocumentProcessor

# Load environment variables
load_dotenv('./config/local.env')

async def test_ai_pipeline():
    """Test the AI processing pipeline with sample interview content"""
    
    print("🧪 Testing AI Processing Pipeline")
    print("=" * 50)
    
    # Check environment variables
    gemini_key = os.getenv('GEMINI_API_KEY')
    if not gemini_key or gemini_key == 'your-gemini-api-key-here':
        print("❌ GEMINI_API_KEY not set. Please update config/local.env")
        return False
    
    print("✅ Gemini API key found")
    
    # Sample interview transcript content
    sample_interview = """
    Interview with Sarah Johnson, Workflow Manager
    
    Sarah: "We need a better approval process for document submissions. Right now, everything gets stuck in email threads and we lose track of what's been approved and what hasn't."
    
    Interviewer: "Can you describe the current workflow?"
    
    Sarah: "Well, someone submits a document, it goes to their manager for approval, then to the department head, and finally to me for final sign-off. But there's no central system to track this. We need notifications when approvals are pending, and a way to see the status of any document in the pipeline."
    
    Interviewer: "What would make this process better?"
    
    Sarah: "I need a dashboard that shows all pending approvals, with clear status indicators. The system should automatically route documents to the right people, send reminders when approvals are overdue, and maintain an audit trail of who approved what and when."
    
    Interviewer: "What about digital assets?"
    
    Sarah: "Oh yes, we also handle a lot of marketing materials, product images, and documentation. We need a way to organize these assets with proper metadata, version control, and access permissions. Right now, files are scattered across different folders and we can't find anything."
    """
    
    # Create a sample construct
    sample_construct = {
        'name': 'Workflow and DAM Requirements',
        'output_schema': [
            'User Story ID', 'User Story', 'Team', 'Category', 
            'Lifecycle Phase', 'Capability', 'Priority', 'Source', 
            'Snippet', 'Match Score', 'Tags'
        ],
        'defaults': {
            'Team': 'Product',
            'Category': 'Workflow',
            'Lifecycle Phase': 'Execution',
            'Priority': 'Medium'
        },
        'priority_rules': [
            'High: Security, compliance, critical business functions',
            'Medium: User experience, efficiency improvements',
            'Low: Nice-to-have features, optimizations'
        ]
    }
    
    print("\n📝 Sample Interview Content:")
    print("-" * 30)
    print(sample_interview[:200] + "...")
    
    # Test document processing
    print("\n🔧 Testing Document Processing...")
    doc_processor = DocumentProcessor()
    
    # Create a sample document
    sample_doc = {
        'filename': 'interview_sarah_johnson.txt',
        'file_type': 'txt',
        'content': sample_interview
    }
    
    processed_docs = await doc_processor.process_documents([sample_doc])
    print(f"✅ Processed {len(processed_docs)} documents")
    
    if processed_docs:
        doc = processed_docs[0]
        print(f"   - File: {doc['filename']}")
        print(f"   - Paragraphs: {len(doc['paragraphs'])}")
        print(f"   - Speakers: {len(doc['speaker_labels'])}")
        
        # Test AI extraction
        print("\n🤖 Testing AI Extraction...")
        extraction_engine = ExtractionEngine(sample_construct, llm_provider="gemini")
        
        # Extract stories from the first few paragraphs
        paragraphs = doc['paragraphs'][:3]  # Test with first 3 paragraphs
        extracted_stories = []
        
        for i, paragraph in enumerate(paragraphs):
            if len(paragraph.strip()) > 20:  # Only process substantial paragraphs
                print(f"\n   Processing paragraph {i+1}: {paragraph[:100]}...")
                
                story = await extraction_engine._extract_story_from_text(paragraph, doc, i)
                if story:
                    extracted_stories.append(story)
                    print(f"   ✅ Extracted story: {story.get('User Story', '')[:80]}...")
                else:
                    print(f"   ⚠️  No story extracted from paragraph {i+1}")
        
        print(f"\n📊 Extraction Results:")
        print(f"   - Total paragraphs processed: {len(paragraphs)}")
        print(f"   - Stories extracted: {len(extracted_stories)}")
        
        if extracted_stories:
            print("\n🎯 Sample Extracted Stories:")
            for i, story in enumerate(extracted_stories[:2]):  # Show first 2 stories
                print(f"\n   Story {i+1}:")
                print(f"   - ID: {story.get('User Story ID', 'N/A')}")
                print(f"   - Story: {story.get('User Story', 'N/A')}")
                print(f"   - Category: {story.get('Category', 'N/A')}")
                print(f"   - Priority: {story.get('Priority', 'N/A')}")
                print(f"   - Method: {story.get('Extraction Method', 'N/A')}")
        
        # Test construct application
        print("\n🏗️  Testing Construct Application...")
        structured_stories = await extraction_engine._apply_construct_template(extracted_stories)
        print(f"✅ Applied construct template to {len(structured_stories)} stories")
        
        if structured_stories:
            print("\n📋 Final Structured Output:")
            for story in structured_stories[:2]:
                print(f"   - {story.get('User Story', 'N/A')}")
                print(f"     Team: {story.get('Team', 'N/A')}")
                print(f"     Category: {story.get('Category', 'N/A')}")
                print(f"     Priority: {story.get('Priority', 'N/A')}")
        
        return True
    else:
        print("❌ Document processing failed")
        return False

if __name__ == "__main__":
    print("🚀 Starting AI Pipeline Test")
    print("Make sure you have:")
    print("1. GEMINI_API_KEY set in config/local.env")
    print("2. Google Cloud credentials configured")
    print("3. All dependencies installed")
    print()
    
    try:
        success = asyncio.run(test_ai_pipeline())
        if success:
            print("\n🎉 AI Pipeline Test Completed Successfully!")
            print("Your Interview ETL app is ready to process real interview transcripts!")
        else:
            print("\n❌ AI Pipeline Test Failed")
            print("Check the error messages above and verify your configuration.")
    except Exception as e:
        print(f"\n💥 Test failed with error: {str(e)}")
        print("Make sure all dependencies are installed and environment is configured.")
