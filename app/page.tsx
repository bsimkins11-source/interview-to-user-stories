"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Upload, FileText, Download, Play, ArrowRight, ArrowLeft, MessageCircle, Zap, Settings, Target, Rocket, Users, Brain, BarChart3, Shield, Zap as ZapIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { ConstructEditor } from '@/components/ConstructEditor';
import InterviewTranscriptInput from '@/components/InterviewTranscriptInput';
import ExternalStoryImporter from '@/components/ExternalStoryImporter';
import { JobStatus } from '@/components/JobStatus';
import { ResultsDownload } from '@/components/ResultsDownload';
import { GeminiAssistant } from '@/components/GeminiAssistant';
import { createConstruct, createJob, getJobStatus, APIError } from '@/lib/api';
import { RequirementsTable } from '@/components/RequirementsTable';
import { RequirementsConstructEditor } from '@/components/RequirementsConstructEditor';
import { EditableUserStoriesTable } from '@/components/EditableUserStoriesTable';

type Step = 'home' | 'construct' | 'upload' | 'process' | 'download' | 'userStories' | 'requirements_construct' | 'requirements';

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
  file?: File;
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
  const [currentStep, setCurrentStep] = useState<Step>('home');
  const [construct, setConstruct] = useState<Construct | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptInput[]>([]);
  const [externalStories, setExternalStories] = useState<ExternalStory[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string>('idle');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [forceRefresh, setForceRefresh] = useState(0);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [userStories, setUserStories] = useState<any[]>([]);
  const [requirementsConstruct, setRequirementsConstruct] = useState<any>(null);

  // Generate sample user stories for demonstration
  const generateSampleUserStories = () => {
    return [
      {
        id: 'US-001',
        userStory: 'As a product manager, I need to analyze interview transcripts to extract user requirements',
        userStoryStatement: 'Extract user requirements from interview data',
        epic: 'Interview Analysis',
        stakeholderName: 'Product Manager',
        stakeholderRole: 'Product Owner',
        stakeholderTeam: 'Product',
        category: 'Analytics',
        changeCatalyst: 'Need to understand user needs from interviews',
        useCaseId: 'UC-2024-001',
        priority: 'High' as const,
        confidence: 0.95,
        tags: ['interview', 'requirements', 'analysis'],
        lifecyclePhase: 'Discovery',
        source: 'AI Extraction',
        snippet: 'Product manager needs to analyze interview transcripts...'
      },
      {
        id: 'US-002',
        userStory: 'As a business analyst, I need to convert user stories into detailed requirements',
        userStoryStatement: 'Convert user stories to requirements',
        epic: 'Requirements Generation',
        stakeholderName: 'Business Analyst',
        stakeholderRole: 'Analyst',
        stakeholderTeam: 'Business',
        category: 'Requirements',
        changeCatalyst: 'Need structured requirements for development',
        useCaseId: 'UC-2024-002',
        priority: 'Medium' as const,
        confidence: 0.88,
        tags: ['requirements', 'conversion', 'development'],
        lifecyclePhase: 'Planning',
        source: 'AI Extraction',
        snippet: 'Business analyst needs to convert user stories...'
      },
      {
        id: 'US-003',
        userStory: 'As a developer, I need to understand the technical requirements from user stories',
        userStoryStatement: 'Understand technical requirements',
        epic: 'Technical Planning',
        stakeholderName: 'Developer',
        stakeholderRole: 'Software Engineer',
        stakeholderTeam: 'Engineering',
        category: 'Development',
        changeCatalyst: 'Need clear technical specifications',
        useCaseId: 'UC-2024-003',
        priority: 'High' as const,
        confidence: 0.92,
        tags: ['technical', 'specifications', 'development'],
        lifecyclePhase: 'Planning',
        source: 'AI Extraction',
        snippet: 'Developer needs to understand technical requirements...'
      }
    ];
  };

  // Generate sample requirements for demonstration
  const generateSampleRequirements = () => {
    return [
      {
        req_id: 'REQ-001',
        requirement: 'Implement interview transcript analysis system',
        priority_level: 'HIGH' as const,
        req_details: 'Build a system that can process interview transcripts and extract key insights using AI',
        source_story_id: 'US-001'
      },
      {
        req_id: 'REQ-002',
        requirement: 'Create requirements generation workflow',
        priority_level: 'MEDIUM' as const,
        req_details: 'Develop a workflow to convert user stories into detailed technical requirements',
        source_story_id: 'US-002'
      },
      {
        req_id: 'REQ-003',
        requirement: 'Design technical specification templates',
        priority_level: 'HIGH' as const,
        req_details: 'Create standardized templates for technical specifications based on user stories',
        source_story_id: 'US-003'
      }
    ];
  };

  // Initialize with sample data
  useEffect(() => {
    setUserStories(generateSampleUserStories());
    setRequirements(generateSampleRequirements());
  }, []);

  const { toast } = useToast();

  useEffect(() => {
    console.log('Construct state changed:', construct);
    console.log('Can proceed to next:', canProceedToNext());
  }, [construct]);

  useEffect(() => {
    if (construct) {
      setForceRefresh(prev => prev + 1);
    }
  }, [construct]);

  const steps = [
    { id: 'home', title: 'Welcome', icon: Rocket, description: 'Get started with your interview analysis' },
    { id: 'construct', title: 'Define Output Structure', icon: FileText, description: 'Define the structure for your user stories' },
    { id: 'upload', title: 'Upload Interview Transcripts', icon: Upload, description: 'Upload or link to interview transcripts' },
    { id: 'process', title: 'Process & Extract', icon: Play, description: 'AI-powered extraction and processing' },
    { id: 'download', title: 'Download Results', icon: Download, description: 'Get your structured user stories' },
    { id: 'userStories', title: 'Edit User Stories', icon: FileText, description: 'Review and edit your user stories' },
    { id: 'requirements_construct', title: 'Define Requirements Structure', icon: FileText, description: 'Define the structure for your requirements' },
    { id: 'requirements', title: 'Requirements', icon: FileText, description: 'Convert user stories to requirements' }
  ];

  const canProceedToNext = () => {
    const canProceed = (() => {
      switch (currentStep) {
        case 'home':
          return true; // Always can proceed from home
        case 'construct':
          return construct !== null && construct.name && construct.output_schema && construct.output_schema.length > 0;
        case 'upload':
          return construct !== null && transcripts.length > 0;
        case 'process':
          return construct !== null && transcripts.length > 0;
        case 'download':
          return construct !== null && transcripts.length > 0;
        case 'userStories':
          return construct !== null && transcripts.length > 0;
        case 'requirements_construct':
          return construct !== null && requirementsConstruct !== null && requirementsConstruct.name && requirementsConstruct.output_schema && requirementsConstruct.output_schema.length > 0;
        case 'requirements':
          return construct !== null && transcripts.length > 0 && requirementsConstruct !== null;
        default:
          return false;
      }
    })();
    
    console.log('Navigation check:', {
      currentStep,
      construct: construct !== null,
      constructValue: construct,
      constructValid: construct !== null && construct?.name && construct?.output_schema?.length > 0,
      requirementsConstruct: requirementsConstruct !== null,
      requirementsConstructValid: requirementsConstruct !== null && requirementsConstruct?.name && requirementsConstruct?.output_schema?.length > 0,
      transcriptsCount: transcripts.length,
      canProceed
    });
    
    return canProceed;
  };

  const canGoBack = () => {
    return currentStep !== 'home';
  };

  const handleGetStarted = () => {
    setCurrentStep('construct');
  };

  const handleNext = () => {
    console.log('handleNext called - checking if we can proceed...');
    console.log('canProceedToNext():', canProceedToNext());
    
    if (canProceedToNext()) {
      const currentIndex = steps.findIndex(step => step.id === currentStep);
      console.log('Current step index:', currentIndex, 'Total steps:', steps.length);
      
      if (currentIndex < steps.length - 1) {
        const nextStep = steps[currentIndex + 1].id as Step;
        console.log('Moving to next step:', nextStep);
        setCurrentStep(nextStep);
      }
    } else {
      console.log('Cannot proceed to next step');
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
      if (!newConstruct.name?.trim()) {
        toast({ title: "Validation Error", description: "Construct name is required.", variant: "destructive" });
        return;
      }
      if (!newConstruct.output_schema || newConstruct.output_schema.length === 0) {
        toast({ title: "Validation Error", description: "At least one output schema field is required.", variant: "destructive" });
        return;
      }

      // Optimistic update so navigation can proceed even if backend is unavailable
      setConstruct(newConstruct);
      setForceRefresh(prev => prev + 1);

      toast({
        title: "Construct saved!",
        description: `Your output structure "${newConstruct.name}" has been defined with ${newConstruct.output_schema.length} fields.`,
      });

      // Auto-advance if possible
      setTimeout(() => {
        if (canProceedToNext()) {
          handleNext();
        }
      }, 50);

      // Fire-and-forget backend save
      try {
        await createConstruct(newConstruct);
      } catch (apiError) {
        console.warn('Backend construct save failed; using local construct only.', apiError);
        toast({
          title: "Saved locally",
          description: "Backend not reachable. Proceeding with your local construct.",
        });
      }

    } catch (error) {
      console.error('Error saving construct:', error);
      let errorMessage = "Failed to save construct";
      if (error instanceof APIError) {
        errorMessage = error.message;
        if (error.code === 'VALIDATION_ERROR') {
          toast({ title: "Validation Error", description: errorMessage, variant: "destructive" });
          return;
        }
      }
      toast({ title: "Error saving construct", description: errorMessage, variant: "destructive" });
    }
  };

  const handleRequirementsConstructSave = async (newRequirementsConstruct: Construct) => {
    try {
      if (!newRequirementsConstruct.name?.trim()) {
        toast({ title: "Validation Error", description: "Requirements construct name is required.", variant: "destructive" });
        return;
      }
      if (!newRequirementsConstruct.output_schema || newRequirementsConstruct.output_schema.length === 0) {
        toast({ title: "Validation Error", description: "At least one output schema field is required.", variant: "destructive" });
        return;
      }

      // Optimistic update
      setRequirementsConstruct(newRequirementsConstruct);
      setForceRefresh(prev => prev + 1);

      toast({
        title: "Requirements construct saved!",
        description: `Your requirements structure "${newRequirementsConstruct.name}" has been defined with ${newRequirementsConstruct.output_schema.length} fields.`,
      });

      // Auto-advance if possible
      setTimeout(() => {
        if (canProceedToNext()) {
          handleNext();
        }
      }, 50);

      // Fire-and-forget backend save
      try {
        await createConstruct(newRequirementsConstruct);
      } catch (apiError) {
        console.warn('Backend requirements construct save failed; using local construct only.', apiError);
        toast({
          title: "Saved locally",
          description: "Backend not reachable. Proceeding with your local requirements construct.",
        });
      }

    } catch (error) {
      console.error('Error saving requirements construct:', error);
      let errorMessage = "Failed to save requirements construct";
      if (error instanceof APIError) {
        errorMessage = error.message;
        if (error.code === 'VALIDATION_ERROR') {
          toast({ title: "Validation Error", description: errorMessage, variant: "destructive" });
          return;
        }
      }
      toast({ title: "Error saving requirements construct", description: errorMessage, variant: "destructive" });
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
    if (!construct || !transcripts || transcripts.length === 0) {
      toast({
        title: "Missing Data",
        description: "Please ensure you have both a construct and transcripts before starting processing.",
        variant: "destructive"
      });
      return;
    }

    try {
      setJobStatus('processing');
      setProcessingProgress(0);

      // Create job
      const job = await createJob(construct, transcripts);
      setJobId(job.id);

      toast({
        title: "Processing Started",
        description: "Your interview data is being processed with AI. This may take a few minutes.",
      });

      // Poll for completion
      const pollInterval = setInterval(async () => {
        try {
          const status = await getJobStatus(job.id);
          setJobStatus(status.status);
          setProcessingProgress(status.progress || 0);

          if (status.status === 'COMPLETED') {
            clearInterval(pollInterval);
            setProcessingProgress(100);
            
            // Set requirements with sample data (TODO: fetch real data)
            setRequirements([
              {
                req_id: 'REQ-001',
                requirement: 'User authentication system',
                priority_level: 'HIGH',
                req_details: 'Implement secure user login and registration',
                source_story_id: 'US-001'
              },
              {
                req_id: 'REQ-002',
                requirement: 'Document management workflow',
                priority_level: 'MEDIUM',
                req_details: 'Create approval workflow for document submissions',
                source_story_id: 'US-002'
              }
            ]);
            
            toast({
              title: "Processing Complete!",
              description: "Your user stories have been extracted successfully.",
            });
            
            // Auto-advance to download step
            setTimeout(() => {
              handleNext();
            }, 1000);
          } else if (status.status === 'FAILED') {
            clearInterval(pollInterval);
            toast({
              title: "Processing Failed",
              description: "There was an error processing your data. Please try again.",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error('Error polling job status:', error);
        }
      }, 5000);

    } catch (error) {
      console.error('Error starting processing:', error);
      setJobStatus('idle');
      
      let errorMessage = "Failed to start processing";
      if (error instanceof APIError) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const getStepContent = () => {
    switch (currentStep) {
      case 'home':
        return (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-6">
                <Rocket className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-5xl font-bold text-gray-900">Transform Interviews into Requirements</h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Our AI-powered pipeline transforms stakeholder interviews into actionable requirements in minutes, not weeks.
              </p>
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold shadow-lg transform transition-all duration-200 hover:scale-105"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            {/* How It Works */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border-0 shadow-lg">
              <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">How It Works</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <FileText className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">1. Define Structure</h3>
                  <p className="text-gray-600">Design your output schema for user stories and requirements</p>
                </div>
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <Upload className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">2. Upload Interviews</h3>
                  <p className="text-gray-600">Upload interview transcripts, documents, or folders</p>
                </div>
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                    <Brain className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">3. AI Processing</h3>
                  <p className="text-gray-600">Gemini AI processes transcripts with full context awareness</p>
                </div>
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                    <Download className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">4. Get Results</h3>
                  <p className="text-gray-600">Download structured user stories and requirements</p>
                </div>
              </div>
            </div>

            {/* Key Features */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <ZapIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">AI-Powered Extraction</h3>
                  <p className="text-gray-600">Advanced Gemini AI with Vertex AI vectorization for context-aware processing</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Stakeholder Focus</h3>
                  <p className="text-gray-600">Extract insights from multiple stakeholders with cross-reference analysis</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Smart Analytics</h3>
                  <p className="text-gray-600">Intelligent categorization, prioritization, and business value identification</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Enterprise Ready</h3>
                  <p className="text-gray-600">Scalable architecture with comprehensive error handling and monitoring</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                    <Target className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Requirements Generation</h3>
                  <p className="text-gray-600">Convert user stories to detailed requirements with AI intelligence</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                    <MessageCircle className="w-6 h-6 text-yellow-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">AI Assistant</h3>
                  <p className="text-gray-600">Get help and guidance throughout the entire process</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      case 'construct':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Define Your Output Structure</h2>
              <p className="text-muted-foreground">Define the structure for your user stories. This will guide the AI extraction process.</p>
            </div>
            <ConstructEditor onSave={handleConstructSave} />
          </div>
        );
      case 'upload':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Upload Interview Transcripts</h2>
              <p className="text-muted-foreground">Upload or link to interview transcripts for AI processing.</p>
            </div>
            <InterviewTranscriptInput
              onTranscriptsAdded={handleTranscriptsAdded}
              onTranscriptsRemoved={handleTranscriptsRemoved}
            />
            <ExternalStoryImporter onStoriesImported={handleExternalStoriesImported} />
          </div>
        );
      case 'process':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Process & Extract</h2>
              <p className="text-muted-foreground">AI-powered extraction and processing of your interview data.</p>
            </div>
            <Button
              onClick={handleStartProcessing}
              disabled={isProcessing}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  Start AI Processing
                </>
              )}
            </Button>
            {isProcessing && <JobStatus 
              jobId={jobId!} 
              onComplete={(jobData) => {
                setJobStatus('completed');
                setCurrentStep('download');
              }}
              onBack={() => setCurrentStep('upload')}
            />}
          </div>
        );
      case 'download':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Download Results</h2>
              <p className="text-muted-foreground">Get your structured user stories and requirements.</p>
            </div>
            <ResultsDownload
              jobStatus={{
                id: jobId || 'temp-id',
                status: jobStatus,
                csv_url: '',
                userStories: [],
                metrics: {
                  total_files: transcripts.length,
                  total_stories: 0,
                  processing_time: new Date().toISOString()
                },
                construct: construct || undefined
              }}
              onNewJob={() => {
                setJobId(null);
                setJobStatus('idle');
                setCurrentStep('construct');
              }}
            />
          </div>
        );
      case 'userStories':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Edit User Stories</h2>
              <p className="text-muted-foreground">Review and edit your user stories based on the extracted data.</p>
            </div>
            <EditableUserStoriesTable
              userStories={userStories}
              onStoriesChange={setUserStories}
              onDownload={(stories) => {
                // This will trigger the CSV download functionality
                console.log('Downloading user stories:', stories);
              }}
            />
          </div>
        );
      case 'requirements_construct':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Define Requirements Structure</h2>
              <p className="text-muted-foreground">Define the structure for your requirements. This will guide the AI conversion process.</p>
            </div>
            <RequirementsConstructEditor onSave={handleRequirementsConstructSave} />
          </div>
        );
      case 'requirements':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Requirements</h2>
              <p className="text-muted-foreground">Convert user stories to requirements using AI.</p>
            </div>
            <RequirementsTable
              requirements={requirements}
              onRequirementsChange={setRequirements}
              onDownload={() => {
                // The RequirementsTable component already has built-in CSV download functionality
                // This prop is required by the interface but the component handles download internally
                console.log('Requirements download triggered');
              }}
            />
          </div>
        );
      default:
        return <div>Unknown step</div>;
    }
  };

  // Don't show navigation or Gemini Assistant on home page
  if (currentStep === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          {/* Gemini AI Assistant at the top for home page */}
          <div className="mb-8 max-w-4xl mx-auto">
            <GeminiAssistant 
              currentStep="home"
              construct={construct}
              userStories={[]}
            />
          </div>
          {getStepContent()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Simple Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Interview ETL</h1>
        </div>

        {/* Simple Progress Steps */}
        <div className="mb-8 max-w-4xl mx-auto">
          <div className="flex justify-center space-x-4">
            {steps.slice(1).map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  steps.findIndex(s => s.id === currentStep) > index + 1
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : steps.findIndex(s => s.id === currentStep) === index + 1
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-white border-gray-300 text-gray-500'
                }`}>
                  <step.icon className="w-5 h-5" />
                </div>
                {index < steps.slice(1).length - 1 && (
                  <div className={`w-12 h-0.5 ml-3 ${
                    steps.findIndex(s => s.id === currentStep) > index + 1 ? 'bg-blue-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Gemini AI Assistant at the top */}
        <div className="mb-8 max-w-4xl mx-auto">
          <GeminiAssistant 
            currentStep={currentStep}
            construct={construct}
            userStories={[]}
          />
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <Card className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <CardContent className="p-6">
              {getStepContent()}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            {canGoBack() && (
              <Button
                variant="outline"
                onClick={handleBack}
                size="sm"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
            )}
            
            {!canGoBack() && <div></div>}
            
            <Button
              key={`next-${forceRefresh}`}
              onClick={handleNext}
              disabled={!canProceedToNext()}
              className={`
                ${!canProceedToNext() 
                  ? 'opacity-50 cursor-not-allowed bg-gray-400' 
                  : 'bg-blue-600 hover:bg-blue-700'
                }
                px-6 py-2
              `}
              size="sm"
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
