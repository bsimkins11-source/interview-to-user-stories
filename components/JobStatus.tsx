'use client';

import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertCircle, FileText, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { apiEndpoints } from '../lib/api';
import { api } from '../lib/api';

interface JobStatusProps {
  jobId: string;
  onComplete: (jobData: any) => void;
  onBack: () => void;
}

const statusConfig = {
  CREATED: { label: 'Created', color: 'bg-blue-100 text-blue-800', icon: Clock },
  PROCESSING: { label: 'Processing', color: 'bg-yellow-100 text-yellow-800', icon: RefreshCw },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  FAILED: { label: 'Failed', color: 'bg-red-100 text-red-800', icon: AlertCircle },
};

export function JobStatus({ jobId, onComplete, onBack }: JobStatusProps) {
  const [jobData, setJobData] = useState<any>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const pollJob = async () => {
      try {
        const response = await api(apiEndpoints.jobs.get(jobId));
        setJobData(response);
        
        if (response.status === 'COMPLETED' || response.status === 'FAILED') {
          setIsPolling(false);
          if (response.status === 'COMPLETED') {
            onComplete(response);
          }
        }
      } catch (err) {
        setError('Failed to fetch job status');
        setIsPolling(false);
      }
    };

    // Initial fetch
    pollJob();

    // Poll every 5 seconds
    const interval = setInterval(pollJob, 5000);

    return () => clearInterval(interval);
  }, [jobId, onComplete]);

  const handleRefresh = async () => {
    setIsPolling(true);
    setError(null);
    try {
      const response = await api(apiEndpoints.jobs.get(jobId));
      setJobData(response);
      if (response.status === 'COMPLETED') {
        onComplete(response);
      }
    } catch (err) {
      setError('Failed to refresh job status');
    } finally {
      setIsPolling(false);
    }
  };

  if (!jobData) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Loading job status...</p>
      </div>
    );
  }

  const status = statusConfig[jobData.status as keyof typeof statusConfig];
  const StatusIcon = status?.icon || Clock;

  const getProgressValue = () => {
    switch (jobData.status) {
      case 'CREATED': return 10;
      case 'PROCESSING': return 60;
      case 'COMPLETED': return 100;
      case 'FAILED': return 100;
      default: return 0;
    }
  };

  const getStatusDescription = () => {
    switch (jobData.status) {
      case 'CREATED':
        return 'Your job has been created and is waiting to be processed.';
      case 'PROCESSING':
        return 'Our AI is analyzing your interview transcripts and extracting user stories. This typically takes 2-5 minutes.';
      case 'COMPLETED':
        return 'Processing complete! Your structured data is ready for download.';
      case 'FAILED':
        return 'There was an error processing your files. Please check the error details and try again.';
      default:
        return 'Processing your interview data...';
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <StatusIcon className="w-10 h-10 text-slate-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            {status?.label || 'Processing'}
          </CardTitle>
          <CardDescription className="text-lg text-slate-600">
            {getStatusDescription()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress Bar */}
          <div className="space-y-4 mb-6">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Progress</span>
              <span>{getProgressValue()}%</span>
            </div>
            <Progress value={getProgressValue()} className="w-full h-3" />
          </div>

          {/* Status Badge */}
          <div className="flex justify-center mb-6">
            <Badge className={`${status?.color} px-4 py-2 text-sm font-medium`}>
              <StatusIcon className="w-4 h-4 mr-2" />
              {status?.label}
            </Badge>
          </div>

          {/* Job Details */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-600">Job ID:</span>
              <span className="font-mono text-sm text-slate-900">{jobId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Created:</span>
              <span className="text-slate-900">
                {new Date(jobData.created_at).toLocaleString()}
              </span>
            </div>
            {jobData.updated_at && (
              <div className="flex justify-between">
                <span className="text-slate-600">Last Updated:</span>
                <span className="text-slate-900">
                  {new Date(jobData.updated_at).toLocaleString()}
                </span>
              </div>
            )}
            {jobData.metrics && (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-600">Files Processed:</span>
                  <span className="text-slate-900">{jobData.metrics.total_files}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Stories Extracted:</span>
                  <span className="text-slate-900">{jobData.metrics.total_stories}</span>
                </div>
              </>
            )}
          </div>

          {/* Error Details */}
          {jobData.status === 'FAILED' && jobData.error_message && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-800">Error Details</span>
              </div>
              <p className="text-red-700 text-sm">{jobData.error_message}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Steps */}
      {jobData.status === 'PROCESSING' && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">Processing Steps</CardTitle>
            <CardDescription>What's happening behind the scenes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <div className="font-medium text-slate-900">File Upload</div>
                  <div className="text-sm text-slate-500">ZIP file received and validated</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <div className="font-medium text-slate-900">Document Extraction</div>
                  <div className="text-sm text-slate-500">Processing TXT, DOCX, MD, and PDF files</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                </div>
                <div>
                  <div className="font-medium text-slate-900">AI Analysis</div>
                  <div className="text-sm text-slate-500">Gemini extracting user stories and patterns</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                  <FileText className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <div className="font-medium text-slate-400">Data Structuring</div>
                  <div className="text-sm text-slate-400">Applying construct template and defaults</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                  <FileText className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <div className="font-medium text-slate-400">Quality Assurance</div>
                  <div className="text-sm text-slate-400">Deduplication and confidence scoring</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Upload
        </Button>

        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isPolling}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${isPolling ? 'animate-spin' : ''}`} />
            {isPolling ? 'Polling...' : 'Refresh Status'}
          </Button>
        </div>
      </div>

      {/* Help Text */}
      <div className="text-center text-sm text-slate-500">
        <p>
          💡 <strong>Processing Time:</strong> Most jobs complete in 2-5 minutes. 
          Larger files or complex constructs may take longer. You can safely close this page and return later.
        </p>
      </div>
    </div>
  );
}
