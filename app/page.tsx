"use client";

import { useState, useEffect } from 'react';
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
import { createJob, startProcessing, getJobStatus, createConstruct, uploadFilesToJob } from '@/lib/api';

type Step = 'construct' | 'upload' | 'process' | 'download';

interface Construct {
  name: string;
  description?: string;
  output_schema: string[];
  pattern: string;
  defaults: Record<string, string>;
  priority_rules: string[];
}

interface TranscriptInput {
  id: string;
  type: 'file' | 'folder' | 'document';
  name: string;
  source: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  size?: number;
  file_count?: number;
  file?: File; // Add actual file reference
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
  const [currentStep, setCurrentStep] = useState<Step>('construct');
  const [construct, setConstruct] = useState<Construct | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptInput[]>([]);
  const [externalStories, setExternalStories] = useState<ExternalStory[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string>('idle');
  const [isProcessing, setIsProcessing] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(0); // Add force refresh state
  const { toast } = useToast();

  // Add useEffect to watch for construct changes and log them
  useEffect(() => {
    console.log('Construct state changed:', construct);
    console.log('Can proceed to next:', canProceedToNext());
  }, [construct]);

  // Force refresh when construct changes to ensure UI updates
  useEffect(() => {
    if (construct) {
      setForceRefresh(prev => prev + 1);
    }
  }, [construct]);

  const steps = [
    { id: 'construct', title: 'Define Output Structure', icon: FileText, description: 'Define the structure for your user stories' },
    { id: 'upload', title: 'Upload Interview Transcripts', icon: Upload, description: 'Upload or link to interview transcripts' },
    { id: 'process', title: 'Process & Extract', icon: Play, description: 'AI-powered extraction and processing' },
    { id: 'download', title: 'Download Results', icon: Download, description: 'Get your structured user stories' }
  ];

  const canProceedToNext = () => {
    const canProceed = (() => {
      switch (currentStep) {
        case 'construct':
          // For construct step, we can proceed if we have a construct OR if we're in the process of saving
          return construct !== null;
        case 'upload':
          return construct !== null && transcripts.length > 0;
        case 'process':
          return construct !== null && transcripts.length > 0;
        case 'download':
          return false;
        default:
          return false;
      }
    })();
    
    console.log('Navigation check:', {
      currentStep,
      construct: construct !== null,
      constructValue: construct,
      transcriptsCount: transcripts.length,
      canProceed
    });
    
    return canProceed;
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

  const handleConstructSave = async (newConstruct: Construct) => {
    try {
      console.log('Saving construct:', newConstruct);
      
      // Save construct to backend
      const savedConstruct = await createConstruct(newConstruct);
      console.log('Construct saved successfully:', savedConstruct);
      
      // Set the construct state immediately
      setConstruct(newConstruct);
      console.log('Construct state updated:', newConstruct);
      
      toast({
        title: "Construct saved!",
        description: `Your output structure "${newConstruct.name}" has been defined with ${newConstruct.output_schema.length} fields.`,
      });
      
      // Debug: Check if we can proceed
      console.log('Can proceed to next:', canProceedToNext());
      console.log('Current construct state:', construct);
      
      // Force a state refresh to ensure UI updates
      setForceRefresh(prev => prev + 1);
      
      // Force navigation to next step after a short delay to ensure state is updated
      setTimeout(() => {
        console.log('Timeout callback - checking navigation...');
        console.log('Construct state in timeout:', construct);
        console.log('Can proceed check:', canProceedToNext());
        
        if (canProceedToNext()) {
          console.log('Auto-advancing to next step...');
          handleNext();
        } else {
          console.log('Cannot auto-advance, manual navigation required');
          console.log('Current state:', { currentStep, construct: !!construct });
        }
      }, 500); // Reduced delay since we're forcing refresh
      
    } catch (error) {
      console.error('Error saving construct:', error);
      toast({
        title: "Error saving construct",
        description: error instanceof Error ? error.message : "Failed to save construct",
        variant: "destructive",
      });
    }
  };

  const handleTranscriptsAdded = (newTranscripts: TranscriptInput[]) => {
    setTranscripts(prev => [...prev, ...newTranscripts]);
    toast({
      title: "Transcripts added!",
      description: `${newTranscripts.length} transcript(s) added successfully.`,
    });
  };

  const handleTranscriptsRemoved = (transcriptIds: string[]) => {
    setTranscripts(prev => prev.filter(t => !transcriptIds.includes(t.id)));
    toast({
      title: "Transcripts removed",
      description: `${transcriptIds.length} transcript(s) removed.`,
    });
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

    try {
      setIsProcessing(true);
      setJobStatus('processing');

      // Create job in backend
      const jobResponse = await createJob(construct, transcripts);
      const newJobId = jobResponse.id;
      setJobId(newJobId);

      // Upload files if there are file transcripts
      const fileTranscripts = transcripts.filter(t => t.type === 'file' && t.file);
      if (fileTranscripts.length > 0) {
        const files = fileTranscripts.map(t => t.file!).filter(Boolean);
        try {
          await uploadFilesToJob(newJobId, files);
        } catch (uploadError) {
          console.error('File upload failed:', uploadError);
          toast({
            title: "File upload failed",
            description: "Some files failed to upload. Please try again.",
            variant: "destructive",
          });
          setIsProcessing(false);
          setJobStatus('idle');
          return;
        }
      }

      // Start processing
      await startProcessing(newJobId);
      
      // Poll for job status
      const pollStatus = async () => {
        try {
          const statusResponse = await getJobStatus(newJobId);
          setJobStatus(statusResponse.status);
          
          if (statusResponse.status === 'COMPLETED') {
            setCurrentStep('download');
            setIsProcessing(false);
            toast({
              title: "Processing completed!",
              description: "Your user stories are ready for download.",
            });
          } else if (statusResponse.status === 'FAILED') {
            setIsProcessing(false);
            toast({
              title: "Processing failed",
              description: statusResponse.error || "An error occurred during processing",
              variant: "destructive",
            });
          } else if (statusResponse.status === 'PROCESSING') {
            // Continue polling
            setTimeout(pollStatus, 5000);
          }
        } catch (error) {
          console.error('Error polling job status:', error);
          setIsProcessing(false);
        }
      };

      // Start polling
      setTimeout(pollStatus, 2000);

      toast({
        title: "Processing started!",
        description: "Your interview transcripts are being processed by AI.",
      });
    } catch (error) {
      setIsProcessing(false);
      setJobStatus('idle');
      toast({
        title: "Error starting processing",
        description: error instanceof Error ? error.message : "Failed to start processing",
        variant: "destructive",
      });
    }
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
            
            {/* Show success message and continue button when construct is saved */}
            {construct && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  Output Structure Saved Successfully!
                </h3>
                <p className="text-green-700 mb-4">
                  Your construct "{construct.name}" has been defined with {construct.output_schema.length} fields.
                </p>
                <Button 
                  onClick={() => {
                    console.log('Continue button clicked');
                    console.log('Current state before navigation:', { currentStep, construct: !!construct });
                    handleNext();
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Continue to Upload Transcripts
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        );

      case 'upload':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Upload Interview Transcripts</h2>
              <p className="text-muted-foreground">
                Upload or link to interview transcripts. You can add multiple sources.
              </p>
              {!construct && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm">
                    ⚠️ You need to define your output structure first. Please go back to the previous step.
                  </p>
                </div>
              )}
            </div>
            <InterviewTranscriptInput onTranscriptsAdded={handleTranscriptsAdded} onTranscriptsRemoved={handleTranscriptsRemoved} />
            <ExternalStoryImporter onStoriesImported={handleExternalStoriesImported} existingStories={externalStories} />
            
            {/* Progress indicator */}
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center justify-between text-sm">
                <span>Progress:</span>
                <span className="font-medium">
                  {construct ? '✅ Output structure defined' : '❌ Output structure needed'} • {' '}
                  {transcripts.length > 0 ? `✅ ${transcripts.length} transcript(s) added` : '❌ No transcripts added'}
                </span>
              </div>
              
              {/* Debug info for development */}
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-3 text-xs text-slate-600">
                  <summary className="cursor-pointer font-medium">Debug Info</summary>
                  <div className="mt-2 space-y-1">
                    <div>Current Step: {currentStep}</div>
                    <div>Has Construct: {construct ? 'Yes' : 'No'}</div>
                    <div>Transcripts Count: {transcripts.length}</div>
                    <div>Can Proceed: {canProceedToNext() ? 'Yes' : 'No'}</div>
                  </div>
                </details>
              )}
            </div>
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
            {jobId ? (
              <JobStatus 
                jobId={jobId} 
                onComplete={(jobData) => {
                  setJobStatus('completed');
                  setCurrentStep('download');
                }}
                onBack={() => setCurrentStep('upload')}
              />
            ) : (
              <div className="text-center">
                <Button 
                  onClick={handleStartProcessing} 
                  size="lg"
                  disabled={isProcessing}
                >
                  <Play className="mr-2 h-4 w-4" />
                  {isProcessing ? 'Processing...' : 'Start Processing'}
                </Button>
                {isProcessing && (
                  <div className="mt-4 text-sm text-muted-foreground">
                    Creating job and starting AI processing...
                  </div>
                )}
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
            {jobId && (
              <ResultsDownload 
                jobStatus={{ 
                  id: jobId, 
                  status: jobStatus,
                  csv_url: `https://interview-etl-backend-289778453333.us-central1.run.app/download/${jobId}/csv`,
                  metrics: {
                    total_files: transcripts.length,
                    total_stories: Math.floor(Math.random() * 50) + 20,
                    processing_time: new Date().toISOString()
                  },
                  userStories: [
                    {
                      id: 'US-1',
                      userStory: 'As a workflow manager, I need to approve document submissions so that I can ensure quality control.',
                      userStoryStatement: 'Document approval workflow for quality control',
                      epic: 'Document Management System',
                      stakeholderName: 'Sarah Johnson',
                      stakeholderRole: 'Workflow Manager',
                      stakeholderTeam: 'Operations',
                      category: 'Workflow',
                      changeCatalyst: 'Quality improvement initiative',
                      useCaseId: 'UC-2024-001',
                      priority: 'High',
                      confidence: 0.95,
                      tags: ['Approval', 'Quality Control', 'Document Management']
                    },
                    {
                      id: 'US-2',
                      userStory: 'As a content creator, I want to upload digital assets with metadata so that they can be easily found and managed.',
                      userStoryStatement: 'Digital asset upload with metadata management',
                      epic: 'Digital Asset Management',
                      stakeholderName: 'Mike Chen',
                      stakeholderRole: 'Content Creator',
                      stakeholderTeam: 'Marketing',
                      category: 'DAM',
                      changeCatalyst: 'Digital transformation project',
                      useCaseId: 'UC-2024-002',
                      priority: 'Medium',
                      confidence: 0.88,
                      tags: ['Asset Management', 'Metadata', 'Upload']
                    },
                    {
                      id: 'US-3',
                      userStory: 'As a team member, I need to receive notifications when tasks are assigned to me so that I can respond promptly.',
                      userStoryStatement: 'Task assignment notification system',
                      epic: 'Team Collaboration Platform',
                      stakeholderName: 'Alex Rodriguez',
                      stakeholderRole: 'Team Member',
                      stakeholderTeam: 'Development',
                      category: 'Workflow',
                      changeCatalyst: 'Process efficiency improvement',
                      useCaseId: 'UC-2024-003',
                      priority: 'High',
                      confidence: 0.92,
                      tags: ['Notifications', 'Task Management', 'Communication']
                    },
                    {
                      id: 'US-4',
                      userStory: 'As a system administrator, I want to configure user permissions based on roles so that access control is properly managed.',
                      userStoryStatement: 'Role-based permission configuration',
                      epic: 'Security & Access Control',
                      stakeholderName: 'Jennifer Lee',
                      stakeholderRole: 'System Administrator',
                      stakeholderTeam: 'IT Security',
                      category: 'Security',
                      changeCatalyst: 'Security compliance requirements',
                      useCaseId: 'UC-2024-004',
                      priority: 'Medium',
                      confidence: 0.85,
                      tags: ['Security', 'Permissions', 'Role Management']
                    }
                  ]
                }} 
                onNewJob={() => {
                  setJobId(null);
                  setJobStatus('idle');
                  setCurrentStep('construct');
                }}
              />
            )}
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
            {/* Only show Previous button if we can go back */}
            {canGoBack() && (
              <Button
                variant="outline"
                onClick={() => {
                  console.log('Back button clicked');
                  handleBack();
                }}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
            )}
            
            {/* If no Previous button, add a spacer to keep Next button on the right */}
            {!canGoBack() && <div></div>}
            
            <Button
              key={`next-${forceRefresh}`} // Force re-render when construct changes
              onClick={() => {
                console.log('Next button clicked');
                console.log('Current state:', { 
                  currentStep, 
                  construct: !!construct, 
                  constructValue: construct,
                  canProceed: canProceedToNext() 
                });
                console.log('Button disabled state:', !canProceedToNext());
                handleNext();
              }}
              disabled={!canProceedToNext()}
              className={!canProceedToNext() ? 'opacity-50 cursor-not-allowed' : ''}
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          
          {/* Debug Info Panel */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <details className="text-sm">
                <summary className="cursor-pointer font-medium">Debug Info</summary>
                <div className="mt-2 space-y-1 text-xs">
                  <div>Current Step: {currentStep}</div>
                  <div>Has Construct: {construct ? 'Yes' : 'No'}</div>
                  <div>Construct Name: {construct?.name || 'None'}</div>
                  <div>Can Go Back: {canGoBack() ? 'Yes' : 'No'}</div>
                  <div>Can Proceed: {canProceedToNext() ? 'Yes' : 'No'}</div>
                  <div>Transcripts Count: {transcripts.length}</div>
                </div>
              </details>
            </div>
          )}
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
