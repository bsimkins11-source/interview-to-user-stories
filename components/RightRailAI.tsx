"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Send, X, HelpCircle, Lightbulb, BookOpen, Zap, Target, FileText, Upload, Play, Download, Settings, Bot } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface RightRailAIProps {
  currentStep: string;
  construct?: any;
  userStories?: any[];
}

export function RightRailAI({ currentStep, construct, userStories }: RightRailAIProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Debug logging
  useEffect(() => {
    console.log('RightRailAI mounted with:', { currentStep, construct, userStories });
  }, [currentStep, construct, userStories]);
  
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

  // Clear chat history
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
          title: "AI Assistant - Output Structure",
          description: "I can help you define your output structure and understand best practices for creating effective schemas.",
          icon: Target,
          color: "blue",
          suggestions: [
            "What fields should I include in my schema?",
            "How do I structure stakeholder information?",
            "What makes a good user story format?",
            "How do I handle priority levels?",
            "What validation rules should I set?",
            "How do I organize my output structure?",
            "What are common schema patterns?",
            "How do I ensure consistency?",
            "What fields are required vs optional?",
            "How do I handle complex relationships?"
          ],
          capabilities: [
            "Schema design guidance",
            "Field optimization",
            "Validation rules",
            "Best practices",
            "Pattern examples",
            "Structure organization",
            "Consistency tips",
            "Field requirements",
            "Relationship handling",
            "Schema validation"
          ]
        };
      case 'upload':
        return {
          title: "AI Assistant - File Upload",
          description: "I can guide you through the file upload process and explain supported formats and size limits.",
          icon: Upload,
          color: "green",
          suggestions: [
            "What file formats are supported?",
            "How large can my files be?",
            "How do I prepare my transcripts?",
            "What's the best way to organize files?",
            "How do I handle multiple interviews?",
            "What if my files are in different formats?",
            "How do I ensure quality uploads?",
            "What happens during file processing?",
            "How do I track upload progress?",
            "What if upload fails?"
          ],
          capabilities: [
            "Format support",
            "Size limits",
            "File preparation",
            "Organization tips",
            "Batch processing",
            "Format conversion",
            "Quality assurance",
            "Processing guidance",
            "Progress tracking",
            "Error resolution"
          ]
        };
      case 'process':
        return {
          title: "AI Assistant - AI Processing",
          description: "I can explain the AI processing pipeline and help you understand what's happening during extraction.",
          icon: Zap,
          color: "yellow",
          suggestions: [
            "How does the AI extraction work?",
            "How long does processing take?",
            "What happens during vectorization?",
            "How accurate are the extractions?",
            "What if processing fails?",
            "How do I monitor progress?",
            "What affects processing speed?",
            "How do I optimize performance?",
            "What happens to my data?",
            "How secure is the processing?"
          ],
          capabilities: [
            "AI explanation",
            "Processing time",
            "Vectorization details",
            "Accuracy metrics",
            "Error handling",
            "Progress monitoring",
            "Performance optimization",
            "Data security",
            "Processing pipeline",
            "Quality assurance"
          ]
        };
      case 'download':
        return {
          title: "AI Assistant - Results",
          description: "I can help you understand the output formats and guide you through downloading your results.",
          icon: Download,
          color: "indigo",
          suggestions: [
            "What formats can I download?",
            "How do I export my data?",
            "What's included in the results?",
            "How do I validate the output?",
            "Can I customize the export?",
            "What if results are incomplete?",
            "How do I share results?",
            "What's the data structure?",
            "How do I backup my results?",
            "What's next after download?"
          ],
          capabilities: [
            "Export formats",
            "Download guidance",
            "Result validation",
            "Customization options",
            "Data structure",
            "Sharing methods",
            "Backup strategies",
            "Next steps",
            "Quality review",
            "Result analysis"
          ]
        };
      case 'userStories':
        return {
          title: "AI Assistant - User Stories",
          description: "I can help you edit and refine your user stories, and explain best practices for story writing.",
          icon: FileText,
          color: "pink",
          suggestions: [
            "How do I write good user stories?",
            "What makes a story actionable?",
            "How do I prioritize stories?",
            "How do I handle edge cases?",
            "What's the INVEST criteria?",
            "How do I estimate effort?",
            "How do I validate stories?",
            "How do I organize stories?",
            "What's the acceptance criteria?",
            "How do I handle dependencies?"
          ],
          capabilities: [
            "Story writing",
            "Actionability",
            "Prioritization",
            "Edge case handling",
            "INVEST criteria",
            "Effort estimation",
            "Story validation",
            "Organization",
            "Acceptance criteria",
            "Dependency management"
          ]
        };
      case 'requirements_construct':
        return {
          title: "AI Assistant - Requirements",
          description: "I can guide you through creating requirements and explain how they relate to user stories.",
          icon: BookOpen,
          color: "orange",
          suggestions: [
            "How do requirements relate to stories?",
            "What makes a good requirement?",
            "How do I structure requirements?",
            "How do I handle non-functional requirements?",
            "What's the difference between functional and non-functional?",
            "How do I validate requirements?",
            "How do I handle requirement changes?",
            "How do I prioritize requirements?",
            "What's the traceability matrix?",
            "How do I handle requirement conflicts?"
          ],
          capabilities: [
            "Requirement types",
            "Structure guidance",
            "Non-functional requirements",
            "Validation methods",
            "Change management",
            "Prioritization",
            "Traceability",
            "Conflict resolution",
            "Best practices",
            "Quality assurance"
          ]
        };
      case 'requirements':
        return {
          title: "AI Assistant - Requirements Review",
          description: "I can help you review and refine your requirements, ensuring they're clear and actionable.",
          icon: Settings,
          color: "red",
          suggestions: [
            "How do I review requirements?",
            "What makes requirements clear?",
            "How do I handle ambiguity?",
            "How do I validate completeness?",
            "What's the acceptance criteria?",
            "How do I handle conflicts?",
            "How do I ensure consistency?",
            "How do I handle changes?",
            "What's the review process?",
            "How do I sign off requirements?"
          ],
          capabilities: [
            "Requirement review",
            "Clarity assessment",
            "Ambiguity resolution",
            "Completeness validation",
            "Acceptance criteria",
            "Conflict resolution",
            "Consistency checking",
            "Change management",
            "Review process",
            "Sign-off procedures"
          ]
        };
      default:
        return {
          title: "AI Assistant",
          description: "I'm here to help you with the Interview ETL process",
          icon: MessageCircle,
          color: "gray",
          suggestions: [
            "How does the Interview ETL process work?",
            "What can I do with vectorized interview data?",
            "How do I get started with the app?"
          ],
          capabilities: [
            "Process guidance",
            "Getting started help",
            "Best practices"
          ]
        };
    }
  };

  // Fallback response system for when backend API is not available
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

  const context = getStepContext();
  const { toast } = useToast();

  return (
    <>
      {/* Floating AI Button - Always visible */}
      <div 
        className="fixed right-4 top-1/2 transform -translate-y-1/2 z-[9999]"
        onMouseEnter={() => {
          console.log('Mouse enter on AI button');
          setIsHovered(true);
        }}
        onMouseLeave={() => {
          console.log('Mouse leave on AI button');
          !isOpen && setIsHovered(false);
        }}
        style={{ 
          position: 'fixed',
          right: '16px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 9999
        }}
      >
        <Button
          onClick={() => {
            console.log('AI Button clicked, current state:', { isOpen, isHovered });
            setIsOpen(!isOpen);
          }}
          className={`
            w-16 h-16 rounded-full shadow-2xl transition-all duration-300 ease-in-out
            ${isOpen 
              ? 'bg-red-600 hover:bg-red-700 scale-110' 
              : isHovered 
                ? 'bg-green-500 hover:bg-green-600 scale-105' 
                : 'bg-blue-500 hover:bg-blue-600'
            }
          `}
          size="lg"
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '3px solid white'
          }}
        >
          <Bot className="w-6 h-6" />
        </Button>
        
        {/* Tooltip on hover */}
        {isHovered && !isOpen && (
          <div className="absolute right-16 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
            AI Assistant
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-gray-900 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
          </div>
        )}
      </div>

      {/* Slide-out AI Panel */}
      <div 
        className={`
          fixed right-0 top-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-[9998]
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        style={{ 
          position: 'fixed',
          right: 0,
          top: 0,
          height: '100%',
          width: '384px',
          backgroundColor: 'white',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 300ms ease-in-out',
          zIndex: 9998
        }}
      >
        <Card className="h-full border-0 shadow-none rounded-none">
          <CardHeader className="pb-3 border-b bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <context.icon className={`w-5 h-5 text-${context.color}-600`} />
                <CardTitle className="text-lg">{context.title}</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-600">{getStepSpecificGuidance(currentStep)}</p>
            {chatHistory.length > 0 && (
              <p className="text-xs text-green-600 mt-1">
                💬 Chat history preserved across visits
              </p>
            )}
          </CardHeader>

          <CardContent className="p-4 h-full flex flex-col">
            {/* Chat History - Reduced bottom margin */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-2">
              {chatHistory.length === 0 ? (
                <div className="text-center text-gray-500 py-6">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Start a conversation to get help with the Interview ETL process</p>
                </div>
              ) : (
                chatHistory.map((chat, index) => (
                  <div
                    key={index}
                    className={`flex ${chat.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg ${
                        chat.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm">{chat.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {chat.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 max-w-xs px-3 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Suggestions - Reduced margin */}
            {chatHistory.length === 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
                <div className="flex flex-wrap gap-2">
                  {context.suggestions.slice(0, 3).map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="text-xs h-7 px-2"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Input - Moved up with reduced margins */}
            <div className="flex space-x-2 mb-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything about the Interview ETL process..."
                className="flex-1"
                disabled={isTyping}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                size="sm"
                className="px-4"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {/* Clear Chat Button - Reduced margin */}
            {chatHistory.length > 0 && (
              <div className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearChatHistory}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear Chat History
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Backdrop when open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-20 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
