'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, Sparkles, MessageSquare } from 'lucide-react';

interface Message {
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface GeminiAssistantProps {
  currentStep: string;
  construct?: any;
  userStories: any[];
}

export function GeminiAssistant({ currentStep, construct, userStories }: GeminiAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'assistant',
      content: "Hello! I'm your AI assistant for the Interview ETL process. I can help you with:\n\n• Understanding user story formats\n• Explaining the ETL process\n• Troubleshooting issues\n• Best practices for interview analysis\n\nWhat would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getContextualSuggestions = () => {
    switch (currentStep) {
      case 'construct':
        return [
          "How do I create a good user story template?",
          "What fields should I include in my construct?",
          "Can you show me an example user story structure?"
        ];
      case 'upload':
        return [
          "What file formats do you support?",
          "How do I prepare my interview transcripts?",
          "Can I import from Google Drive or SharePoint?"
        ];
      case 'process':
        return [
          "How does the AI extraction work?",
          "What affects the confidence scores?",
          "How long does processing take?"
        ];
      case 'download':
        return [
          "What's in the CSV output?",
          "How do I use the results?",
          "Can I export to other formats?"
        ];
      default:
        return [
          "Tell me about user stories",
          "How does the ETL process work?",
          "What are best practices?"
        ];
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
      return `Here are the best practices for successful interview-to-user-story conversion:

📋 **Before Upload:**
• Clean up transcripts (remove filler words, timestamps)
• Ensure clear speaker identification
• Remove sensitive or confidential information
• Organize by topic or session

📝 **During Processing:**
• Use clear, specific construct templates
• Review confidence scores before accepting
• Validate extracted stories against original context
• Keep original transcripts for reference

📊 **After Extraction:**
• Review low-confidence stories manually
• Validate with stakeholders if needed
• Organize stories by priority or category
• Document any assumptions made

**Pro Tip**: Start with a small batch to test your construct template before processing large volumes!`;
    }

    // Default response for general questions
    return `I'm here to help with your Interview ETL process! 

I can assist with:
• **User Story Creation**: Help you define effective templates
• **File Preparation**: Guide you on transcript formatting
• **Process Understanding**: Explain how AI extraction works
• **Best Practices**: Share tips for better results
• **Troubleshooting**: Help resolve any issues

What specific aspect would you like to learn more about?`;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const stepNumber = currentStep === 'construct' ? 1 : 
                        currentStep === 'upload' ? 2 : 
                        currentStep === 'process' ? 3 : 
                        currentStep === 'download' ? 4 : 1;

      const response = await generateAIResponse(
        inputValue,
        stepNumber,
        construct,
        'active',
        userStories
      );

      const assistantMessage: Message = {
        type: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        type: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again or rephrase your question.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-600" />
          AI Assistant
          <Badge variant="secondary" className="ml-2">
            <Sparkles className="h-3 w-3 mr-1" />
            Powered by Gemini
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chat Messages */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div className={`text-xs mt-2 ${
                  message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 rounded-lg px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  Thinking...
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Suggestions */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Quick Questions:</Label>
          <div className="flex flex-wrap gap-2">
            {getContextualSuggestions().map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-xs"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me anything about the ETL process..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
