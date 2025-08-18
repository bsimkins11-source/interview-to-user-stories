"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, X, HelpCircle, Lightbulb, BookOpen, Zap, Target, FileText, Upload, Play, Download, Settings } from 'lucide-react';

interface GeminiAssistantProps {
  currentStep: string;
  construct?: any;
  userStories?: any[];
}

export function GeminiAssistant({ currentStep, construct, userStories }: GeminiAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const getStepContext = () => {
    switch (currentStep) {
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

  const handleSend = async () => {
    if (!input.trim()) return;

    setIsTyping(true);
    // Simulate AI response for now
    setTimeout(() => {
      setIsTyping(false);
      setInput('');
    }, 2000);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className={`
            w-16 h-16 rounded-full shadow-lg transform transition-all duration-200 hover:scale-110
            bg-gradient-to-r from-${context.color}-600 to-${context.color}-700 
            hover:from-${context.color}-700 hover:to-${context.color}-800
          `}
        >
          <IconComponent className="w-8 h-8" />
        </Button>
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">AI</span>
        </div>
      </div>

      {/* Assistant Panel */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-end p-4">
          <Card className="w-full max-w-md h-[600px] flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full bg-${context.color}-100 flex items-center justify-center`}>
                    <IconComponent className={`w-5 h-5 text-${context.color}-600`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{context.title}</CardTitle>
                    <p className="text-sm text-gray-600">{context.description}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col space-y-4">
              {/* How I Help Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-yellow-600" />
                  <h3 className="font-semibold text-sm">How I Help</h3>
                </div>
                <div className="space-y-2">
                  {context.capabilities.map((capability, index) => (
                    <div key={index} className="flex items-center space-x-2 text-xs">
                      <Zap className="w-3 h-3 text-blue-500" />
                      <span>{capability}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggested Questions */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <HelpCircle className="w-4 h-4 text-blue-600" />
                  <h3 className="font-semibold text-sm">Suggested Questions</h3>
                </div>
                <div className="space-y-2">
                  {context.suggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-left h-auto py-2 px-3"
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
                <div className="bg-blue-50 rounded-lg p-3">
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

              {/* Chat Input */}
              <div className="mt-auto space-y-3">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Ask me anything about this step..."
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
                      <Send className="w-4 h-4" />
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
          </Card>
        </div>
      )}
    </>
  );
}
