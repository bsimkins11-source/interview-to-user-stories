'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useToast } from './ui/use-toast';
import { MessageCircle, Send, Minimize2, Maximize2, X, Lightbulb, FileText, Users, Workflow, Brain } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: string;
}

interface GeminiAssistantProps {
  currentStep: number;
  construct?: any;
  jobStatus?: string;
  userStories?: any[];
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export default function GeminiAssistant({ 
  currentStep, 
  construct, 
  jobStatus, 
  userStories,
  isMinimized = false,
  onToggleMinimize 
}: GeminiAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: '1',
        type: 'assistant',
        content: getWelcomeMessage(currentStep),
        timestamp: new Date(),
        context: 'welcome'
      }]);
    }
  }, [currentStep, messages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getWelcomeMessage = (step: number): string => {
    switch (step) {
      case 1:
        return "👋 Welcome! I'm here to help you with the ETL process. I can help you define your output structure, understand user story formats, and answer questions about workflow management requirements. What would you like to know?";
      case 2:
        return "📁 Great! Now you're adding interview transcripts. I can help you with file formats, processing options, or answer questions about what happens during the extraction phase. How can I assist you?";
      case 3:
        return "⚙️ Processing is underway! I can explain what's happening, answer questions about the AI extraction, or help you understand the deduplication process. What would you like to know?";
      case 4:
        return "🎉 Processing complete! I can help you analyze the results, explain the user stories, or answer questions about the output format. What would you like to explore?";
      default:
        return "👋 Hello! I'm your AI assistant for the Interview ETL process. I can help you with any questions about user stories, interviews, or the ETL workflow. What would you like to know?";
    }
  };

  const getContextualSuggestions = (): string[] => {
    const suggestions = [];
    
    if (currentStep === 1) {
      suggestions.push(
        "How do I structure user stories for workflow management?",
        "What's the difference between user stories and requirements?",
        "Can you help me create a construct template?",
        "What fields should I include in my output schema?"
      );
    } else if (currentStep === 2) {
      suggestions.push(
        "What file formats are supported?",
        "How do I prepare my interview transcripts?",
        "Can I import from Google Drive or SharePoint?",
        "What happens during the processing phase?"
      );
    } else if (currentStep === 3) {
      suggestions.push(
        "How does the AI extraction work?",
        "What is deduplication and why is it important?",
        "How long does processing typically take?",
        "Can I see the progress in real-time?"
      );
    } else if (currentStep === 4) {
      suggestions.push(
        "How do I interpret the confidence scores?",
        "What do the different categories mean?",
        "How can I export the results?",
        "Can I compare these results with existing requirements?"
      );
    }

    // Add general suggestions
    suggestions.push(
      "What is the ETL process?",
      "How do I get the best results?",
      "Can you explain the AI technology used?",
      "What are some best practices for user stories?"
    );

    return suggestions.slice(0, 4);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Simulate AI response with context awareness
      const response = await generateAIResponse(inputValue, currentStep, construct, jobStatus, userStories);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date(),
        context: 'ai_response'
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsTyping(false);
    }
  };

  const generateAIResponse = async (
    question: string, 
    step: number, 
    construct?: any, 
    status?: string, 
    stories?: any[]
  ): Promise<string> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const questionLower = question.toLowerCase();
    
    // Context-aware responses based on current step and question
    if (step === 1 && questionLower.includes('user story')) {
      return `Great question! User stories follow the format: "As a [role], I need [capability] so that [benefit]." 

For workflow management, focus on:
• **Role**: Who needs this (e.g., "manager", "approver", "user")
• **Capability**: What they need to do (e.g., "approve documents", "route requests")
• **Benefit**: Why they need it (e.g., "to ensure compliance", "to streamline processes")

Your construct template will help structure these into consistent output. Would you like me to help you create a specific template?`;
    }

    if (step === 2 && questionLower.includes('file format')) {
      return `I support multiple file formats for interview transcripts:

📁 **ZIP Archives**: Best for multiple files - just zip all your transcripts together
📄 **Text Files (.txt)**: Plain text transcripts
📝 **Word Documents (.docx)**: Microsoft Word files
📋 **PDF Files (.pdf)**: Scanned or exported documents
📖 **Markdown (.md)**: Structured text files

**Pro Tips:**
• ZIP files are most efficient for multiple documents
• Ensure text is readable (not scanned images)
• Include speaker labels if possible (e.g., "Interviewer:", "Subject:")
• Remove sensitive information before upload

What type of files do you have?`;
    }

    if (step === 3 && questionLower.includes('ai extraction')) {
      return `The AI extraction process works in several stages:

🧠 **Content Analysis**: I analyze your interview transcripts to identify workflow-related content
🎯 **Pattern Recognition**: I look for user story patterns and requirements
🏷️ **Categorization**: I automatically categorize content as workflow, DAM, or integration
📊 **Scoring**: Each extracted story gets a confidence score

**What I'm looking for:**
• Workflow processes and approvals
• User roles and responsibilities
• System capabilities and requirements
• Business rules and decision points

The process typically takes 2-5 seconds per paragraph. You'll see real-time progress updates!`;
    }

    if (step === 4 && questionLower.includes('confidence score')) {
      return `Confidence scores indicate how reliable each extracted user story is:

🟢 **0.8-1.0 (High)**: Clear, well-structured requirements with good context
🟡 **0.6-0.79 (Medium)**: Good requirements but may need minor clarification
🟠 **0.4-0.59 (Low)**: Basic requirements that might benefit from review

**Factors affecting scores:**
• Clarity of the original text
• Presence of user story format
• Specificity of requirements
• Context completeness

**Recommendations:**
• High confidence stories can be used directly
• Medium confidence stories may need minor edits
• Low confidence stories should be reviewed and enhanced

Would you like me to help you improve any specific stories?`;
    }

    if (questionLower.includes('etl process')) {
      return `The ETL (Extract, Transform, Load) process for interview transcripts works like this:

📥 **Extract**: I process your interview files (TXT, DOCX, PDF, etc.) and extract the text content
🔄 **Transform**: I use AI to identify user stories, categorize them, and structure them according to your template
📤 **Load**: I generate a CSV file with all the extracted user stories, ready for your workflow management system

**Key Benefits:**
• **Consistency**: Same input always produces same output
• **Efficiency**: Process hundreds of pages in minutes
• **Quality**: AI-powered extraction with confidence scoring
• **Flexibility**: Support for multiple input formats and sources

This is perfect for converting stakeholder interviews into actionable requirements!`;
    }

    if (questionLower.includes('best practice')) {
      return `Here are some best practices for getting great results:

📋 **Prepare Your Transcripts:**
• Use clear speaker labels (Interviewer:, Subject:)
• Include context about the business process
• Mention specific roles and responsibilities
• Describe current pain points and desired outcomes

🎯 **Define Your Output Structure:**
• Include essential fields (User Story, Role, Capability, Benefit)
• Add relevant categories (Workflow, DAM, Integration)
• Set appropriate priorities and lifecycle phases
• Use consistent terminology

📊 **Review and Refine:**
• Check high-confidence stories first
• Review low-confidence stories for improvement
• Validate against your business context
• Export to your preferred format

**Pro Tip**: Start with a small batch to test your setup, then scale up!`;
    }

    // Default response for other questions
    return `I understand you're asking about "${question}". Let me provide some helpful information:

Based on your current ETL step (${step}), I can help you with:
• Understanding the process
• Best practices for your current stage
• Troubleshooting any issues
• Explaining the technology and methodology

Could you be more specific about what you'd like to know? I'm here to help make your ETL process as smooth as possible!`;
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={onToggleMinimize}
          size="sm"
          className="rounded-full shadow-lg"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          AI Assistant
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">AI Assistant</CardTitle>
              <Badge variant="secondary" className="text-xs">
                Gemini
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleMinimize}
                className="h-8 w-8 p-0"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>
            Ask me anything about user stories, interviews, or the ETL process
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Messages */}
          <div className="h-64 overflow-y-auto space-y-3 pr-2">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-2 ${
                    message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500 font-medium">💡 Quick Questions:</p>
            <div className="flex flex-wrap gap-2">
              {getContextualSuggestions().map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-xs h-7 px-2"
                >
                  {suggestion.length > 30 ? suggestion.substring(0, 30) + '...' : suggestion}
                </Button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about user stories, interviews, or ETL..."
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Context Info */}
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex items-center gap-2">
              <Workflow className="h-3 w-3" />
              <span>Step {currentStep}: {getStepName(currentStep)}</span>
            </div>
            {construct && (
              <div className="flex items-center gap-2">
                <FileText className="h-3 w-3" />
                <span>Construct: {construct.name || 'Default'}</span>
              </div>
            )}
            {jobStatus && (
              <div className="flex items-center gap-2">
                <Users className="h-3 w-3" />
                <span>Status: {jobStatus}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const getStepName = (step: number): string => {
  switch (step) {
    case 1: return 'Define Structure';
    case 2: return 'Add Transcripts';
    case 3: return 'Process & Extract';
    case 4: return 'Download Results';
    default: return 'Setup';
  }
};
