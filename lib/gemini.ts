import { GoogleGenerativeAI } from '@google/generative-ai';

// Get API key from environment
const getApiKey = (): string => {
  if (typeof window !== 'undefined') {
    // Client-side: try to get from window or localStorage as fallback
    return (window as any).__GEMINI_API_KEY__ || localStorage.getItem('gemini-api-key') || '';
  }
  // Server-side: use process.env
  return process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
};

// Initialize Gemini AI with dynamic API key
let genAI: GoogleGenerativeAI | null = null;

const initializeGemini = (): GoogleGenerativeAI | null => {
  const apiKey = getApiKey();
  if (!apiKey || apiKey === 'your-actual-gemini-api-key-here') {
    return null;
  }
  
  try {
    return new GoogleGenerativeAI(apiKey);
  } catch (error) {
    console.error('Failed to initialize Gemini:', error);
    return null;
  }
};

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

export interface GeminiResponse {
  text: string;
  error?: string;
}

export interface ChatContext {
  currentStep: string;
  construct?: any;
  userStories?: any[];
  requirements?: any[];
  transcripts?: any[];
  chatHistory?: Array<{type: 'user' | 'assistant', message: string, timestamp: Date}>;
}

export async function generateGeminiResponse(
  userQuestion: string,
  context: ChatContext
): Promise<GeminiResponse> {
  try {
    // Initialize Gemini if not already done
    if (!genAI) {
      genAI = initializeGemini();
    }
    
    if (!genAI) {
      return {
        text: "I'm sorry, but the Gemini AI service is not configured. Please check your API key configuration in the .env.local file.",
        error: "API key not configured"
      };
    }

    // Create context-aware prompt
    const prompt = createContextAwarePrompt(userQuestion, context);
    
    // Generate response using Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return { text };
  } catch (error) {
    console.error('Gemini API error:', error);
    return {
      text: "I'm sorry, but I encountered an error while processing your request. Please try again or contact support if the issue persists.",
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

function createContextAwarePrompt(userQuestion: string, context: ChatContext): string {
  const { currentStep, construct, userStories, requirements, transcripts, chatHistory } = context;
  
  // Build context string
  let contextString = `Current Step: ${currentStep}\n`;
  
  if (construct) {
    contextString += `Construct: ${construct.name} with ${construct.output_schema?.length || 0} fields\n`;
  }
  
  if (transcripts && transcripts.length > 0) {
    contextString += `Transcripts: ${transcripts.length} files uploaded\n`;
  }
  
  if (userStories && userStories.length > 0) {
    contextString += `User Stories: ${userStories.length} extracted\n`;
  }
  
  if (requirements && requirements.length > 0) {
    contextString += `Requirements: ${requirements.length} generated\n`;
  }

  // Add conversation history for context
  let conversationContext = '';
  if (chatHistory && chatHistory.length > 0) {
    conversationContext = `\nRecent Conversation History:\n${chatHistory.slice(-6).map(chat => 
      `${chat.type === 'user' ? 'User' : 'Assistant'}: ${chat.message}`
    ).join('\n')}\n`;
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

// Helper function to get step-specific guidance
export function getStepSpecificGuidance(currentStep: string): string {
  switch (currentStep) {
    case 'home':
      return "You're on the home page. I can help you understand how the Interview ETL process works, what it can do, and how to get started.";
    
    case 'construct':
      return "You're defining your output structure. I can help you design effective schemas, choose the right fields, and create pattern templates.";
    
    case 'upload':
      return "You're uploading interview transcripts. I can help you prepare files, understand supported formats, and organize your data effectively.";
    
    case 'process':
      return "You're processing your transcripts with AI. I can explain how the extraction works, what to expect, and how to monitor progress.";
    
    case 'download':
      return "You're reviewing your results. I can help you understand the output, validate quality, and prepare for the next steps.";
    
    case 'userStories':
      return "You're editing user stories. I can help you refine the extracted data, add missing information, and ensure quality.";
    
    case 'requirements_construct':
      return "You're defining requirements structure. I can help you design schemas that effectively map user stories to technical requirements.";
    
    case 'requirements':
      return "You're working with requirements. I can help you convert user stories, validate requirements, and prepare for development.";
    
    default:
      return "I'm here to help you with the Interview ETL process. What would you like to know?";
  }
}
