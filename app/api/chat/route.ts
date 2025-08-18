import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI with backend API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Knowledge base context for the Interview ETL application
const KNOWLEDGE_BASE = `
Interview ETL transforms stakeholder interview transcripts into structured user stories and requirements using AI. It's a 5-step workflow: 1) Define output schema, 2) Upload transcripts, 3) AI processing, 4) Edit user stories, 5) Generate requirements.

Key Capabilities:
- File Support: TXT, DOCX, PDF, Markdown, ZIP (up to 50MB individual, 500MB total)
- AI Processing: Gemini AI with Vertex AI vectorization (2-5 min processing time)
- Output Formats: CSV export for user stories and requirements
- Editing: Full inline editing of extracted data
- Validation: Confidence scoring and quality metrics

Technical Architecture:
- Frontend: Next.js 14 with React 18 and TypeScript
- Backend: FastAPI with Python 3.11+
- AI: Google Gemini API + Vertex AI for embeddings
- Storage: Google Cloud Firestore + Cloud Storage
- Processing: Async worker with Pub/Sub integration

Data Models:
- User Story: id, userStory, stakeholder info, epic, priority, confidence, tags
- Requirement: req_id, requirement, priority_level, req_details, source_story_id
- Construct: name, output_schema, pattern, validation_rules

Best Practices:
- Use structured interview guides with clear stakeholder identification
- Keep output schemas focused but comprehensive
- Review AI extractions and validate confidence scores
- Process interviews in logical batches for better context
- Maintain consistent naming conventions across projects

Common Questions & Answers:
- "How does it work?": 5-step workflow from schema definition to requirements generation
- "What file formats?": TXT, DOCX, PDF, Markdown, ZIP with size limits
- "How long does processing take?": 2-5 minutes depending on file count and size
- "Can I edit the results?": Yes, full inline editing of user stories and requirements
- "What makes this different?": AI-powered extraction with vectorization for context awareness
- "How do I get started?": Click Get Started → Define output structure → Upload transcripts
`;

interface ChatContext {
  currentStep: string;
  construct?: any;
  userStories?: any[];
  requirements?: any[];
  transcripts?: any[];
  chatHistory?: Array<{type: 'user' | 'assistant', message: string, timestamp: Date}>;
}

interface ChatRequest {
  message: string;
  context: ChatContext;
}

function createContextAwarePrompt(userQuestion: string, context: ChatContext): string {
  const { currentStep, construct, userStories, requirements, transcripts, chatHistory } = context;
  
  // Build context string
  let contextString = `Current Step: ${currentStep}\n`;
  
  if (construct) {
    contextString += `Construct: ${construct.name} with ${construct.output_schema?.length || 0} fields\n`;
  }
  
  if (userStories && userStories.length > 0) {
    contextString += `User Stories: ${userStories.length} stories available\n`;
  }
  
  if (requirements && requirements.length > 0) {
    contextString += `Requirements: ${requirements.length} requirements available\n`;
  }
  
  if (transcripts && transcripts.length > 0) {
    contextString += `Transcripts: ${transcripts.length} transcripts processed\n`;
  }
  
  // Build conversation context from recent chat history
  let conversationContext = '';
  if (chatHistory && chatHistory.length > 0) {
    const recentHistory = chatHistory.slice(-6); // Last 6 messages for context
    conversationContext = '\n\nRecent Conversation Context:\n';
    recentHistory.forEach(chat => {
      conversationContext += `${chat.type === 'user' ? 'User' : 'Assistant'}: ${chat.message}\n`;
    });
  }
  
  return `
You are an AI assistant for the Interview ETL application. Use the following knowledge base to provide helpful, context-aware assistance:

${KNOWLEDGE_BASE}

Current User Context:
${contextString}${conversationContext}

User Question: ${userQuestion}

Instructions:
1. Be helpful, specific, and context-aware
2. Reference the user's current step and data when possible
3. Provide actionable advice and clear explanations
4. Use the knowledge base to give accurate, detailed responses
5. If the user is asking about a specific step, provide guidance for that step
6. If they're asking about capabilities, explain what the app can do
7. Consider the conversation history for continuity and context
8. Always be encouraging and supportive
9. If the user is referencing previous questions or context, acknowledge that continuity

Please provide a helpful response based on the user's question and current context:
`;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, context } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Check if Gemini API is configured
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your-actual-gemini-api-key-here') {
      return NextResponse.json(
        { error: 'Gemini API not configured on backend' },
        { status: 500 }
      );
    }

    // Create context-aware prompt
    const prompt = createContextAwarePrompt(message, context);
    
    // Generate response using Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ response: text });
    
  } catch (error) {
    console.error('Chat API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate response',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
