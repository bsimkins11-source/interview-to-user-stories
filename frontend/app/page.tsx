'use client';

import React, { useState } from 'react';
import { ArrowRight, FileText, Upload, Settings, Download, CheckCircle, Circle } from 'lucide-react';
import { ConstructEditor } from '../components/ConstructEditor';
import { FileUpload } from '../components/FileUpload';
import { JobStatus } from '../components/JobStatus';
import { ResultsDownload } from '../components/ResultsDownload';
import { GeminiAssistant } from '../components/GeminiAssistant';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

const steps = [
  { id: 1, title: 'Define Structure', description: 'Configure your output format', icon: Settings },
  { id: 2, title: 'Upload Files', description: 'Upload interview transcripts', icon: Upload },
  { id: 3, title: 'Process', description: 'AI-powered extraction', icon: FileText },
  { id: 4, title: 'Download', description: 'Get your structured data', icon: Download },
];

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [construct, setConstruct] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [isAssistantMinimized, setIsAssistantMinimized] = useState(false);

  const handleConstructSave = (constructData) => {
    setConstruct(constructData);
    setCurrentStep(2);
  };

  const handleFileUpload = (jobData) => {
    setJobId(jobData.id);
    setJobStatus(jobData);
    setCurrentStep(3);
  };

  const handleJobComplete = (completedJob) => {
    setJobStatus(completedJob);
    setCurrentStep(4);
  };

  const resetToStep = (step) => {
    setCurrentStep(step);
    if (step === 1) {
      setConstruct(null);
      setJobId(null);
      setJobStatus(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-slate-900">Interview ETL</h1>
            </div>
            <div className="text-sm text-slate-500">
              Transform interviews into structured data
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stepper */}
        <div className="mb-12">
          <div className="flex items-center justify-center space-x-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              const isClickable = isCompleted || step.id === 1;

              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => isClickable && resetToStep(step.id)}
                      disabled={!isClickable}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                        isCompleted
                          ? 'bg-green-500 text-white cursor-pointer hover:bg-green-600'
                          : isCurrent
                          ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </button>
                    <div className="mt-2 text-center">
                      <div className={`text-sm font-medium ${
                        isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-slate-400'
                      }`}>
                        {step.title}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {step.description}
                      </div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 ${
                      isCompleted ? 'bg-green-500' : 'bg-slate-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="space-y-8">
          {currentStep === 1 && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-3xl font-bold text-slate-900">
                  Define Your Output Structure
                </CardTitle>
                <CardDescription className="text-lg text-slate-600 max-w-2xl mx-auto">
                  Configure how your interview transcripts will be transformed into structured data. 
                  Define columns, patterns, and defaults to match your exact needs.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConstructEditor onSave={handleConstructSave} />
              </CardContent>
            </Card>
          )}

          {currentStep === 2 && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-3xl font-bold text-slate-900">
                  Upload Interview Files
                </CardTitle>
                <CardDescription className="text-lg text-slate-600 max-w-2xl mx-auto">
                  Upload your interview transcripts in ZIP format. We support TXT, DOCX, MD, and PDF files.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload 
                  construct={construct}
                  onUploadComplete={handleFileUpload}
                  onBack={() => setCurrentStep(1)}
                />
              </CardContent>
            </Card>
          )}

          {currentStep === 3 && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-3xl font-bold text-slate-900">
                  Processing Your Files
                </CardTitle>
                <CardDescription className="text-lg text-slate-600 max-w-2xl mx-auto">
                  Our AI is extracting user stories and structuring your data according to your specifications.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <JobStatus 
                  jobId={jobId}
                  onComplete={handleJobComplete}
                  onBack={() => setCurrentStep(2)}
                />
              </CardContent>
            </Card>
          )}

          {currentStep === 4 && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-3xl font-bold text-slate-900">
                  Download Your Results
                </CardTitle>
                <CardDescription className="text-lg text-slate-600 max-w-2xl mx-auto">
                  Your structured data is ready! Download the CSV file and start analyzing your insights.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResultsDownload 
                  jobStatus={jobStatus}
                  onNewJob={() => resetToStep(1)}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Actions */}
        {currentStep > 1 && (
          <div className="mt-12 text-center">
            <Button
              variant="outline"
              onClick={() => resetToStep(1)}
              className="mr-4"
            >
              Start New Job
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('https://transparent-agent-hub-zeta.vercel.app/', '_blank')}
            >
              Browse More Agents
            </Button>
          </div>
        )}
      </div>

      {/* Gemini AI Assistant */}
      <GeminiAssistant
        currentStep={currentStep}
        construct={construct}
        jobStatus={jobStatus}
        isMinimized={isAssistantMinimized}
        onToggleMinimize={() => setIsAssistantMinimized(!isAssistantMinimized)}
      />
    </div>
  );
}
