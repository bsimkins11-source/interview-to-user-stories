'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, X, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from './ui/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'construct_help' | 'data_analysis' | 'general' | 'error';
}

interface GeminiAssistantProps {
  currentStep: number;
  construct?: any;
  jobStatus?: any;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

const constructSuggestions = [
  "Help me create a user story template",
  "What columns should I include for feature requests?",
  "How do I set up priority classification?",
  "Show me a process improvement template"
];

const dataAnalysisSuggestions = [
  "Analyze my user stories for common themes",
  "What are the top priorities in my data?",
  "Help me categorize these stories",
  "Find duplicate or similar stories"
];

const generalSuggestions = [
  "How does the ETL process work?",
  "What file formats are supported?",
  "How accurate is the AI extraction?",
  "Best practices for interview transcripts"
];

export function GeminiAssistant({ 
  currentStep, 
  construct, 
  jobStatus, 
  isMinimized = false,
  onToggleMinimize 
}: GeminiAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `👋 Hi! I'm your AI assistant for the Interview ETL process. I can help you with:

🎯 **Construct Design**: Create templates, suggest columns, optimize patterns
📊 **Data Analysis**: Analyze results, find insights, identify trends  
📝 **Process Guidance**: Best practices, file preparation, troubleshooting

What would you like help with today?`,
      timestamp: new Date(),
      type: 'general'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update assistant context based on current step
  useEffect(() => {
    if (currentStep === 1 && construct) {
      addAssistantMessage(
        `I see you're working on the "${construct.name}" construct. I can help you optimize the schema, suggest patterns, or add default values. What would you like to improve?`,
        'construct_help'
      );
    } else if (currentStep === 3 && jobStatus) {
      addAssistantMessage(
        `Your job "${jobStatus.name}" is currently processing. I can help you understand what's happening and prepare for analyzing the results.`,
        'data_analysis'
      );
    } else if (currentStep === 4 && jobStatus?.metrics) {
      addAssistantMessage(
        `Great! Your processing is complete. I can help you analyze the ${jobStatus.metrics.total_stories} user stories extracted from ${jobStatus.metrics.total_files} files.`,
        'data_analysis'
      );
    }
  }, [currentStep, construct, jobStatus]);

  const addMessage = (role: 'user' | 'assistant', content: string, type?: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
      type: type as any
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addAssistantMessage = (content: string, type?: string) => {
    addMessage('assistant', content, type);
  };

  const getSuggestions = () => {
    if (currentStep === 1) return constructSuggestions;
    if (currentStep === 3 || currentStep === 4) return dataAnalysisSuggestions;
    return generalSuggestions;
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    handleSendMessage(suggestion);
  };

  const handleSendMessage = async (message?: string) => {
    const content = message || inputValue.trim();
    if (!content) return;

    // Add user message
    addMessage('user', content);
    setInputValue('');
    setIsLoading(true);

    try {
      // Simulate Gemini API call (replace with actual API integration)
      const response = await simulateGeminiResponse(content, currentStep, construct, jobStatus);
      
      // Simulate typing effect
      setIsTyping(true);
      setTimeout(() => {
        addAssistantMessage(response, determineMessageType(content));
        setIsTyping(false);
        setIsLoading(false);
      }, 1000 + Math.random() * 2000);

    } catch (error) {
      addAssistantMessage(
        "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
        'error'
      );
      setIsLoading(false);
    }
  };

  const simulateGeminiResponse = async (message: string, step: number, construct?: any, jobStatus?: any): Promise<string> {
    // This would be replaced with actual Gemini API calls
    const lowerMessage = message.toLowerCase();
    
    if (step === 1 && construct) {
      if (lowerMessage.includes('template') || lowerMessage.includes('create')) {
        return `I'll help you create a great template! Based on your current construct "${construct.name}", here are some suggestions:

**Schema Optimization:**
- Consider adding "Epic" or "Sprint" columns for agile teams
- Include "Acceptance Criteria" for clearer requirements
- Add "Dependencies" to track story relationships

**Pattern Enhancement:**
Your current pattern: "${construct.pattern}"
Try this enhanced version: "As a {{role}}, I need {{capability}} so that {{benefit}}. Acceptance criteria: {{criteria}}"

**Default Values:**
I notice you have ${Object.keys(construct.defaults || {}).length} defaults set. Consider adding:
- Priority: "Medium" (if not set)
- Status: "To Do"
- Story Points: "3"

Would you like me to help implement any of these improvements?`;
      }
    }

    if (step === 3 || step === 4) {
      if (lowerMessage.includes('analyze') || lowerMessage.includes('themes')) {
        return `I'd be happy to help analyze your user stories! Here's what I can do:

**Theme Analysis:**
- Identify common user roles and personas
- Find recurring capability patterns
- Analyze benefit categories and business value

**Priority Insights:**
- Distribution across priority levels
- High-impact vs. low-effort opportunities
- Risk assessment based on dependencies

**Quality Assessment:**
- Story completeness and clarity
- Pattern adherence and consistency
- Duplicate detection and consolidation

To get started, I can analyze your current data. What specific insights are you looking for?`;
      }
    }

    if (lowerMessage.includes('how') && lowerMessage.includes('work')) {
      return `Great question! Here's how the Interview ETL process works:

**1. Document Processing:**
- Upload ZIP files containing TXT, DOCX, MD, or PDF transcripts
- AI extracts and normalizes text while preserving speaker labels
- Documents are chunked into manageable paragraphs

**2. AI Extraction:**
- Gemini analyzes each text segment for user story patterns
- Applies your construct template to identify roles, capabilities, benefits
- Extracts relevant metadata and categorizes content

**3. Data Structuring:**
- Stories are formatted according to your output schema
- Default values are applied where specified
- Priority rules classify stories automatically

**4. Quality Assurance:**
- Duplicate detection using Jaccard similarity
- Confidence scoring for extraction accuracy
- CSV export with all structured data

The process typically takes 2-5 minutes depending on file size and complexity. Would you like me to explain any specific part in more detail?`;
    }

    return `I understand you're asking about "${message}". Let me help you with that!

Based on your current step (${step}) and context, I can provide specific guidance. Could you please rephrase your question or let me know what specific aspect you'd like help with?

I'm here to make your Interview ETL experience as smooth and effective as possible! 🚀`;
  };

  const determineMessageType = (message: string): string => {
    const lower = message.toLowerCase();
    if (lower.includes('construct') || lower.includes('template') || lower.includes('schema')) return 'construct_help';
    if (lower.includes('analyze') || lower.includes('data') || lower.includes('insights')) return 'data_analysis';
    return 'general';
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
          className="rounded-full w-12 h-12 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Bot className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-slate-200 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5" />
            <span className="font-semibold">AI Assistant</span>
            <Badge variant="secondary" className="text-xs bg-white/20">
              Gemini
            </Badge>
          </div>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleMinimize}
              className="text-white hover:bg-white/20 p-1"
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleMinimize}
              className="text-white hover:bg-white/20 p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-900'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.role === 'assistant' && (
                  <Bot className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                  <div className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-blue-100' : 'text-slate-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
                {message.role === 'user' && (
                  <User className="w-4 h-4 mt-0.5 text-blue-100 flex-shrink-0" />
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-blue-600" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div className="px-4 pb-2">
          <div className="text-xs text-slate-500 mb-2">💡 Try asking:</div>
          <div className="flex flex-wrap gap-2">
            {getSuggestions().slice(0, 3).map((suggestion, index) => (
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

      {/* Input */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about the ETL process..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isLoading}
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
