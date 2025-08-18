"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Sparkles, Lightbulb, BookOpen, Target, Zap } from 'lucide-react';

interface GeminiAssistantProps {
  currentStep: string;
  construct: any;
  userStories: any[];
}

export function GeminiAssistant({ currentStep, construct, userStories }: GeminiAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getStepContext = () => {
    switch (currentStep) {
      case 'construct':
        return {
          title: 'Define Your Output Structure',
          description: 'I can help you design optimal schemas for user stories and requirements',
          suggestions: [
            'What fields should I include for user stories?',
            'How do I structure requirements fields?',
            'What are best practices for output schemas?'
          ],
          capabilities: [
            'Schema Design Guidance',
            'Field Optimization',
            'Best Practices'
          ]
        };
      case 'upload':
        return {
          title: 'Upload Interview Transcripts',
          description: 'I can help you prepare and organize your interview data',
          suggestions: [
            'What file formats work best?',
            'How should I organize multiple interviews?',
            'What makes for good interview data?'
          ],
          capabilities: [
            'File Format Support',
            'Data Organization',
            'Quality Assessment'
          ]
        };
      case 'process':
        return {
          title: 'AI Processing & Analysis',
          description: 'I can explain how the AI processes your transcripts and extracts insights',
          suggestions: [
            'How does the AI analyze my transcripts?',
            'What context does it use for extraction?',
            'How accurate are the results?'
          ],
          capabilities: [
            'Process Explanation',
            'Context Understanding',
            'Accuracy Insights'
          ]
        };
      case 'download':
        return {
          title: 'Review & Download Results',
          description: 'I can help you understand and validate the generated user stories',
          suggestions: [
            'How do I validate the extracted stories?',
            'What if some stories seem incorrect?',
            'How can I improve the results?'
          ],
          capabilities: [
            'Result Validation',
            'Quality Improvement',
            'Troubleshooting'
          ]
        };
      case 'requirements_construct':
        return {
          title: 'Define Requirements Structure',
          description: 'I can help you design the perfect requirements schema',
          suggestions: [
            'What fields are essential for requirements?',
            'How do I map user stories to requirements?',
            'What priority systems work best?'
          ],
          capabilities: [
            'Requirements Design',
            'Mapping Strategies',
            'Priority Systems'
          ]
        };
      case 'requirements':
        return {
          title: 'Requirements Generation',
          description: 'I can help you understand and refine the generated requirements',
          suggestions: [
            'How are requirements generated from stories?',
            'How do I validate requirement quality?',
            'Can I customize the conversion process?'
          ],
          capabilities: [
            'Generation Process',
            'Quality Validation',
            'Customization'
          ]
        };
      default:
        return {
          title: 'AI Assistant',
          description: 'I can help you with any aspect of the interview-to-requirements process',
          suggestions: [
            'How does this app work?',
            'What are the best practices?',
            'How can I get better results?'
          ],
          capabilities: [
            'Process Guidance',
            'Best Practices',
            'Troubleshooting'
          ]
        };
    }
  };

  const context = getStepContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsLoading(true);
    // Simulate AI response
    setTimeout(() => {
      setIsLoading(false);
      setMessage('');
    }, 2000);
  };

  return (
    <div className="relative">
      {/* Floating Action Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 z-50"
      >
        <MessageCircle className="w-8 h-8" />
      </Button>

      {/* Assistant Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 z-50">
          <Card className="h-full">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <CardTitle className="text-lg">Gemini AI Assistant</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Your AI companion for the interview-to-requirements journey
              </p>
            </CardHeader>

            <CardContent className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
              {/* Current Step Context */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center mb-2">
                  <Target className="w-4 h-4 text-blue-600 mr-2" />
                  <h3 className="font-semibold text-blue-900">{context.title}</h3>
                </div>
                <p className="text-sm text-blue-700 mb-3">{context.description}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center text-xs text-blue-600">
                    <Zap className="w-3 h-3 mr-1" />
                    <span className="font-medium">Capabilities:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {context.capabilities.map((capability, index) => (
                      <Badge key={index} variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-300">
                        {capability}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Suggested Questions */}
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center mb-2">
                  <Lightbulb className="w-4 h-4 text-purple-600 mr-2" />
                  <h3 className="font-semibold text-purple-900">Suggested Questions</h3>
                </div>
                <div className="space-y-2">
                  {context.suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => setMessage(suggestion)}
                      className="block w-full text-left text-sm text-purple-700 hover:text-purple-900 hover:bg-purple-100 rounded px-2 py-1 transition-colors"
                    >
                      "{suggestion}"
                    </button>
                  ))}
                </div>
              </div>

              {/* How I Help */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center mb-2">
                  <BookOpen className="w-4 h-4 text-green-600 mr-2" />
                  <h3 className="font-semibold text-green-900">How I Help You</h3>
                </div>
                <div className="space-y-2 text-sm text-green-700">
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                    <span>Provide step-by-step guidance for each phase</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                    <span>Explain AI processing and vectorization techniques</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                    <span>Suggest optimizations for better results</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                    <span>Help troubleshoot any issues you encounter</span>
                  </div>
                </div>
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="flex space-x-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ask me anything about the process..."
                    className="flex-1"
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!message.trim() || isLoading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 text-center">
                  I'm here to help you succeed with every step of your interview analysis!
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
