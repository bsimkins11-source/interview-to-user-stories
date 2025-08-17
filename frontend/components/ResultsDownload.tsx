'use client';

import React, { useState } from 'react';
import { Download, FileText, BarChart3, Plus, CheckCircle, TrendingUp, Users, Target } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface ResultsDownloadProps {
  jobStatus: any;
  onNewJob: () => void;
}

export function ResultsDownload({ jobStatus, onNewJob }: ResultsDownloadProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!jobStatus?.csv_url) return;
    
    setIsDownloading(true);
    try {
      // Generate signed download URL if needed
      const downloadUrl = jobStatus.csv_url.startsWith('gs://') 
        ? await generateSignedDownloadUrl(jobStatus.id)
        : jobStatus.csv_url;
      
      // Create download link
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `user_stories_${jobStatus.id}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const generateSignedDownloadUrl = async (jobId: string) => {
    // This would call your backend to generate a signed download URL
    // For now, we'll simulate it
    return `https://api.example.com/download/${jobId}`;
  };

  const getPriorityDistribution = () => {
    // This would come from actual data analysis
    return {
      high: 25,
      medium: 45,
      low: 30
    };
  };

  const getCategoryBreakdown = () => {
    // This would come from actual data analysis
    return [
      { category: 'Workflow', count: 35, percentage: 35 },
      { category: 'Features', count: 28, percentage: 28 },
      { category: 'Process', count: 22, percentage: 22 },
      { category: 'Integration', count: 15, percentage: 15 }
    ];
  };

  const priorityDistribution = getPriorityDistribution();
  const categoryBreakdown = getCategoryBreakdown();

  return (
    <div className="space-y-6">
      {/* Success Summary */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-900">
            Processing Complete! 🎉
          </CardTitle>
          <CardDescription className="text-lg text-green-700">
            Your interview transcripts have been successfully transformed into structured user stories.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="text-2xl font-bold text-green-600">{jobStatus?.metrics?.total_files || 0}</div>
              <div className="text-sm text-green-700">Files Processed</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="text-2xl font-bold text-green-600">{jobStatus?.metrics?.total_stories || 0}</div>
              <div className="text-sm text-green-700">Stories Extracted</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="text-2xl font-bold text-green-600">
                {jobStatus?.metrics?.processing_time ? 
                  new Date(jobStatus.metrics.processing_time).toLocaleTimeString() : 
                  'N/A'
                }
              </div>
              <div className="text-sm text-green-700">Processing Time</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Download Section */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-slate-900 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Download Your Results
          </CardTitle>
          <CardDescription>
            Get your structured data in CSV format for analysis in Excel, Google Sheets, or other tools.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-blue-900">User Stories CSV</div>
                  <div className="text-sm text-blue-700">
                    {jobStatus?.metrics?.total_stories || 0} stories • {jobStatus?.output_schema?.length || 0} columns
                  </div>
                </div>
                <Button
                  onClick={handleDownload}
                  disabled={isDownloading || !jobStatus?.csv_url}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isDownloading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Preparing...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download CSV
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="text-sm text-slate-600">
              💡 <strong>Tip:</strong> The CSV file contains all extracted user stories with your defined schema. 
              You can open it in any spreadsheet application for further analysis and manipulation.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Insights */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-slate-900 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            Data Insights
          </CardTitle>
          <CardDescription>
            Quick overview of your extracted user stories and patterns.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Priority Distribution */}
            <div className="space-y-4">
              <h4 className="font-medium text-slate-900 flex items-center space-x-2">
                <Target className="w-4 h-4 text-red-500" />
                Priority Distribution
              </h4>
              <div className="space-y-3">
                {Object.entries(priorityDistribution).map(([priority, percentage]) => (
                  <div key={priority} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        priority === 'high' ? 'bg-red-500' : 
                        priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                      <span className="text-sm font-medium text-slate-700 capitalize">{priority}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-slate-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            priority === 'high' ? 'bg-red-500' : 
                            priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-600 w-8 text-right">{percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="space-y-4">
              <h4 className="font-medium text-slate-900 flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                Category Breakdown
              </h4>
              <div className="space-y-3">
                {categoryBreakdown.map((item) => (
                  <div key={item.category} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">{item.category}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-slate-200 rounded-full h-2">
                        <div 
                          className="h-2 bg-blue-500 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-600 w-12 text-right">
                        {item.count} ({item.percentage}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">
                  {jobStatus?.metrics?.total_stories || 0}
                </div>
                <div className="text-sm text-slate-600">Total Stories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">
                  {jobStatus?.construct?.output_schema?.length || 0}
                </div>
                <div className="text-sm text-slate-600">Output Columns</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">
                  {Object.keys(jobStatus?.construct?.defaults || {}).length}
                </div>
                <div className="text-sm text-slate-600">Default Values</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">
                  {jobStatus?.construct?.priority_rules?.length || 0}
                </div>
                <div className="text-sm text-slate-600">Priority Rules</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
        <CardHeader>
          <CardTitle className="text-xl text-purple-900">What's Next?</CardTitle>
          <CardDescription className="text-purple-700">
            Continue exploring and improving your interview data processing workflow.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-medium text-purple-900 mb-2">Analyze Results</h4>
                <p className="text-sm text-purple-700">
                  Import your CSV into analysis tools to identify patterns and insights.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-medium text-purple-900 mb-2">Share with Team</h4>
                <p className="text-sm text-purple-700">
                  Collaborate with stakeholders using the structured data format.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Plus className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-medium text-purple-900 mb-2">Process More Data</h4>
                <p className="text-sm text-purple-700">
                  Start a new job with different files or refine your construct.
                </p>
              </div>
            </div>

            <div className="text-center pt-4">
              <Button
                onClick={onNewJob}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3"
              >
                <Plus className="w-5 h-5 mr-2" />
                Start New Job
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
