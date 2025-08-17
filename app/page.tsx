'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Upload, FileText, Download, Play, ArrowRight, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { ConstructEditor } from '@/components/ConstructEditor';
import InterviewTranscriptInput from '@/components/InterviewTranscriptInput';
import ExternalStoryImporter from '@/components/ExternalStoryImporter';
import { JobStatus } from '@/components/JobStatus';
import { ResultsDownload } from '@/components/ResultsDownload';
import { GeminiAssistant } from '@/components/GeminiAssistant';

type Step = 'construct' | 'upload' | 'process' | 'download';

interface Construct {
  name: string;
  description: string;
  fields: Array<{
    name: string;
    type: string;
    description: string;
    required: boolean;
  }>;
}

interface Transcript {
  id: string;
  name: string;
  type: 'file' | 'folder' | 'document';
  status: 'pending' | 'importing' | 'completed' | 'failed';
  url?: string;
}

interface ExternalStory {
  id: string;
  name: string;
  type: 'folder' | 'document' | 'link';
  status: 'pending' | 'importing' | 'completed' | 'failed';
  url?: string;
  storyCount?: number;
}

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState<Step>('construct');
  const [construct, setConstruct] = useState<Construct | null>(null);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [externalStories, setExternalStories] = useState<ExternalStory[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string>('idle');
  const { toast } = useToast();

  const steps = [
    { id: 'construct', title: 'Define Output Structure', icon: FileText, description: 'Define the structure for your user stories' },
    { id: 'upload', title: 'Upload Interview Transcripts', icon: Upload, description: 'Upload or link to interview transcripts' },
    { id: 'process', title: 'Process & Extract', icon: Play, description: 'AI-powered extraction and processing' },
    { id: 'download', title: 'Download Results', icon: Download, description: 'Get your structured user stories' }
  ];

  const canProceedToNext = () => {
    switch (currentStep) {
      case 'construct':
        return construct !== null;
      case 'upload':
        return transcripts.length > 0;
      case 'process':
        return true;
      case 'download':
        return false;
      default:
        return false;
    }
  };

  const canGoBack = () => {
    return currentStep !== 'construct';
  };

  const handleNext = () => {
    if (canProceedToNext()) {
      const currentIndex = steps.findIndex(step => step.id === currentStep);
      if (currentIndex < steps.length - 1) {
        setCurrentStep(steps[currentIndex + 1].id as Step);
      }
    }
  };

  const handleBack = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id as Step);
    }
  };

  const handleConstructSave = (newConstruct: Construct) => {
    setConstruct(newConstruct);
    toast({
      title: "Construct saved!",
      description: "Your output structure has been defined.",
    });
  };

  const handleTranscriptsAdded = (newTranscripts: Transcript[]) => {
    setTranscripts(prev => [...prev, ...newTranscripts]);
    toast({
      title: "Transcripts added!",
      description: `${newTranscripts.length} transcript(s) added successfully.`,
    });
  };

  const handleTranscriptsRemoved = (transcriptId: string) => {
    setTranscripts(prev => prev.filter(t => t.id !== transcriptId));
  };

  const handleExternalStoriesImported = (newStories: ExternalStory[]) => {
    setExternalStories(prev => [...prev, ...newStories]);
    toast({
      title: "External stories imported!",
      description: `${newStories.length} story source(s) imported successfully.`,
    });
  };

  const handleStartProcessing = async () => {
    if (!construct || transcripts.length === 0) {
      toast({
        title: "Missing information",
        description: "Please ensure you have a construct and transcripts before processing.",
        variant: "destructive",
      });
      return;
    }

    setJobStatus('processing');
    setJobId('demo-job-123'); // Demo job ID for now
    
    // Simulate processing
    setTimeout(() => {
      setJobStatus('completed');
      setCurrentStep('download');
    }, 3000);

    toast({
      title: "Processing started!",
      description: "Your interview transcripts are being processed by AI.",
    });
  };

  const getStepContent = () => {
    switch (currentStep) {
      case 'construct':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Define Your Output Structure</h2>
              <p className="text-muted-foreground">
                Define the structure for your user stories. This will guide the AI extraction process.
              </p>
            </div>
            <ConstructEditor onSave={handleConstructSave} />
          </div>
        );

      case 'upload':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Upload Interview Transcripts</h2>
              <p className="text-muted-foreground">
                Upload files, link to folders, or provide document URLs for your interview transcripts.
              </p>
            </div>
            <InterviewTranscriptInput 
              onTranscriptsAdded={handleTranscriptsAdded}
              onTranscriptsRemoved={handleTranscriptsRemoved}
            />
            <div className="text-center space-y-4">
              <h3 className="text-xl font-semibold">Import Existing User Stories (Optional)</h3>
              <p className="text-muted-foreground">
                Import existing user stories to compare with your generated results.
              </p>
            </div>
            <ExternalStoryImporter onStoriesImported={handleExternalStoriesImported} />
          </div>
        );

      case 'process':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Process & Extract</h2>
              <p className="text-muted-foreground">
                AI-powered extraction using your defined structure and interview transcripts.
              </p>
            </div>
            <JobStatus jobId={jobId} status={jobStatus} />
            {jobStatus === 'idle' && (
              <div className="text-center">
                <Button onClick={handleStartProcessing} size="lg">
                  <Play className="mr-2 h-4 w-4" />
                  Start Processing
                </Button>
              </div>
            )}
          </div>
        );

      case 'download':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Download Results</h2>
              <p className="text-muted-foreground">
                Your structured user stories are ready for download.
              </p>
            </div>
            <ResultsDownload jobId={jobId} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Interview ETL - User Stories Generator
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transform interview transcripts into structured user stories using AI-powered extraction
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-center">
            <div className="flex space-x-4">
              {steps.map((step, index) => {
                const isActive = step.id === currentStep;
                const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
                const Icon = step.icon;
                
                return (
                  <div key={step.id} className="flex items-center">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                      isCompleted 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : isActive 
                          ? 'bg-blue-500 border-blue-500 text-white' 
                          : 'bg-white border-gray-300 text-gray-500'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-16 h-0.5 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Step Labels */}
          <div className="flex justify-center mt-4">
            <div className="flex space-x-16">
              {steps.map((step) => {
                const isActive = step.id === currentStep;
                return (
                  <div key={step.id} className="text-center">
                    <div className={`font-medium ${
                      isActive ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      {step.description}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8">
              {getStepContent()}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={!canGoBack()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={!canProceedToNext()}
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* AI Assistant */}
        <div className="mt-12 max-w-4xl mx-auto">
          <GeminiAssistant 
            currentStep={currentStep}
            construct={construct}
            userStories={[]}
          />
        </div>
      </div>
    </div>
  );
}
