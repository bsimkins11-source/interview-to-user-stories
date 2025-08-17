'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useToast } from '../components/ui/use-toast';
import { ChevronRight, ChevronLeft, CheckCircle, Circle, Play, Download, FileText, Users, Settings, Brain } from 'lucide-react';

import ConstructEditor from '../components/ConstructEditor';
import InterviewTranscriptInput from '../components/InterviewTranscriptInput';
import ExternalStoryImporter from '../components/ExternalStoryImporter';
import JobStatus from '../components/JobStatus';
import ResultsDownload from '../components/ResultsDownload';
import GeminiAssistant from '../components/GeminiAssistant';

interface TranscriptInput {
  id: string;
  type: 'file' | 'folder' | 'document';
  name: string;
  source: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  size?: number;
  file_count?: number;
}

interface ExternalStory {
  id: string;
  title: string;
  description: string;
  source: string;
  url?: string;
  type: 'folder' | 'document' | 'link';
  status: 'pending' | 'importing' | 'completed' | 'error';
  stories_count?: number;
  last_updated?: string;
}

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [construct, setConstruct] = useState<any>(null);
  const [transcripts, setTranscripts] = useState<TranscriptInput[]>([]);
  const [externalStories, setExternalStories] = useState<ExternalStory[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [isAssistantMinimized, setIsAssistantMinimized] = useState(false);
  const { toast } = useToast();

  const steps = [
    { id: 1, title: 'Define Structure', description: 'Create your output schema', icon: Settings },
    { id: 2, title: 'Add Transcripts', description: 'Upload interview files', icon: FileText },
    { id: 3, title: 'Process & Extract', description: 'AI-powered extraction', icon: Brain },
    { id: 4, title: 'Download Results', description: 'Get your CSV file', icon: Download }
  ];

  const handleConstructSave = (savedConstruct: any) => {
    setConstruct(savedConstruct);
    toast({
      title: "Construct Saved",
      description: "Your output structure has been saved successfully.",
    });
  };

  const handleTranscriptsAdded = (newTranscripts: TranscriptInput[]) => {
    setTranscripts(prev => [...prev, ...newTranscripts]);
  };

  const handleTranscriptsRemoved = (transcriptIds: string[]) => {
    setTranscripts(prev => prev.filter(t => !transcriptIds.includes(t.id)));
  };

  const handleExternalStoriesImported = (stories: any[]) => {
    // This would integrate with the external stories state
    toast({
      title: "External Stories Imported",
      description: `${stories.length} stories have been imported successfully.`,
    });
  };

  const handleStartProcessing = async () => {
    if (!construct || transcripts.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please ensure you have both a construct and transcripts before starting.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Simulate job creation
      const newJobId = `job_${Date.now()}`;
      setJobId(newJobId);
      setJobStatus('CREATED');
      
      toast({
        title: "Processing Started",
        description: "Your interview transcripts are being processed into user stories.",
      });

      // Simulate processing
      setTimeout(() => {
        setJobStatus('PROCESSING');
      }, 1000);

      setTimeout(() => {
        setJobStatus('COMPLETED');
      }, 5000);

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start processing. Please try again.",
        variant: "destructive"
      });
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return construct !== null;
      case 2:
        return transcripts.length > 0;
      case 3:
        return jobStatus === 'COMPLETED';
      default:
        return true;
    }
  };

  const canGoBack = () => {
    return currentStep > 1;
  };

  const nextStep = () => {
    if (canProceedToNext()) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    if (canGoBack()) {
      setCurrentStep(prev => Math.max(prev - 1, 1));
    }
  };

  const getStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Define Your Output Structure
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Create a template that defines how your interview transcripts will be transformed into structured user stories. 
                This ensures consistent output format and makes it easy to import into your workflow management system.
              </p>
            </div>
            
            <ConstructEditor onSave={handleConstructSave} />
            
            {construct && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div>
                      <h3 className="font-semibold text-green-800">Structure Defined!</h3>
                      <p className="text-green-700">
                        Your output schema "{construct.name}" is ready. You can now proceed to add interview transcripts.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Add Interview Transcripts
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Upload your interview files, import from cloud storage, or provide document links. 
                The system supports multiple formats and will extract user stories from the content.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <InterviewTranscriptInput
                  onTranscriptsAdded={handleTranscriptsAdded}
                  onTranscriptsRemoved={handleTranscriptsRemoved}
                />
              </div>
              
              <div>
                <ExternalStoryImporter
                  onStoriesImported={handleExternalStoriesImported}
                  existingStories={externalStories}
                />
              </div>
            </div>

            {transcripts.length > 0 && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-blue-800">Transcripts Ready!</h3>
                      <p className="text-blue-700">
                        {transcripts.length} transcript(s) added. You can now start processing them into user stories.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Process & Extract User Stories
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                The AI engine will analyze your interview transcripts and extract structured user stories 
                according to your defined schema. This process includes deduplication and quality scoring.
              </p>
            </div>

            {!jobId ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <Play className="h-8 w-8 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Ready to Process</h3>
                      <p className="text-gray-600">
                        You have {transcripts.length} transcript(s) and a defined structure. 
                        Click the button below to start the AI-powered extraction process.
                      </p>
                    </div>
                    <Button 
                      onClick={handleStartProcessing}
                      size="lg"
                      className="px-8"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Processing
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <JobStatus jobId={jobId} />
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Download Your Results
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Your user stories have been extracted and processed. Download the CSV file 
                and import it into your workflow management system.
              </p>
            </div>

            <ResultsDownload jobId={jobId || ''} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Interview ETL</h1>
              <Badge variant="secondary">Beta</Badge>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Help
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors
                      ${isCompleted 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : isActive 
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'bg-gray-100 border-gray-300 text-gray-500'
                      }
                    `}>
                      {isCompleted ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : (
                        <Icon className="h-6 w-6" />
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <div className={`text-sm font-medium ${
                        isActive ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </div>
                      <div className="text-xs text-gray-400">
                        {step.description}
                      </div>
                    </div>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {getStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={!canGoBack()}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="text-sm text-gray-500">
            Step {currentStep} of {steps.length}
          </div>

          <Button
            onClick={nextStep}
            disabled={!canProceedToNext()}
            className="flex items-center gap-2"
          >
            {currentStep === 4 ? 'Finish' : 'Next'}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </main>

      {/* AI Assistant */}
      <GeminiAssistant
        currentStep={currentStep}
        construct={construct}
        jobStatus={jobStatus}
        userStories={[]}
        isMinimized={isAssistantMinimized}
        onToggleMinimize={() => setIsAssistantMinimized(!isAssistantMinimized)}
      />
    </div>
  );
}
