"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Send, X, HelpCircle, Lightbulb, BookOpen, Zap, Target, FileText, Upload, Play, Download, Settings } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface GeminiAssistantProps {
  currentStep: string;
  construct?: any;
  userStories?: any[];
}

export function GeminiAssistant({ currentStep, construct, userStories }: GeminiAssistantProps) {
  const [isOpen, setIsOpen] = useState(currentStep === 'home'); // Open by default on home page
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Session-based chat history that persists across page navigation
  const [chatHistory, setChatHistory] = useState<Array<{type: 'user' | 'assistant', message: string, timestamp: Date}>>(() => {
    // Initialize from localStorage if available, otherwise empty array
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gemini-chat-history');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Convert timestamp strings back to Date objects
          return parsed.map((chat: any) => ({
            ...chat,
            timestamp: new Date(chat.timestamp)
          }));
        } catch (e) {
          console.warn('Failed to parse saved chat history:', e);
          return [];
        }
      }
    }
    return [];
  });

  // Save chat history to localStorage whenever it changes
  const saveChatHistory = (history: Array<{type: 'user' | 'assistant', message: string, timestamp: Date}>) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gemini-chat-history', JSON.stringify(history));
    }
  };

  // Update localStorage whenever chat history changes
  useEffect(() => {
    saveChatHistory(chatHistory);
  }, [chatHistory]);

  // Clear chat history when user leaves the app (optional - can be triggered by user action)
  const clearChatHistory = () => {
    setChatHistory([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gemini-chat-history');
    }
  };

  // Get step-specific guidance text
  const getStepSpecificGuidance = (step: string): string => {
    switch (step) {
      case 'home':
        return "I'm here to help you understand the app experience, process, and answer questions about your vectorized interview data. Ask me anything about how the Interview ETL works!";
      case 'construct':
        return "I can help you define your output structure and understand best practices for creating effective schemas.";
      case 'upload':
        return "I can guide you through the file upload process and explain supported formats and size limits.";
      case 'process':
        return "I can explain the AI processing pipeline and help you understand what's happening during extraction.";
      case 'download':
        return "I can help you understand the output formats and guide you through downloading your results.";
      case 'userStories':
        return "I can help you edit and refine your user stories, and explain best practices for story writing.";
      case 'requirements_construct':
        return "I can guide you through creating requirements and explain how they relate to user stories.";
      case 'requirements':
        return "I can help you review and refine your requirements, ensuring they're clear and actionable.";
      default:
        return "I'm here to help you with the Interview ETL process. Ask me anything about how it works!";
    }
  };

  const getStepContext = () => {
    switch (currentStep) {
      case 'home':
        return {
          title: "AI Assistant - Interview ETL",
          description: "I'm here to help you understand the app experience, process, and answer questions about your vectorized interview data",
          icon: MessageCircle,
          color: "purple",
          suggestions: [
            "How does the Interview ETL process work?",
            "What can I do with vectorized interview data?",
            "How do I get started with the app?",
            "What are the best practices for interview processing?",
            "How does the AI extraction work?",
            "Can you explain the vectorization process?",
            "What file formats are supported?",
            "How does the requirements generation work?",
            "What makes this different from other tools?",
            "How do I optimize my interview questions?"
          ],
          capabilities: [
            "App experience guidance",
            "Process explanation",
            "Vectorized data insights",
            "AI extraction details",
            "Best practices",
            "Getting started help",
            "File format support",
            "Requirements generation",
            "Interview optimization",
            "Data analysis guidance"
          ]
        };
      case 'construct':
        return {
          title: "Define Output Structure",
          description: "I'll help you create the perfect schema for your user stories",
          icon: FileText,
          color: "blue",
          suggestions: [
            "What fields should I include for user stories?",
            "How do I create a good pattern template?",
            "What are the best practices for output schemas?",
            "Can you suggest a template for my industry?"
          ],
          capabilities: [
            "Schema design recommendations",
            "Pattern template examples",
            "Field validation guidance",
            "Industry-specific templates"
          ]
        };
      case 'upload':
        return {
          title: "Upload Interview Transcripts",
          description: "I'll guide you through the file upload process",
          icon: Upload,
          color: "green",
          suggestions: [
            "What file formats are supported?",
            "How do I prepare my transcripts?",
            "What's the maximum file size?",
            "How many files can I upload?"
          ],
          capabilities: [
            "File format guidance",
            "Upload best practices",
            "Transcript preparation tips",
            "Batch processing advice"
          ]
        };
      case 'process':
        return {
          title: "AI Processing & Extraction",
          description: "I'll explain how our AI processes your transcripts",
          icon: Play,
          color: "purple",
          suggestions: [
            "How does the AI extraction work?",
            "What happens during processing?",
            "How long does it take?",
            "Can I monitor the progress?"
          ],
          capabilities: [
            "AI process explanation",
            "Processing time estimates",
            "Progress monitoring tips",
            "Quality assurance guidance"
          ]
        };
      case 'download':
        return {
          title: "Download Results",
          description: "I'll help you get your structured user stories",
          icon: Download,
          color: "orange",
          suggestions: [
            "How do I download my results?",
            "What formats are available?",
            "Can I export to other tools?",
            "How do I share with my team?"
          ],
          capabilities: [
            "Download instructions",
            "Export format options",
            "Sharing and collaboration",
            "Data integration tips"
          ]
        };
      case 'requirements_construct':
        return {
          title: "Define Requirements Structure",
          description: "I'll help you design the perfect requirements schema",
          icon: Settings,
          color: "indigo",
          suggestions: [
            "How do I map user stories to requirements?",
            "What fields should requirements have?",
            "How do I prioritize requirements?",
            "Can you suggest a requirements template?"
          ],
          capabilities: [
            "Requirements mapping guidance",
            "Schema design help",
            "Priority framework suggestions",
            "Template recommendations"
          ]
        };
      case 'requirements':
        return {
          title: "Requirements Generation",
          description: "I'll guide you through converting stories to requirements",
          icon: Target,
          color: "red",
          suggestions: [
            "How does the AI convert stories to requirements?",
            "Can I edit the generated requirements?",
            "How do I validate requirements?",
            "What's the best way to review requirements?"
          ],
          capabilities: [
            "Conversion process explanation",
            "Editing and validation tips",
            "Review workflow guidance",
            "Quality assurance help"
          ]
        };
      default:
        return {
          title: "AI Assistant",
          description: "I'm here to help you through the entire process",
          icon: MessageCircle,
          color: "gray",
          suggestions: [
            "How does this tool work?",
            "What are the best practices?",
            "Can you explain the workflow?",
            "How do I get started?"
          ],
          capabilities: [
            "Process guidance",
            "Best practices",
            "Workflow explanation",
            "Getting started help"
          ]
        };
    }
  };

  const context = getStepContext();
  const IconComponent = context.icon;

  const { toast } = useToast();

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setIsTyping(true);

    // Add user message to chat history
    const newUserMessage = { type: 'user' as const, message: userMessage, timestamp: new Date() };
    setChatHistory(prev => [...prev, newUserMessage]);

    try {
      console.log('Sending message to backend:', userMessage);
      
      // Create chat context
      const chatContext = {
        currentStep,
        construct,
        userStories,
        requirements: [],
        transcripts: [],
        chatHistory
      };

      console.log('Chat context:', chatContext);

      // Call backend API instead of frontend Gemini
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          context: chatContext
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Backend response:', data);
      
      if (data.error) {
        // Handle backend error, use fallback
        const fallbackResponse = getFallbackResponse(userMessage);
        const assistantMessage = { type: 'assistant' as const, message: fallbackResponse, timestamp: new Date() };
        setChatHistory(prev => [...prev, assistantMessage]);
        
        toast({
          title: "Using Fallback Response",
          description: "Backend AI service unavailable, using built-in help system.",
          variant: "default",
        });
      } else {
        // Add successful response to chat history
        const assistantMessage = { type: 'assistant' as const, message: data.response, timestamp: new Date() };
        setChatHistory(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error calling backend:', error);
      
      // Use fallback response as last resort
      const fallbackResponse = getFallbackResponse(userMessage);
      const assistantMessage = { type: 'assistant' as const, message: fallbackResponse, timestamp: new Date() };
      setChatHistory(prev => [...prev, assistantMessage]);
      
      toast({
        title: "Using Fallback Response",
        description: "Using built-in help system due to backend connection issues.",
        variant: "default",
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  // Fallback response system for when Gemini API is not available
  const getFallbackResponse = (question: string): string => {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('how does') || lowerQuestion.includes('how do')) {
      if (lowerQuestion.includes('work') || lowerQuestion.includes('process')) {
        return "The Interview ETL process works in 5 main steps: 1) Define your output structure, 2) Upload interview transcripts, 3) AI processes and extracts insights, 4) Edit and refine user stories, 5) Convert to requirements. Each step builds on the previous one to create a comprehensive requirements document.";
      }
      if (lowerQuestion.includes('get started')) {
        return "To get started, click the 'Get Started' button on the home page. This will take you to step 1 where you'll define your output structure. You'll specify what fields you want in your user stories (like stakeholder info, priority, etc.).";
      }
      if (lowerQuestion.includes('upload') || lowerQuestion.includes('file')) {
        return "You can upload interview transcripts in multiple formats: TXT, DOCX, PDF, Markdown, or even ZIP files containing multiple documents. The system will process all files and extract insights using AI.";
      }
    }

    if (lowerQuestion.includes('ai') || lowerQuestion.includes('gemini') || lowerQuestion.includes('extraction')) {
      if (lowerQuestion.includes('how long') || lowerQuestion.includes('time')) {
        return "AI processing typically takes 2-5 minutes depending on the number and size of your transcripts. The system uses Gemini AI with advanced vectorization to understand context and extract meaningful insights.";
      }
      if (lowerQuestion.includes('accuracy') || lowerQuestion.includes('quality')) {
        return "The AI extraction provides high accuracy through context-aware processing. It analyzes relationships across all interviews and uses your defined schema to ensure consistent output. You can always edit the results before finalizing.";
      }
    }

    if (lowerQuestion.includes('vector') || lowerQuestion.includes('context')) {
      return "Vectorization creates mathematical representations of your interview content, allowing the AI to understand relationships between different parts of your transcripts. This means it can cross-reference information across multiple interviews and stakeholders to provide comprehensive insights.";
    }

    if (lowerQuestion.includes('requirement') || lowerQuestion.includes('convert')) {
      return "Requirements are generated by analyzing your user stories and mapping them to detailed technical specifications. The system maintains traceability between user stories and requirements, ensuring nothing is lost in translation.";
    }

    return "I'm here to help you with the Interview ETL process! I can explain how the system works, provide best practices, help with specific steps, and answer questions about AI processing, vectorization, and requirements generation. What would you like to know more about?";
  };

  return (
    <>
      {/* Inline Assistant Panel */}
      <Card className="w-full border-0 shadow-lg bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-full bg-${context.color}-100 flex items-center justify-center`}>
                <IconComponent className={`w-6 h-6 text-${context.color}-600`} />
              </div>
              <div>
                <CardTitle className="text-xl">{context.title}</CardTitle>
                <p className="text-sm text-gray-600">{getStepSpecificGuidance(currentStep)}</p>
                {chatHistory.length > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    💬 Chat history preserved across steps
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="h-8 w-8 p-0"
            >
              {isOpen ? <X className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>

        {/* Expandable Content */}
        {isOpen && (
          <CardContent className="pt-0 space-y-4">
            {/* API Key Configuration */}
            {/* Removed API key input section */}

            {/* How I Help Section */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-2 mb-3">
                <Lightbulb className="w-4 h-4 text-yellow-600" />
                <h3 className="font-semibold text-sm">How I Help</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {context.capabilities.map((capability, index) => (
                  <div key={index} className="flex items-center space-x-2 text-xs">
                    <Zap className="w-3 h-3 text-blue-500" />
                    <span>{capability}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggested Questions */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-2 mb-3">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-sm">Suggested Questions</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {context.suggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left h-auto py-2 px-3 text-xs"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <BookOpen className="w-3 h-3 mr-2 text-gray-500" />
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>

            {/* Current Context Info */}
            {construct && (
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <h3 className="font-semibold text-sm">Current Context</h3>
                </div>
                <div className="text-xs space-y-1">
                  <div><strong>Construct:</strong> {construct.name}</div>
                  <div><strong>Fields:</strong> {construct.output_schema?.length || 0} output columns</div>
                  <div><strong>Pattern:</strong> {construct.pattern?.substring(0, 50)}...</div>
                </div>
              </div>
            )}

            {/* Chat History */}
            {chatHistory.length > 0 && (
              <div className="bg-white rounded-lg p-4 border border-gray-200 max-h-64 overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Chat History</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearChatHistory}
                    className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                  >
                    Clear Chat
                  </Button>
                </div>
                <div className="space-y-3">
                  {chatHistory.map((chat, index) => (
                    <div key={index} className={`flex ${chat.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                        chat.type === 'user' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {chat.message}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Input */}
            <div className="space-y-3">
              <div className="flex space-x-2">
                <Input
                  placeholder={
                    currentStep === 'home' 
                      ? "Ask me about the app experience, process, vectorized data, or anything else..."
                      : "Ask me anything about this step, the app experience, or your vectorized data..."
                  }
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  className="flex-1"
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  size="sm"
                >
                  {isTyping ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {isTyping && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <span>Gemini is thinking...</span>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </>
  );
}
